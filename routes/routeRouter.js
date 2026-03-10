import express from "express";
import userRouter from "./userRouter.js"
import InquiryRouter from "./inquiryRouter.js";
import categoryRouter from "./categoryRouter.js";
import inquiryTypeRouter from "./inquiryTypeRouter.js";
import documentRouter from "./documentRouter.js";
import documentType from "./documentTypeRouter.js";
import contentItemRouter from "./contentItemRouter.js";
import clientRouter from "./clientRouter.js";

const router = express.Router()
router.use("/api/user", userRouter)
router.use("/api/inquiry", InquiryRouter)
router.use("/api/documents/", documentRouter)
router.use("/api/content-items/", contentItemRouter)
router.use("/api/categories", categoryRouter)
router.use("/api/inquiry-types/", inquiryTypeRouter)
router.use("/api/document-types/", documentType)
router.use("/api/client/", clientRouter)

export default router