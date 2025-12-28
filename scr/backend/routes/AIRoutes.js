const express = require("express");
const router = express.Router();
const { getAdvice } = require("../controllers/AIController");
const { protect } = require("../middleware/authMiddleware");

router.post("/consult", protect, getAdvice);

module.exports = router;
