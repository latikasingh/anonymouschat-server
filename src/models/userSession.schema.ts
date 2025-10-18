import { Document, Schema, model } from "mongoose";

interface IUserSession extends Document {
  userId: Schema.Types.ObjectId;
  token: string;
  deviceInfo: {
    os: string;
    browser: string;
    deviceType: string;
  };
  ipAddress: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
  };
  isActive: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSessionSchema = new Schema<IUserSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    token: { type: String, required: true, index: true },
    deviceInfo: {
      os: { type: String, required: true },
      browser: { type: String, required: true },
      deviceType: { type: String, required: true },
    },
    ipAddress: { type: String, required: true },
    location: {
      country: { type: String },
      region: { type: String },
      city: { type: String },
    },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date, index: { expires: 0 } },
  },
  { timestamps: true }
);

export const UserSession = model<IUserSession>(
  "UserSession",
  userSessionSchema
);
