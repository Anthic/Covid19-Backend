import { Router } from "express";
import { authenticate, isAdmin } from "../../MiddleWare/auth.middleware";
import { validate } from "../../MiddleWare/validate.middleware";
import { predictSchema } from "./prediction.validation";
import { PredictionController } from "./prediction.controller";
import { predictionLimiter } from "../../MiddleWare/rateLimiter.middleware";

const predictionRouter = Router();

// POST /api/v1/predictions  — authenticated users only
predictionRouter.post(
  "/",
  authenticate,
  predictionLimiter,
  validate(predictSchema),
  PredictionController.createPrediction,
);

// GET /api/v1/predictions/history  — own history
predictionRouter.get(
  "/history",
  authenticate,
  PredictionController.getMyHistory,
);

// GET /api/v1/predictions/history/:userId  — admin only
predictionRouter.get(
  "/history/:userId",
  authenticate,
  isAdmin,
  PredictionController.getUserHistory,
);
// GET /api/v1/prediction/doctors?region=0&risk_level=Low Risk&limit=5
predictionRouter.get("/doctors", authenticate, PredictionController.getDoctors);

// GET /api/v1/prediction/regions
predictionRouter.get("/regions", authenticate, PredictionController.getRegions);
// GET /api/v1/prediction/analytics
predictionRouter.get(
  "/analytics",
  authenticate,
  PredictionController.getMyAnalytics,
);
export default predictionRouter;
