import axios from "axios";
import { ConfigEnvVariable } from "../config/env";

const mlClient = axios.create({
  baseURL: ConfigEnvVariable.ML_API_URL,
  timeout: 8500,
  headers: { "Content-Type": "application/json" },
});
mlClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
      console.error("ML API Timeout Exceeded (Took more than 8.5s)");
    }
    return Promise.reject(error);
  },
);

export default mlClient;
