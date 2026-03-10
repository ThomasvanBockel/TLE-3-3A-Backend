import express from "express";
import userRouter from "./userRouter.js"
import contentItemRouter from "./contentItemRouter.js";
import InquiryRouter from "./inquiryRouter.js";
import categoryRouter from "./categoryRouter.js";
import recommendationRouter from "./recommendationRouter.js";
import inquiryRouter from "./inquiryRouter.js";
import inquiryTypeRouter from "./inquiryTypeRouter.js";
import documentRouter from "./documentRouter.js";
import documentType from "./documentTypeRouter.js";
import apiRouter from "./apiRouter.js";
import clientRouter from "./clientRouter.js";

const router = express.Router()
router.use("/api/user", userRouter)
router.use("/api/inquiry", InquiryRouter)
router.use("/api/user", userRouter)
router.use("/api/inquiry", inquiryRouter)
router.use("/api/documents", documentRouter)
router.use("/api/content-items", contentItemRouter)
router.use("/api/categories", categoryRouter)
router.use("/api/recommendations", recommendationRouter)
router.use("/api/inquiry-types", inquiryTypeRouter)
router.use("/api/document-types", documentType)
router.use("/api", apiRouter)
router.use("/api/clients", clientRouter)

export default router