import express from "express";
import userRouter from "./userRouter.js"
import InquiryRouter from "./inquiryRouter.js";

const router = express.Router()
router.use("/user", userRouter)
router.use("/inquiry", InquiryRouter)

export default router