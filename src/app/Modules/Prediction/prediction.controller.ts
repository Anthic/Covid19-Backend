import type { Request, Response } from "express";
import { catchAsync } from "../../../utils/catchAsync";
import * as PredictionService from "./prediction.service";
import type { PredictInput } from "./prediction.validation";

import AppError from "../../errorHelper/AppError";

import type { IAuthRequest } from "../Auth/auth.types";

type PredictRequest = IAuthRequest<PredictInput>;

export const createPrediction = catchAsync(
  async (req: PredictRequest, res: Response) => {
    if (!req.user?._id) {
      throw new AppError("Unauthorized", 401, { errorCode: "UNAUTHORIZED" });
    }
    const result = await PredictionService.predict(req.user._id, req.body);
    res.status(201).json({ success: true, data: result });
  },
);
export const getMyHistory = catchAsync(async (req: IAuthRequest, res: Response) => {
  if (!req.user?._id) {
    throw new AppError("Unauthorized", 401, { errorCode: "UNAUTHORIZED" });
  }
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
  const history = await PredictionService.getMyHistory(
    req.user._id,
    page,
    limit,
  );
  res.status(200).json({ success: true, data: history });
});

export const getUserHistory = catchAsync(
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    if (!userId) throw new AppError("User ID is required", 400, {});

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const history = await PredictionService.getUserHistory(userId as string, page, limit);
    res.status(200).json({ success: true, data: history });
  },
);

export const getDoctors = catchAsync(async (req: Request, res: Response) => {
  const regionParam = req.query.region;
  const region = Number(regionParam);
  if (
    !regionParam ||
    typeof regionParam !== "string" ||
    regionParam.trim() === "" ||
    isNaN(region)
  ) {
    throw new AppError("Valid region is required", 400, {
      errorCode: "INVALID_REGION",
    });
  }
  const risk_level = req.query.risk_level as string;
  const limit = Number(req.query.limit) || 5;
  const data = await PredictionService.getDoctors(region, risk_level, limit);

  res.status(200).json({ success: true, data });
});
export const getRegions = catchAsync(async (_req: Request, res: Response) => {
  const data = await PredictionService.getRegions();
  res.status(200).json({ success: true, data });
});

export const getMyAnalytics = catchAsync(
  async (req: IAuthRequest, res: Response) => {
    if (!req.user?._id) {
      throw new AppError("Unauthorized", 401, { errorCode: "UNAUTHORIZED" });
    }
    const analytics = await PredictionService.getMyAnalytics(req.user._id);
    res.status(200).json({ success: true, data: analytics });
  },
);
export const PredictionController = {
  getUserHistory,
  getMyHistory,
  createPrediction,
  getDoctors,
  getRegions,
  getMyAnalytics,
};
