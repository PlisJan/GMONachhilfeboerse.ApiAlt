import express from "express";
import checkAuth from "middleware/checkAuth.middleware";
import offersController from "controllers/offers.controllers";
const router = express.Router();

router.get("/give", checkAuth, offersController.getGiveOffers);
router.get("/take", checkAuth, offersController.getTakeOffers);

export default router;
