import express from "express";
import userRouter from "./userRouter.js"
import contentItem from "../models/ContentItem.js";
import contentItemRouter from "./contentItemRouter.js";
import InquiryRouter from "./inquiryRouter.js";

const router = express.Router()
router.use("/user", userRouter)
router.use("/inquiry", InquiryRouter)
router.use("/api/content-items/", contentItemRouter)

export default router