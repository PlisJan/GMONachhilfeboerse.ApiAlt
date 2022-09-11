import express from "express";
import checkAuth from "middleware/checkAuth.middleware";
import userControllers from "controllers/users.controllers";
const router = express.Router();

router.post("/login", userControllers.userLogin);
router.post("/changePassword", checkAuth, userControllers.changePassword);
router.post("/addPersonalData", checkAuth, userControllers.addPersonalData);
router.post("/email", checkAuth, userControllers.updateEmail);
router.post("/phonenumber", checkAuth, userControllers.updatePhonenumber);
router.post("/name", checkAuth, userControllers.updateName);
router.get("/", checkAuth, userControllers.getMe);

export default router;
