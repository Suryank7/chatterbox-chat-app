// @ts-nocheck
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

export const getMessages = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const msgs = await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
      .collect();
      
    return await Promise.all(
      msgs.map(async (msg) => {
        const fileUrl = msg.fileId ? await ctx.storage.getUrl(msg.fileId) : undefined;
        const sender = await ctx.db.get(msg.senderId);
        
        const deletedByUser = msg.deletedBy ? await ctx.db.get(msg.deletedBy) : null;

        let replyToContent = null;
        if (msg.replyTo) {
          const originalMsg = await ctx.db.get(msg.replyTo);
          if (originalMsg) {
             const originalSender = await ctx.db.get(originalMsg.senderId);
             replyToContent = {
               body: originalMsg.body,
               senderName: originalSender?.name || "Unknown",
               fileId: originalMsg.fileId,
             };
          }
        }

        return { 
          ...msg, 
          fileUrl, 
          senderName: sender?.name, 
          clerkId: sender?.clerkId,
          replyToName: deletedByUser?.name, 
          replyToContent 
        };
      })
    );
  },
});

export const sendMessage = mutation({
  args: {
    clerkId: v.string(),
    conversationId: v.id("conversations"),
    body: v.optional(v.string()),
    fileId: v.optional(v.id("_storage")),
    format: v.optional(v.string()),
    replyTo: v.optional(v.id("messages")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User not found");

    // Check if member
    const membership = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation_and_user", (q) =>
        q.eq("conversationId", args.conversationId).eq("userId", user._id)
      )
      .unique();

    if (!membership) throw new Error("Not a member of this conversation");

    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: user._id,
      body: args.body,
      fileId: args.fileId,
      format: args.format,
      replyTo: args.replyTo,
      isDeleted: false,
      isEdited: false,
    });

    // Update conversation last message id
    await ctx.db.patch(args.conversationId, {
      lastMessageId: messageId,
    });

    // Update sender's last read message id
    await ctx.db.patch(membership._id, {
      lastReadMessageId: messageId,
    });

    return messageId;
  },
});

export const getReactions = query({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("reactions")
      .withIndex("by_messageId", (q) => q.eq("messageId", args.messageId))
      .collect();
  },
});

export const addReaction = mutation({
  args: {
    clerkId: v.string(),
    messageId: v.id("messages"),
    reactionType: v.string(), // e.g., "thumbsUp", "heart"
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User not found");

    // See if user already reacted with this type
    const existingReactionArray = await ctx.db
      .query("reactions")
      .withIndex("by_messageId", (q) => q.eq("messageId", args.messageId))
      .collect();

    const existingReaction = existingReactionArray.find(
        (r) => r.userId === user._id && r.reactionType === args.reactionType
    );

    if (existingReaction) {
      // Toggle reaction off
      await ctx.db.delete(existingReaction._id);
      return false;
    } else {
      // Add reaction
      await ctx.db.insert("reactions", {
        messageId: args.messageId,
        userId: user._id,
        reactionType: args.reactionType,
      });
      return true;
    }
  },
});

export const deleteMessage = mutation({
  args: {
    clerkId: v.string(),
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
     const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User not found");

    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");

    // Allow sender or conversation admin to delete
    const conversation = await ctx.db.get(message.conversationId);
    const isAdmin = conversation?.adminId === user._id;

    if (message.senderId !== user._id && !isAdmin) {
        throw new Error("Unauthorized to delete message");
    }



    await ctx.db.patch(args.messageId, {
      isDeleted: true,
      body: "This message was deleted",
      fileId: undefined,
      deletedBy: user._id,
    });
  }
});

export const editMessage = mutation({
  args: {
    clerkId: v.string(),
    messageId: v.id("messages"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User not found");

    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");

    if (message.senderId !== user._id) {
      throw new Error("Unauthorized to edit message");
    }

    if (message.isDeleted) {
      throw new Error("Cannot edit a deleted message");
    }

    const tenMinutes = 10 * 60 * 1000;
    const isTooOld = Date.now() - message._creationTime > tenMinutes;

    if (isTooOld) {
      throw new Error("Cannot edit messages older than 10 minutes");
    }

    await ctx.db.patch(args.messageId, {
      body: args.body,
      isEdited: true,
    });
  },
});
export const getConversationForHeader = query({
  args: { 
    conversationId: v.id("conversations"), 
    clerkId: v.optional(v.string()) 
  },
  handler: async (ctx, args) => {
    const { conversationId, clerkId } = args;
    const conversation = await ctx.db.get(conversationId);
    if (!conversation) return null;

    let otherUser = null;
    if (!conversation.isGroup && clerkId) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
        .unique();

      if (user) {
        const otherMembers = await ctx.db
          .query("conversationMembers")
          .withIndex("by_conversationId", (q) => q.eq("conversationId", conversation._id))
          .filter((q) => q.neq(q.field("userId"), user._id))
          .collect();

        if (otherMembers.length > 0) {
          otherUser = await ctx.db.get(otherMembers[0].userId);
        }
      }
    }

    return { ...conversation, otherUser };
  }
});
