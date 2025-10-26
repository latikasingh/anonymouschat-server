import { Request, Response } from "express";
import { BlockedIp } from "../models/blockedIp.schema";
import { catchAsyncError } from "../middleware/catchAsyncError.middleware";
import { clearIpCache } from "../helpers/cache.helper";

export const getAllBlocked = catchAsyncError(
  async (req: Request, res: Response) => {
    const blocked = await BlockedIp.find();
    res.status(200).json({
      status: 200,
      success: true,
      message: "Blocked entries fetched successfully",
      data: blocked,
    });
  }
);

export const setBlocked = catchAsyncError(
  async (req: Request, res: Response) => {
    const { value, type } = req.body;

    if (!value || !["country", "region", "city", "ip"].includes(type)) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "Invalid input",
        error: "Value and valid type are required",
      });
    }

    const exists = await BlockedIp.findOne({ value, type });
    if (exists) {
      return res.status(409).json({
        status: 409,
        success: false,
        message: "Entry already blocked",
        error: "Duplicate block",
      });
    }

    // Clear cache for the blocked value
    clearIpCache(value, "allow");

    const blocked = await BlockedIp.create({ value, type });

    res.status(201).json({
      status: 201,
      success: true,
      message: "Entry successfully blocked",
      data: blocked,
    });
  }
);

export const unblock = catchAsyncError(async (req: Request, res: Response) => {
  const { id } = req.params;

  const blockedEntry = await BlockedIp.findById(id);
  if (!blockedEntry) {
    return res.status(404).json({
      status: 404,
      success: false,
      message: "Block entry not found",
      error: "Not found",
    });
  }

  // Clear cache for the unblocked value
  clearIpCache(blockedEntry.value, "block");

  await BlockedIp.findByIdAndDelete(id);

  res.status(200).json({
    status: 200,
    success: true,
    message: "Unblocked successfully",
    data: { id },
  });
});
