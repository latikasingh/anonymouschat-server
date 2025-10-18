import { Document, Schema, model } from "mongoose";

export enum MessageType {
  DM = "dm",
  GROUP = "group"
}

export interface IChatMessage extends Document {
  senderId: Schema.Types.ObjectId;
  receiverId?: Schema.Types.ObjectId;  // For DM messages
  groupId?: Schema.Types.ObjectId;     // For group messages
  type: MessageType;
  content: string;
  isEncrypted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>(
  {
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: "User" },  // Optional for DM
    groupId: { type: Schema.Types.ObjectId, ref: "Group" },    // Optional for group
    type: {
      type: String,
      enum: Object.values(MessageType),
      required: true
    },
    content: { type: String, required: true },
    isEncrypted: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Indexes for efficient querying
chatMessageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
chatMessageSchema.index({ groupId: 1, createdAt: -1 });

export const ChatMessage = model<IChatMessage>("ChatMessage", chatMessageSchema); 