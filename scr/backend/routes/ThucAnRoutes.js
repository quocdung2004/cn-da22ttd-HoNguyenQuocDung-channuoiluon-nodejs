const express = require("express");
const router = express.Router();
const {
  createFood,
  getAllFoods,
  getFoodById,
  updateFood,
  deleteFood
} = require("../controllers/ThucAnController");

const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.route("/")
  .get(getAllFoods)
  .post(createFood);

router.route("/:id")
  .get(getFoodById)
  .put(updateFood)
  .delete(deleteFood);

module.exports = router;


