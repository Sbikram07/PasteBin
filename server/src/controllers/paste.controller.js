const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const Paste = require("../models/Paste");
const generatePasteId = require("../utils/generateId");

const EXPIRY_OPTIONS = {
  "10m": 10 * 60 * 1000,
  "1h": 60 * 60 * 1000,
  "1d": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
  never: null,
};

function computeExpiresAt(expiry) {
  if (!expiry || expiry === "never" || !(expiry in EXPIRY_OPTIONS)) return null;
  const ms = EXPIRY_OPTIONS[expiry];
  return ms ? new Date(Date.now() + ms) : null;
}

// POST /api/pastes
async function createPaste(req, res) {
  try {
    const { title, content, language, expiry, password, burnAfterReading } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Paste content cannot be empty" });
    }
    if (content.length > 500_000) {
      return res.status(413).json({ message: "Paste exceeds maximum size (500KB)" });
    }

    const paste = new Paste({
      pasteId: generatePasteId(),
      title: title?.trim() || "Untitled paste",
      content,
      language: language || "plaintext",
      owner: req.user ? req.user.id : null,
      expiresAt: computeExpiresAt(expiry),
      burnAfterReading: !!burnAfterReading,
    });

    if (password) {
      await paste.setPassword(password);
    }

    let deleteToken = null;
    if (!req.user) {
      // Anonymous paste: issue a one-time delete token to the creator.
      deleteToken = crypto.randomBytes(24).toString("hex");
      paste.deleteTokenHash = await bcrypt.hash(deleteToken, 10);
    }

    await paste.save();

    res.status(201).json({
      pasteId: paste.pasteId,
      deleteToken, // null when owned by a logged-in user
      isProtected: !!paste.passwordHash,
      expiresAt: paste.expiresAt,
    });
  } catch (err) {
    console.error("[paste] create error:", err.message);
    res.status(500).json({ message: "Failed to create paste" });
  }
}

// GET /api/pastes/:id  (metadata + content if accessible)
async function getPaste(req, res) {
  try {
    const paste = await Paste.findOne({ pasteId: req.params.id }).populate(
      "owner",
      "username"
    );
    if (!paste) return res.status(404).json({ message: "Paste not found" });

    if (paste.expiresAt && paste.expiresAt < new Date()) {
      await paste.deleteOne();
      return res.status(404).json({ message: "Paste not found" });
    }

    const providedPassword = req.query.password || req.body?.password;
    const unlocked = await paste.comparePassword(providedPassword);

    if (paste.passwordHash && !unlocked) {
      return res.status(401).json({
        protected: true,
        message: "This paste is password protected",
      });
    }

    // Only increment/burn on a genuine content read, not metadata probes.
    const shouldBurn = paste.burnAfterReading;
    paste.views += 1;
    await paste.save();

    const payload = paste.toJSON();
    if (shouldBurn) {
      await paste.deleteOne();
      payload.burned = true;
    }

    res.json(payload);
  } catch (err) {
    console.error("[paste] get error:", err.message);
    res.status(500).json({ message: "Failed to fetch paste" });
  }
}

// GET /api/pastes/:id/raw
async function getRawPaste(req, res) {
  try {
    const paste = await Paste.findOne({ pasteId: req.params.id });
    if (!paste || (paste.expiresAt && paste.expiresAt < new Date())) {
      res.status(404).type("text/plain");
      return res.send("Paste not found");
    }

    const providedPassword = req.query.password;
    const unlocked = await paste.comparePassword(providedPassword);
    if (paste.passwordHash && !unlocked) {
      res.status(401).type("text/plain");
      return res.send("Password required");
    }

    paste.views += 1;
    await paste.save();
    const content = paste.content;
    if (paste.burnAfterReading) await paste.deleteOne();

    res.type("text/plain").send(content);
  } catch (err) {
    console.error("[paste] raw error:", err.message);
    res.status(500).type("text/plain").send("Failed to fetch paste");
  }
}

// GET /api/pastes/:id/stats
async function getStats(req, res) {
  try {
    const paste = await Paste.findOne({ pasteId: req.params.id })
      .populate("owner", "username")
      .select("-content");
    if (!paste) return res.status(404).json({ message: "Paste not found" });

    res.json({
      pasteId: paste.pasteId,
      title: paste.title,
      language: paste.language,
      views: paste.views,
      createdAt: paste.createdAt,
      expiresAt: paste.expiresAt,
      isProtected: !!paste.passwordHash,
      burnAfterReading: paste.burnAfterReading,
      owner: paste.owner ? paste.owner.username : null,
      sizeBytes: Buffer.byteLength(paste.content || "", "utf8"),
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch stats" });
  }
}

// DELETE /api/pastes/:id
async function deletePaste(req, res) {
  try {
    const paste = await Paste.findOne({ pasteId: req.params.id });
    if (!paste) return res.status(404).json({ message: "Paste not found" });

    if (paste.owner) {
      // Owned paste: only the logged-in owner can delete it.
      if (!req.user || String(paste.owner) !== String(req.user.id)) {
        return res.status(403).json({ message: "Not authorized to delete this paste" });
      }
    } else {
      // Anonymous paste: require the one-time delete token issued at creation.
      const token = req.headers["x-delete-token"] || req.body?.deleteToken;
      const valid = paste.deleteTokenHash && token
        ? await bcrypt.compare(token, paste.deleteTokenHash)
        : false;
      if (!valid) {
        return res.status(403).json({ message: "Valid delete token required" });
      }
    }

    await paste.deleteOne();
    res.json({ message: "Paste deleted" });
  } catch (err) {
    console.error("[paste] delete error:", err.message);
    res.status(500).json({ message: "Failed to delete paste" });
  }
}

// GET /api/pastes/mine  (dashboard)
async function getMyPastes(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);

    const [pastes, total] = await Promise.all([
      Paste.find({ owner: req.user.id })
        .select("-content")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Paste.countDocuments({ owner: req.user.id }),
    ]);

    res.json({
      pastes,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("[paste] mine error:", err.message);
    res.status(500).json({ message: "Failed to fetch your pastes" });
  }
}

module.exports = {
  createPaste,
  getPaste,
  getRawPaste,
  getStats,
  deletePaste,
  getMyPastes,
};
