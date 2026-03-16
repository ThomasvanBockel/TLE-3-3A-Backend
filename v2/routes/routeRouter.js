import express from "express";
import userRouter from "./userRouter.js";
import contentItemRouter from "./contentItemRouter.js";
import InquiryRouter from "./inquiryRouter.js";
import recommendationRouter from "./recommendationRouter.js";
import inquiryRouter from "./inquiryRouter.js";
import categoryRouter from "./categoryRouter.js";
import inquiryTypeRouter from "./inquiryTypeRouter.js";
import documentRouter from "./documentRouter.js";
import documentTypeRouter from "./documentTypeRouter.js";
import apiRouter from "./apiRouter.js";
import clientRouter from "./clientRouter.js";
import reportRouter from "./reportRouter.js";
import seedRouter from "./seedRouter.js";

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
router.use("/api/document-types", documentTypeRouter)
router.use("/api", apiRouter)
router.use("/api/clients", clientRouter)
router.use("/api/seed", seedRouter)
router.use("/api/reports", reportRouter);

export default router;