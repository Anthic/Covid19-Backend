

import type { Request } from "express";

export interface IErrorResponse {
  
  success: false;
  
  message: string;
  
  statusCode: number;
  
  errorCode: string;
 
  path: string;
 
  method: string;

  timestamp: string;
 
  requestId: string;
 
  additionalData?: Record<string, unknown>;

  stack?: string;
}


export interface IProcessedError {
  statusCode: number;
  message: string;
  errorCode: string;
  additionalData?: Record<string, unknown>;
  isOperational: boolean;
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  originalError: Error | unknown;
}


export interface IRequestWithId extends Request {
  id?: string;
}

export interface IErrorLogContext {
  requestId: string;
  path: string;
  method: string;
  ip?: string;
  userAgent?: string;
  userId?: string;
  statusCode: number;
  errorCode: string;
  isOperational: boolean;
  timestamp: string;
}