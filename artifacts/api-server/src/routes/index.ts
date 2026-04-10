import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dealsRouter from "./deals";
import aiRouter from "./ai";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dealsRouter);
router.use(aiRouter);

export default router;
