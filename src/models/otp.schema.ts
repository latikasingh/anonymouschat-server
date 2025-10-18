import { Schema, model, Document } from "mongoose";

interface IOtp extends Document {
  otp: string;
  username?: string;
  expiresAt: Date;
}

const otpSchema = new Schema<IOtp>(
  {
    otp: { type: String, required: true, index: true },
    username: { type: String, required: true, index: true },
    expiresAt: { type: Date, index: { expires: 0 } },
  },
  {
    timestamps: true,
  }
);

export const Otp = model<IOtp>("Otp", otpSchema);
