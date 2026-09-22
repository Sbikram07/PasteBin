const express = require("express");
const {
  createPaste,
  getPaste,
  getRawPaste,
  getStats,
  deletePaste,
  getMyPastes,
} = require("../controllers/paste.controller");
const { requireAuth, optionalAuth } = require("../middleware/auth");
const { createPasteLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

// Order matters: /mine must be registered before the /:id catch-all.
router.get("/mine", requireAuth, getMyPastes);

router.post("/", createPasteLimiter, optionalAuth, createPaste);
router.get("/:id", getPaste);
router.get("/:id/raw", getRawPaste);
router.get("/:id/stats", getStats);
router.delete("/:id", optionalAuth, deletePaste);

module.exports = router;
