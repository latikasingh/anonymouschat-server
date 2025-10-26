import { Request, Response } from "express";
import { catchAsyncError } from "../middleware/catchAsyncError.middleware";
import { ChatMessage, MessageType } from "../models/chatMessage.schema";
import { Group, GroupMemberRole } from "../models/group.schema";
import { GroupRequest, RequestStatus } from "../models/groupRequest.schema";
import { encryptData } from "../helpers/encryption";
import { Types } from "mongoose";
import User, { UserRole } from "../models/user.shcema";

// Get chat history for DM
export const getDMChatHistory = catchAsyncError(
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    const currentUser = req.user!;

    const messages = await ChatMessage.find({
      type: MessageType.DM,
      $or: [
        { senderId: currentUser._id, receiverId: userId },
        { senderId: userId, receiverId: currentUser._id },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Decrypt messages if needed
    const decryptedMessages = messages.map((msg) => ({
      ...msg,
      content: msg.isEncrypted ? encryptData(msg.content) : msg.content,
    }));

    res.status(200).json({
      status: 200,
      success: true,
      message: "Chat history retrieved successfully",
      data: decryptedMessages.reverse(),
    });
  }
);

// Get group chat history
export const getGroupChatHistory = catchAsyncError(
  async (req: Request, res: Response) => {
    const { groupId } = req.params;
    const currentUser = req.user!;

    // Verify user is group member
    const group = await Group.findOne({
      _id: groupId,
      "members.userId": currentUser._id,
      isActive: true,
    });

    if (!group) {
      return res.status(403).json({
        status: 403,
        success: false,
        message: "Not a member of this group",
        error: "Access denied",
      });
    }

    const messages = await ChatMessage.find({
      type: MessageType.GROUP,
      groupId,
    })
      .populate("senderId", "username _id")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.status(200).json({
      status: 200,
      success: true,
      message: "Group chat history retrieved successfully",
      data: messages.reverse(),
    });
  }
);

// Create new group
export const createGroup = catchAsyncError(
  async (req: Request, res: Response) => {
    const { name, description } = req.body;
    const currentUser = req.user!;

    const group = await Group.create({
      name,
      description,
      createdBy: currentUser._id,
      members: [
        {
          userId: currentUser._id,
          role: GroupMemberRole.ADMIN,
        },
      ],
    });

    res.status(201).json({
      status: 201,
      success: true,
      message: "Group created successfully",
      data: group,
    });
  }
);

// Get user's groups
export const getUserGroups = catchAsyncError(
  async (req: Request, res: Response) => {
    const currentUser = req.user!;

    const groups = await Group.aggregate([
      {
        $match: {
          isActive: true,
          "members.userId": currentUser._id,
        },
      },
      // Add memberCount field
      {
        $addFields: {
          memberCount: { $size: "$members" },
          isAdmin: {
            $gt: [
              {
                $size: {
                  $filter: {
                    input: "$members",
                    as: "m",
                    cond: {
                      $and: [
                        { $eq: ["$$m.userId", currentUser._id] },
                        { $eq: ["$$m.role", "admin"] },
                      ],
                    },
                  },
                },
              },
              0,
            ],
          },
        },
      },
      // Lookup usernames for all members
      {
        $lookup: {
          from: "users",
          localField: "members.userId",
          foreignField: "_id",
          as: "userInfos",
        },
      },
      // Conditionally add usernames to members if current user is admin
      {
        $addFields: {
          members: {
            $map: {
              input: "$members",
              as: "member",
              in: {
                $mergeObjects: [
                  "$$member",
                  {
                    $cond: [
                      "$isAdmin",
                      {
                        username: {
                          $arrayElemAt: [
                            {
                              $map: {
                                input: {
                                  $filter: {
                                    input: "$userInfos",
                                    as: "u",
                                    cond: {
                                      $eq: ["$$u._id", "$$member.userId"],
                                    },
                                  },
                                },
                                as: "u",
                                in: "$$u.username",
                              },
                            },
                            0,
                          ],
                        },
                      },
                      {}, // don't add username if not admin
                    ],
                  },
                ],
              },
            },
          },
        },
      },
      {
        $project: {
          userInfos: 0, // remove the temporary user info array
        },
      },
    ]);

    res.status(200).json({
      status: 200,
      success: true,
      message: "Groups retrieved successfully",
      data: groups,
    });
  }
);

export const getAvailableGroups = catchAsyncError(
  async (req: Request, res: Response) => {
    const currentUser = req.user!;

    const data = await Group.aggregate([
      {
        $match: {
          isActive: true,
          members: {
            $not: {
              $elemMatch: {
                userId: currentUser._id,
              },
            },
          },
        },
      },
      {
        $lookup: {
          from: "grouprequests",
          let: { groupId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$groupId", "$$groupId"] },
                    { $eq: ["$userId", currentUser._id] },
                  ],
                },
              },
            },
            {
              $project: {
                _id: 0,
                status: 1,
              },
            },
          ],
          as: "grouprequests",
        },
      },
      {
        $addFields: {
          requestStatus: {
            $let: {
              vars: {
                request: { $arrayElemAt: ["$grouprequests", 0] },
              },
              in: {
                $cond: [
                  { $eq: ["$$request.status", "approved"] },
                  null,
                  "$$request.status",
                ],
              },
            },
          },
          members: { $size: "$members" },
        },
      },
      { $unset: "grouprequests" },
    ]);

    res.status(200).json({
      status: 200,
      success: true,
      message: "Groups where user is not a member retrieved successfully",
      data: data,
    });
  }
);

