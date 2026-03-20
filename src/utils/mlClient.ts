import axios from "axios";
import { ConfigEnvVariable } from "../config/env";

const mlClient = axios.create({
  baseURL: ConfigEnvVariable.ML_API_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

export default mlClient;
