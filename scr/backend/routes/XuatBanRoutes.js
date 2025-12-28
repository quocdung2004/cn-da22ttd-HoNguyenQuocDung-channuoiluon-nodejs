const express = require("express");
const router = express.Router();
const {
  createHarvest,
  getAllHarvests,
  getHarvestsByTank,
  deleteHarvest,
  updateHarvest
} = require("../controllers/XuatBanController");

const { protect } = require("../middleware/authMiddleware");

router.use(protect);

// 1. Gốc
router.route("/")
  .get(getAllHarvests)
  .post(createHarvest);

// 2. Theo Bể
router.get("/tank/:tankId", getHarvestsByTank);

// 3. Theo ID phiếu
router.route("/:id")
  .delete(deleteHarvest)
  .put(updateHarvest) ;
module.exports = router;
