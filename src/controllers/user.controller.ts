import { Request, Response } from "express";
import { catchAsyncError } from "../middleware/catchAsyncError.middleware";
import User, { UserRole } from "../models/user.shcema";
import { UserSession } from "../models/userSession.schema";

// Get all users
export const getAllUsers = catchAsyncError(
  async (req: Request, res: Response) => {
    const currentUser = req.user!;
    const isAdmin = currentUser.role === UserRole.ADMIN;

    const projection: any = { password: 0 };

    if (!isAdmin) {
      projection.email = 0;
    }

    const users = await User.find({}, projection).sort({ createdAt: -1 });

    res.status(200).json({
      status: 200,
      success: true,
      message: "Users retrieved successfully",
      data: users,
    });
  }
);

// Remove user
export const removeUser = catchAsyncError(
  async (req: Request, res: Response) => {
    const { userId } = req.params;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "User not found",
        error: "No user found with the provided ID",
      });
    }

    // Prevent removing the last admin
    if (user.role === "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return res.status(400).json({
          status: 400,
          success: false,
          message: "Cannot remove the last admin",
          error: "At least one admin must remain in the system",
        });
      }
    }

    // Delete all user sessions
    await UserSession.deleteMany({ userId });

    // Delete the user
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      status: 200,
      success: true,
      message: "User removed successfully",
    });
  }
);
