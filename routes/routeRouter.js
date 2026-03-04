import express from "express";
import userRouter from "./userRouter.js"

const router = express.Router()
router.use("/user", userRouter)

export default router