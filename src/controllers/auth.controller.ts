import crypto from "crypto";
import { Request, Response } from "express";
import { UAParser } from "ua-parser-js";
import { catchAsyncError } from "../middleware/catchAsyncError.middleware";
import { sendOtpToUser, validateOtp } from "../services/otp.service";
import { EXPIRESTIME } from "../helpers/const";
import { getClientIp, ipInfo } from "../helpers/ip.helper";
import { UserSession } from "../models/userSession.schema";
import User, { UserRole } from "../models/user.shcema";
import ipChecker from "../middleware/ipChecker.middleware";

export const adminSignup = catchAsyncError(
  async (req: Request, res: Response) => {
    const { username, email, password, role } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "User already exists",
        error:
          existingUser.email === email
            ? "Email already in use"
            : "Username already taken",
      });
    }

    if (role && !Object.values(UserRole).includes(role)) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "Invalid role",
        error: "Role must be one of: admin, user",
      });
    }

    const newUser = new User({
      username,
      password,
      email,
      role: role || UserRole.USER,
    });
    await newUser.save();

    res.status(201).json({
      status: 201,
      success: true,
      message: "Signup successful",
      data: {
        userId: newUser._id,
        role: newUser.role,
      },
    });
  }
);

export const login = catchAsyncError(async (req: Request, res: Response) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user) {
    return res.status(404).json({
      status: 404,
      success: false,
      message: "User not found",
      error: "No user",
    });
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return res.status(401).json({
      status: 401,
      success: false,
      message: "Invalid password",
      error: "Authentication failed",
    });
  }

  const { email, role } = user;
  let responseSent = false;

  if (role !== "admin") {
    req.user = user;
    await new Promise<void>((resolve) => {
      const originalJson = res.json;
      const originalStatus = res.status;

      res.json = function (body: any) {
        responseSent = true;
        return originalJson.call(this, body);
      };

      res.status = function (code: number) {
        responseSent = true;
        return originalStatus.call(this, code);
      };

      ipChecker(req, res, () => {
        resolve();
      });
    });
  }

  if (!responseSent) {
    await sendOtpToUser(email, username);
    res.status(200).json({
      status: 200,
      success: true,
      message: "OTP sent to email",
    });
  }
});

export const verifyOtp = catchAsyncError(
  async (req: Request, res: Response) => {
    const { username, otp } = req.body;

    const isValid = await validateOtp(username, otp);
    if (!isValid) {
      return res.status(401).json({
        status: 401,
        success: false,
        message: "Invalid OTP",
        error: "Authentication failed",
      });
    }

    const sessionToken = crypto.randomBytes(32).toString("hex");

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "User not found",
        error: "No user",
      });
    }

    const ip =
      process.env.NODE_ENV === "development"
        ? process.env.DEV_PUBLIC_IP!
        : getClientIp(req);

    const parser = new UAParser(req.headers["user-agent"]);
    const result = parser.getResult();
    const deviceInfo = {
      os: result.os.name || "Unknown OS",
      browser: result.browser.name || "Unknown Browser",
      deviceType: result.device.type || "desktop",
    };

    const location = await ipInfo(ip);

    const expiresAt = new Date(Date.now() + EXPIRESTIME);

    await UserSession.create({
      userId: user._id,
      token: sessionToken,
      deviceInfo,
      ipAddress: ip,
      location,
      expiresAt,
    });

    res.status(200).json({
      status: 200,
      success: true,
      message: "OTP verified",
      data: { token: sessionToken },
    });
  }
);

export const role = catchAsyncError(async (req: Request, res: Response) => {
  const user = req.user;

  if (!user) {
    return res.status(404).json({
      status: 404,
      success: false,
      message: "User not found",
      error: "No user",
    });
  }

  res.status(200).json({
    status: 200,
    success: true,
    message: "User role retrieved successfully",
    data: {
      _id: user._id,
      username: user.username,
      role: user.role,
    },
  });
});
