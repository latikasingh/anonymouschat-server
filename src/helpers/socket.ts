import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { ChatMessage, MessageType } from "../models/chatMessage.schema";
import { Group } from "../models/group.schema";
import { UserSession } from "../models/userSession.schema";

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

// Track online users
const onlineUsers = new Map<string, string>(); // userId -> socketId

export const setupSocket = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Middleware for authentication
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication token required"));
      }

      const session = await UserSession.findOne({ token, isActive: true });
      if (!session) {
        return next(new Error("Invalid or expired session"));
      }

      socket.userId = session.userId.toString();
      next();
    } catch (error) {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    if (!socket.userId) return;

    // Add user to online users
    onlineUsers.set(socket.userId, socket.id);
    
    // Broadcast online status to all users
    io.emit("userStatus", {
      userId: socket.userId,
      status: "online"
    });

    // Send current online users to the newly connected user
    socket.emit("onlineUsers", Array.from(onlineUsers.keys()));

    // Join user's personal room for DM
    socket.join(`user:${socket.userId}`);

    // Join user's group rooms
    socket.on("joinGroups", async () => {
      try {
        const groups = await Group.find({
          "members.userId": socket.userId,
          isActive: true,
        });

        groups.forEach((group) => {
          socket.join(`group:${group._id}`);
        });
      } catch (error) {
        console.error("Error joining groups:", error);
      }
    });

    // Handle direct messages
    socket.on(
      "sendMessage",
      async (data: {
        receiverId: string;
        content: string;
        type: MessageType;
        groupId?: string;
      }) => {
        try {
          if (!socket.userId) return;

          const { receiverId, content, type, groupId } = data;
          let message;

          if (type === MessageType.DM) {
            // Create and save DM message
            message = await ChatMessage.create({
              senderId: socket.userId,
              receiverId,
              type: MessageType.DM,
              content: content,
            });

            // Emit to both sender and receiver
            io.to(`user:${socket.userId}`)
              .to(`user:${receiverId}`)
              .emit("newMessage", {
                messageId: message._id,
                senderId: socket.userId,
                receiverId,
                content: content,
                type: MessageType.DM,
                createdAt: message.createdAt,
              });
          } else if (type === MessageType.GROUP && groupId) {
            // Verify user is group member
            const group = await Group.findOne({
              _id: groupId,
              "members.userId": socket.userId,
              isActive: true,
            });

            if (!group) {
              socket.emit("error", "Not a member of this group");
              return;
            }

            // Create and save group message
            message = await ChatMessage.create({
              senderId: socket.userId,
              groupId,
              type: MessageType.GROUP,
              content: content,
            });

            // Emit to all group members
            io.to(`group:${groupId}`).emit("newMessage", {
              messageId: message._id,
              senderId: socket.userId,
              groupId,
              content: content,
              type: MessageType.GROUP,
              createdAt: message.createdAt,
            });
          }
        } catch (error) {
          console.error("Error sending message:", error);
          socket.emit("error", "Failed to send message");
        }
      }
    );

    // Handle disconnection
    socket.on("disconnect", () => {
      if (socket.userId) {
        // Remove user from online users
        onlineUsers.delete(socket.userId);
        
        // Broadcast offline status
        io.emit("userStatus", {
          userId: socket.userId,
          status: "offline"
        });
      }
      console.log("User disconnected:", socket.userId);
    });
  });

  return io;
};
