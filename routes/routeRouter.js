import express from "express";
import userRouter from "./userRouter.js"
import contentItem from "../models/ContentItem.js";
import contentItemRouter from "./contentItemRouter.js";
import InquiryRouter from "./inquiryRouter.js";
import InquiryTypeRouter from "./inquiryTypeRouter.js";

const router = express.Router()
router.use("/user", userRouter)
router.use("/inquiry", InquiryRouter)
router.use("/api/content-items/", contentItemRouter)
router.use("/inquiry-types/", InquiryTypeRouter)

export default router