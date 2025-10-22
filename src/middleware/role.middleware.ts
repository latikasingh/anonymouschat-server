import { Request, Response, NextFunction } from "express";
import { UserRole } from "../models/user.shcema";
import { catchAsyncError } from "./catchAsyncError.middleware";

export const requireRole = (roles: UserRole[]) => {
  return catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
      // @ts-ignore - user will be set by auth middleware
      const userRole = req.user?.role;

      if (!userRole || !roles.includes(userRole)) {
        return res.status(403).json({
          status: 403,
          success: false,
          message: "Access denied",
          error: "Insufficient permissions",
        });
      }

      next();
    }
  );
};

// Specific role middleware functions
export const requireAdmin = requireRole([UserRole.ADMIN]);
export const requireUser = requireRole([UserRole.USER, UserRole.ADMIN]);
