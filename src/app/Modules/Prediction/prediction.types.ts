import type { Types } from "mongoose";

export interface IMLPredictRequest {
  age: number;
  gender: number;
  marital_status: number;
  employment_status: number;
  region: number;
  prev_chronic_conditions: number;
  allergic_reaction: number;
  receiving_immu0therapy: number;
}

export interface IMLPredictResponse {
  success: boolean;
  prediction: 0 | 1;
  risk_level: "Low Risk" | "Moderate Risk" | "High Risk";
  probability: number;
  confidence: number;
  feature_importance: Record<string, number>;
  timestamp: string;
}

export interface IPrediction {
  userId: Types.ObjectId;
  input: IMLPredictRequest;
  prediction: 0 | 1;
  risk_level: "Low Risk" | "Moderate Risk" | "High Risk";
  probability: number;
  confidence: number;
  feature_importance: Record<string, number>;
  mlTimestamp: string;
  createdAt: Date;
}


// types/doctor.ts

export interface IAvailability {
  days: string[];
  hours: string;
}

export interface IDoctor {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
  region: number;
  region_name: string;
  phone: string;
  email: string;
  rating: number;
  experience_years: number;
  languages: string[];
  consultation_fee: number;
  chamber_address: string;
  availability: IAvailability;
  qualifications: string[];
  specializations: string[];
}

export interface IDoctorsResponse {
  success: boolean;
  count: number;
  region: number;
  region_name: string;
  risk_level: string;
  doctors: IDoctor[];
}
//region
export interface IRegionsResponse {
  success: boolean;
  regions: Record<string, string>; // e.g. { "0": "Dhaka", "1": "Chittagong", ... }
}
export interface IAnalyticsResult {
  total: number;
  sideEffectCount: number;
  noSideEffectCount: number;
  avgProbability: number;
  avgConfidence: number;
  riskLevels: string[];
}