// Request to join group
export const requestJoinGroup = catchAsyncError(
  async (req: Request, res: Response) => {
    const { groupId } = req.params;
    const currentUser = req.user!;

    // Check if group exists and is active
    const group = await Group.findOne({ _id: groupId, isActive: true });
    if (!group) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "Group not found",
        error: "Invalid group",
      });
    }

    // Check if user is already a member
    const isMember = group.members.some(
      (member) => member.userId.toString() === currentUser._id.toString()
    );
    if (isMember) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "Already a member of this group",
        error: "Duplicate membership",
      });
    }

    // Create join request
    const request = await GroupRequest.create({
      groupId,
      userId: currentUser._id,
      status: RequestStatus.PENDING,
    });

    res.status(201).json({
      status: 201,
      success: true,
      message: "Join request sent successfully",
      data: request,
    });
  }
);

// Handle group join request (approve/reject)
export const handleJoinRequest = catchAsyncError(
  async (req: Request, res: Response) => {
    const { requestId } = req.params;
    const { action } = req.body;
    const currentUser = req.user!;

    const request = await GroupRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "Request not found",
        error: "Invalid request",
      });
    }

    // Verify current user is group admin
    const group = await Group.findOne({
      _id: request.groupId,
      "members.userId": currentUser._id,
      "members.role": GroupMemberRole.ADMIN,
      isActive: true,
    });

    if (!group) {
      return res.status(403).json({
        status: 403,
        success: false,
        message: "Not authorized to handle requests",
        error: "Access denied",
      });
    }

    if (action === "approve") {
      // Add user to group
      await Group.findByIdAndUpdate(request.groupId, {
        $push: {
          members: {
            userId: request.userId,
            // role: GroupMemberRole.ADMIN,
          },
        },
      });

      request.status = RequestStatus.APPROVED;
    } else if (action === "reject") {
      request.status = RequestStatus.REJECTED;
    } else {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "Invalid action",
        error: "Action must be 'approve' or 'reject'",
      });
    }

    request.processedBy = currentUser._id;
    request.processedAt = new Date();
    await request.save();

    await GroupRequest.findByIdAndDelete(requestId);

    res.status(200).json({
      status: 200,
      success: true,
      message: `Request ${action}ed successfully and removed from requests`,
    });
  }
);

// Remove user from group (admin only)
export const removeFromGroup = catchAsyncError(
  async (req: Request, res: Response) => {
    const { groupId, userId } = req.params;
    const currentUser = req.user!;

    // Verify current user is group admin
    const group = await Group.findOne({
      _id: groupId,
      "members.userId": currentUser._id,
      "members.role": GroupMemberRole.ADMIN,
      isActive: true,
    });

    if (!group) {
      return res.status(403).json({
        status: 403,
        success: false,
        message: "Not authorized to remove members",
        error: "Access denied",
      });
    }

    // Remove user from group
    await Group.findByIdAndUpdate(groupId, {
      $pull: { members: { userId } },
    });

    res.status(200).json({
      status: 200,
      success: true,
      message: "User removed from group successfully",
    });
  }
);

