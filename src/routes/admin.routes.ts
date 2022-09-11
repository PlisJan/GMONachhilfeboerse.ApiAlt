import express from "express";
import checkAuth from "middleware/checkAuth.middleware";
import isAdmin from "middleware/isAdmin.middleware";
import adminControllers from "controllers/admin.controllers";
const router = express.Router();

// router.post('/signup', adminControllers.adminRegister);
// router.post('/login', adminControllers.adminLogin);
router.post(
    "/changeAdminState",
    checkAuth,
    isAdmin,
    adminControllers.changeAdminState
);
router.post("/import", checkAuth, isAdmin, adminControllers.importUser);
router.get(
    "/getStartPasswords",
    checkAuth,
    isAdmin,
    adminControllers.getStartPasswords
);
router.get("/", checkAuth, isAdmin, adminControllers.getAdmin);

export default router;
