const express = require("express");
const router = express.Router();
const {
  createFeedingLog,
  getAllFeedingLogs,
  getFeedingLogsByTank,
  deleteFeedingLog
} = require("../controllers/NhatKyChoAnController");

const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.route("/")
  .get(getAllFeedingLogs)
  .post(createFeedingLog);

router.get("/tank/:tankId", getFeedingLogsByTank);

router.route("/:id")
  .delete(deleteFeedingLog);

module.exports = router;