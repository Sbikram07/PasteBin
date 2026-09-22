const { customAlphabet } = require("nanoid");

// URL-safe alphabet, no ambiguous characters (no 0/O, 1/l/I)
const alphabet = "23456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";

// 8 characters gives ~10^14 possibilities - plenty for a paste ID
const generatePasteId = customAlphabet(alphabet, 8);

module.exports = generatePasteId;
