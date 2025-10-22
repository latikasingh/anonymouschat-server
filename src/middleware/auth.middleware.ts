import { Request, Response, NextFunction } from "express";
import { catchAsyncError } from "./catchAsyncError.middleware";
import { UserSession } from "../models/userSession.schema";

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authenticate = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        status: 401,
        success: false,
        message: "Authentication required",
        error: "No token provided",
      });
    }

    try {
      // const decryptedToken = decryptToken();
      const session = await UserSession.findOne({
        token: token,
        expiresAt: { $gt: new Date() },
      }).populate("userId");

      if (!session) {
        return res.status(401).json({
          status: 401,
          success: false,
          message: "Invalid or expired session",
          error: "Authentication failed",
        });
      }

      // Add user to request object
      req.user = session.userId;
      next();
    } catch (error) {
      return res.status(401).json({
        status: 401,
        success: false,
        message: "Invalid token",
        error: "Authentication failed",
      });
    }
  }
);
