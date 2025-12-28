const express = require("express");
const router = express.Router();
const {
  createFeedingLog,
  getAllFeedingLogs,
  getFeedingLogsByTank,
  updateFeedingLog,
  deleteFeedingLog
} = require("../controllers/NhatKyChoAnController");

const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.route("/")
  .get(getAllFeedingLogs)
  .post(createFeedingLog);

router.get("/tank/:tankId", getFeedingLogsByTank);

router.route("/:id")
  .put(updateFeedingLog)
  .delete(deleteFeedingLog);

module.exports = router;