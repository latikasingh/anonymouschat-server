export class ErrorHandler extends Error {
  statusCode: number;
  success: boolean;
  error: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
    this.error = true;

    Error.captureStackTrace(this, this.constructor);
  }
}