export const getJoinRequests = catchAsyncError(
  async (req: Request, res: Response) => {
    const currentUser = req.user!;

    // Find all groups where user is admin
    const adminGroups = await Group.find({
      "members.userId": currentUser._id,
      "members.role": GroupMemberRole.ADMIN,
      isActive: true,
    }).select("_id name");

    const groupIds = adminGroups.map((group) => group._id);

    // Get all pending requests for these groups with populated user and group info
    const requests = await GroupRequest.find({
      groupId: { $in: groupIds },
      status: RequestStatus.PENDING,
    })
      .populate<{
        userId: { _id: Types.ObjectId; username: string; email: string };
        groupId: { _id: Types.ObjectId; name: string };
      }>({
        path: "userId",
        select: "username email",
        model: "User",
      })
      .populate({
        path: "groupId",
        select: "name",
        model: "Group",
      })
      .sort({ createdAt: -1 })
      .lean();

    // Transform the response to include user and group info
    const transformedRequests = requests.map((request) => ({
      _id: request._id as unknown as Types.ObjectId,
      status: request.status,
      createdAt: request.createdAt,
      user: {
        _id: request.userId._id,
        username: request.userId.username,
        email: request.userId.email,
      },
      group: {
        _id: request.groupId._id,
        name: request.groupId.name,
      },
    }));

    res.status(200).json({
      status: 200,
      success: true,
      message: "Join requests retrieved successfully",
      data: transformedRequests,
    });
  }
);

// Add member to group (admin only)
export const addMemberToGroup = catchAsyncError(
  async (req: Request, res: Response) => {
    const { groupId } = req.params;
    const { userId } = req.body;
    const currentUser = req.user!;

    // Verify current user is group admin
    const group = await Group.findOne({
      _id: groupId,
      "members.userId": currentUser._id,
      "members.role": GroupMemberRole.ADMIN,
      isActive: true,
    });

    if (!group) {
      return res.status(403).json({
        status: 403,
        success: false,
        message: "Not authorized to add members",
        error: "Access denied",
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "User not found",
        error: "Invalid user",
      });
    }

    // Check if user is already a member
    const isMember = group.members.some(
      (member) => member.userId.toString() === userId
    );
    if (isMember) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "User is already a member of this group",
        error: "Duplicate membership",
      });
    }

    // Add user to group
    await Group.findByIdAndUpdate(groupId, {
      $push: {
        members: {
          userId,
          role:
            user.role === UserRole.ADMIN
              ? GroupMemberRole.ADMIN
              : GroupMemberRole.MEMBER,
        },
      },
    });

    // If there's a pending join request, update it
    await GroupRequest.findOneAndUpdate(
      { groupId, userId, status: RequestStatus.PENDING },
      {
        status: RequestStatus.APPROVED,
        processedBy: currentUser._id,
        processedAt: new Date(),
      }
    );

    res.status(200).json({
      status: 200,
      success: true,
      message: "User added to group successfully",
    });
  }
);

// Delete group and its messages (admin only)
export const deleteGroup = catchAsyncError(
  async (req: Request, res: Response) => {
    const { groupId } = req.params;
    const currentUser = req.user!;

    // Verify current user is group admin
    const group = await Group.findOne({
      _id: groupId,
      "members.userId": currentUser._id,
      "members.role": GroupMemberRole.ADMIN,
      isActive: true,
    });

    if (!group) {
      return res.status(403).json({
        status: 403,
        success: false,
        message: "Not authorized to delete group",
        error: "Access denied",
      });
    }

    // Delete all messages associated with the group
    await ChatMessage.deleteMany({
      groupId,
      type: MessageType.GROUP,
    });

    // Delete all pending join requests for this group
    await GroupRequest.deleteMany({
      groupId,
      status: RequestStatus.PENDING,
    });

    // Delete the group
    await Group.findByIdAndDelete(groupId);

    res.status(200).json({
      status: 200,
      success: true,
      message: "Group and associated messages deleted successfully",
    });
  }
);
