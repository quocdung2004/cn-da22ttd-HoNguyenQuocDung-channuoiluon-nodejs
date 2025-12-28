const express = require("express");
const router = express.Router();
const {
  createExpense,
  getAllExpenses,
  updateExpense,
  deleteExpense
} = require("../controllers/ChiPhiVanHanhController");

const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.route("/")
  .get(getAllExpenses)
  .post(createExpense);

router.route("/:id")
  .put(updateExpense)
  .delete(deleteExpense);

module.exports = router;