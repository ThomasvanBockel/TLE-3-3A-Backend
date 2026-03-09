import express from "express";
import userRouter from "./userRouter.js"
import contentItemRouter from "./contentItemRouter.js";
import InquiryRouter from "./inquiryRouter.js";
import categoryRouter from "./categoryRouter.js";
import inquiryRouter from "./inquiryRouter.js";
import inquiryTypeRouter from "./inquiryTypeRouter.js";
import documentRouter from "./documentRouter.js";
import documentType from "./documentTypeRouter.js";

const router = express.Router()
router.use("/api/user", userRouter)
router.use("/api/inquiry", InquiryRouter)
router.use("/user", userRouter)
router.use("/inquiry", inquiryRouter)
router.use("/documents/", documentRouter)
router.use("/api/content-items/", contentItemRouter)
router.use("/api/categories", categoryRouter)
router.use("/inquiry-types/", inquiryTypeRouter)
router.use("/document-types/", documentType)

export default router