import express from "express";
import checkAuth from "@/middleware/checkAuth.middleware";
import offersController from "@/controllers/offers.controllers";
const router = express.Router();

router.get("/give", checkAuth, offersController.getGiveOffers);
router.get("/take", checkAuth, offersController.getTakeOffers);
router.post("/give", checkAuth, offersController.addGiveOffer);
router.post("/take", checkAuth, offersController.addTakeOffer);
router.delete("/give", checkAuth, offersController.delGiveOffer);
router.delete("/take", checkAuth, offersController.delTakeOffer);
export default router;
