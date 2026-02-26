// @ts-nocheck
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getOnlineUsers = query({
  args: {},
  handler: async (ctx) => {
    // 60 seconds threshold for online
    const threshold = Date.now() - 60000;
    
    return await ctx.db
      .query("users")
      .filter((q) => q.gt(q.field("lastSeen"), threshold))
      .collect();
  },
});

export const updatePresence = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) return; // Silent fail if user not found, typical for heartbeat

    await ctx.db.patch(user._id, {
      lastSeen: Date.now(),
      isOnline: true,
    });
  },
});

// Typing Indicators
export const setTyping = mutation({
  args: {
    clerkId: v.string(),
    conversationId: v.id("conversations"),
    isTyping: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) return;

    const existingTyping = await ctx.db
      .query("typingStatus")
      .withIndex("by_conversation_and_user", (q) =>
        q.eq("conversationId", args.conversationId).eq("userId", user._id)
      )
      .unique();

    if (existingTyping) {
      await ctx.db.patch(existingTyping._id, {
        isTyping: args.isTyping,
      });
    } else {
      await ctx.db.insert("typingStatus", {
        conversationId: args.conversationId,
        userId: user._id,
        isTyping: args.isTyping,
      });
    }
  },
});

export const getTypingUsers = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("typingStatus")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) => q.eq(q.field("isTyping"), true))
      .collect();
  },
});
