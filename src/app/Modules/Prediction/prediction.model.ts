import mongoose, { Schema } from "mongoose";
import type { IPrediction } from "./prediction.types";

const predictionSchema = new Schema<IPrediction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    input: { type: Schema.Types.Mixed, required: true },
    prediction: { type: Number, enum: [0, 1], required: true },
    risk_level: {
      type: String,
      enum: ["Low Risk", "Moderate Risk", "High Risk"],
      required: true,
    },
    probability: { type: Number, required: true },
    confidence: { type: Number, required: true },
    feature_importance: { type: Schema.Types.Mixed, required: true },
    mlTimestamp: { type: String, required: true },
  },
  { timestamps: true },
);

const Prediction = mongoose.model<IPrediction>("Prediction", predictionSchema);
export default Prediction;