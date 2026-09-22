const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const pasteSchema = new mongoose.Schema(
  {
    pasteId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "Untitled paste",
    },
    content: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      default: "plaintext",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // null = anonymous paste
    },
    passwordHash: {
      type: String,
      default: null,
    },
    // TTL-based expiration. When set, MongoDB removes the doc automatically.
    expiresAt: {
      type: Date,
      default: null,
    },
    burnAfterReading: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },
    // Hashed token allowing an anonymous (non-owner) creator to delete
    // their own paste later, since they have no account to prove ownership.
    deleteTokenHash: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// TTL index: MongoDB will auto-delete documents once expiresAt passes.
pasteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

pasteSchema.virtual("isProtected").get(function () {
  return !!this.passwordHash;
});

pasteSchema.methods.setPassword = async function (plain) {
  this.passwordHash = plain ? await bcrypt.hash(plain, 10) : null;
};

pasteSchema.methods.comparePassword = function (candidate) {
  if (!this.passwordHash) return true;
  return bcrypt.compare(candidate || "", this.passwordHash);
};

pasteSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.deleteTokenHash;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Paste", pasteSchema);
