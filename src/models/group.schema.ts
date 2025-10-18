import { Document, Schema, model } from "mongoose";

export enum GroupMemberRole {
  ADMIN = "admin",
  MEMBER = "member"
}

interface IGroupMember {
  userId: Schema.Types.ObjectId;
  role: GroupMemberRole;
  joinedAt: Date;
}

export interface IGroup extends Document {
  name: string;
  description?: string;
  createdBy: Schema.Types.ObjectId;
  members: IGroupMember[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const groupMemberSchema = new Schema<IGroupMember>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  role: {
    type: String,
    enum: Object.values(GroupMemberRole),
    default: GroupMemberRole.MEMBER,
    required: true
  },
  joinedAt: { type: Date, default: Date.now }
});

const groupSchema = new Schema<IGroup>(
  {
    name: { type: String, required: true },
    description: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    members: [groupMemberSchema],
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Indexes for efficient querying
groupSchema.index({ "members.userId": 1 });
groupSchema.index({ createdBy: 1 });

export const Group = model<IGroup>("Group", groupSchema); 