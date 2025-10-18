import { Document, Schema, model, Types } from "mongoose";

export enum RequestStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected"
}

interface IUser {
  _id: Types.ObjectId;
  username: string;
  email: string;
}

interface IGroup {
  _id: Types.ObjectId;
  name: string;
}

export interface IGroupRequest extends Document {
  groupId: Types.ObjectId;
  userId: Types.ObjectId;
  status: RequestStatus;
  processedBy?: Types.ObjectId;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPopulatedGroupRequest extends Omit<IGroupRequest, 'userId' | 'groupId'> {
  userId: IUser;
  groupId: IGroup;
}

export interface ITransformedGroupRequest {
  _id: Types.ObjectId;
  status: RequestStatus;
  createdAt: Date;
  user: {
    _id: Types.ObjectId;
    username: string;
    email: string;
  };
  group: {
    _id: Types.ObjectId;
    name: string;
  };
}

const groupRequestSchema = new Schema<IGroupRequest>(
  {
    groupId: { type: Schema.Types.ObjectId, ref: "Group", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: Object.values(RequestStatus),
      default: RequestStatus.PENDING,
      required: true
    },
    processedBy: { type: Schema.Types.ObjectId, ref: "User" },
    processedAt: { type: Date }
  },
  { timestamps: true }
);

// Indexes for efficient querying
groupRequestSchema.index({ groupId: 1, userId: 1 }, { unique: true });
groupRequestSchema.index({ status: 1 });

export const GroupRequest = model<IGroupRequest>("GroupRequest", groupRequestSchema); 