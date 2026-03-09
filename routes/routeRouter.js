import express from "express";
import userRouter from "./userRouter.js"
import contentItem from "../models/ContentItem.js";
import contentItemRouter from "./contentItemRouter.js";
import InquiryRouter from "./inquiryRouter.js";
import categoryRouter from "./categoryRouter.js";

const router = express.Router()
router.use("/api/user", userRouter)
router.use("/api/inquiry", InquiryRouter)
router.use("/api/content-items/", contentItemRouter)
router.use("/api/categories", categoryRouter)

export default router