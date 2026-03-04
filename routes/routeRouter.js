import express from "express";
import userRouter from "./userRouter.js"

const router = express.Router()
router.use("/user", userRouter)
// router.use("/content", contentRouter)

export default router