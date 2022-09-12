import express from "express";
import checkAuth from "middleware/checkAuth.middleware";
import userControllers from "controllers/users.controllers";
const router = express.Router();

router.post("/login", userControllers.userLogin);
router.post("/changePassword", checkAuth, userControllers.changePassword);
router.post("/addPersonalData", checkAuth, userControllers.addPersonalData);
router.put("/email", checkAuth, userControllers.updateEmail);
router.put("/phonenumber", checkAuth, userControllers.updatePhonenumber);
router.put("/name", checkAuth, userControllers.updateName);
router.get("/", checkAuth, userControllers.getMe);

export default router;
