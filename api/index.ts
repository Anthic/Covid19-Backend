import mongoose from "mongoose";
import app from "../src/app";
import { ConfigEnvVariable } from "../src/config/env";

// Connect DB once (serverless এ প্রতি request এ reconnect হয়)
const connectDB = async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(ConfigEnvVariable.MONGO_URL, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
  }
};

// DB connect করে app export করো
const handler = async (req: any, res: any) => {
  await connectDB();
  return app(req, res);
};

export default handler;