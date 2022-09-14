import express from "express";
import checkAuth from "@/middleware/checkAuth.middleware";
import offersController from "@/controllers/subjects.controllers";
const router = express.Router();

router.get("/", offersController.getSubjects);
export default router;
