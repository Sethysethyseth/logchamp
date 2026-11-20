const express = require("express");
const authRequired = require("../middleware/authRequired");
const {
  getSummary,
  getExerciseIndex,
  getExerciseDetail,
  getBlockRuns,
  getBlockRunSummary,
} = require("../controllers/analyticsController");

const router = express.Router();

router.get("/summary", authRequired, getSummary);
router.get("/exercises", authRequired, getExerciseIndex);
router.get("/exercise", authRequired, getExerciseDetail);
router.get("/block-runs", authRequired, getBlockRuns);
router.get("/block-run/:id", authRequired, getBlockRunSummary);

module.exports = router;
