import { Response } from "express";
import { encryptData } from "./encryption";

interface ResponseOptions {
  code: number;
  message?: string;
  data?: any;
  success?: boolean;
  error?: any;
}

const sendResponse = (
  res: Response,
  options: ResponseOptions | string,
  data?: any
) => {
  if (typeof options === "string") {
    options = { code: 200, message: options };
  }

  const statusCode =
    options.code && Number.isInteger(options.code)
      ? Math.min(Math.max(options.code, 100), 599)
      : 500;

  const isSuccess =
    options.success !== undefined ? options.success : statusCode < 400;

  const response: Record<string, any> = {
    success: isSuccess,
    status: statusCode,
    message: options.message || (isSuccess ? "Success" : "Error"),
  };

  if (isSuccess) {
    response.data = data || options.data || "";
  } else {
    response.error = options.error || options.message || "An error occurred";
    if (options.data !== undefined) {
      response.details = options.data;
    }
  }

  return res
    .status(statusCode)
    .json({ data: encryptData(JSON.stringify(response)) });
};

export default sendResponse;
