import { Document, Schema, model } from "mongoose";

interface IBlockedIp extends Document {
  value: string;
  type: "country" | "region" | "city" | "ip";
}

const blockedIpSchema = new Schema<IBlockedIp>({
  value: { type: String, required: true, unique: true },
  type: {
    type: String,
    enum: ["country", "region", "city", "ip"],
    required: true,
  },
});

export const BlockedIp = model<IBlockedIp>("BlockedIp", blockedIpSchema);
