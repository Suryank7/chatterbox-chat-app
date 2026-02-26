// @ts-nocheck
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getConversations = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) return [];

    const memberships = await ctx.db
      .query("conversationMembers")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    const conversations = await Promise.all(
      memberships.map(async (m) => {
        const conversation = await ctx.db.get(m.conversationId);
        
        let otherUser = null;
        if (conversation && !conversation.isGroup) {
          // get the other member
          const otherMembers = await ctx.db
            .query("conversationMembers")
            .withIndex("by_conversationId", (q) => q.eq("conversationId", conversation._id))
            .filter((q) => q.neq(q.field("userId"), user._id))
            .collect();
            
          if (otherMembers.length > 0) {
            otherUser = await ctx.db.get(otherMembers[0].userId);
          }
        }
        
        // Also get last message
        let lastMessage = null;
        if (conversation?.lastMessageId) {
          lastMessage = await ctx.db.get(conversation.lastMessageId);
        }

        return { ...conversation, membership: m, otherUser, lastMessage };
      })
    );

    // Sort by last message time
    return conversations
      .filter((c) => c !== null)
      .sort((a, b) => {
        const timeA = a.lastMessage?._creationTime || a._creationTime || 0;
        const timeB = b.lastMessage?._creationTime || b._creationTime || 0;
        return timeB - timeA;
      });
  },
});

export const createConversation = mutation({
  args: { clerkId: v.string(), otherUserId: v.id("users") },
  handler: async (ctx, args) => {
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!currentUser) throw new Error("User not found");

    // Check if conversation already exists
    const myMemberships = await ctx.db
      .query("conversationMembers")
      .withIndex("by_userId", (q) => q.eq("userId", currentUser._id))
      .collect();

    const otherMemberships = await ctx.db
      .query("conversationMembers")
      .withIndex("by_userId", (q) => q.eq("userId", args.otherUserId))
      .collect();

    const myConversationIds = new Set(myMemberships.map((m) => m.conversationId));
    let existingConversationId = null;

    for (const membership of otherMemberships) {
      if (myConversationIds.has(membership.conversationId)) {
        const conversation = await ctx.db.get(membership.conversationId);
        if (conversation && !conversation.isGroup) {
          existingConversationId = conversation._id;
          break;
        }
      }
    }

    if (existingConversationId) {
      return existingConversationId;
    }

    // Create new
    const conversationId = await ctx.db.insert("conversations", {
      isGroup: false,
    });

    await ctx.db.insert("conversationMembers", {
      conversationId,
      userId: currentUser._id,
      hasRead: true,
    });

    await ctx.db.insert("conversationMembers", {
      conversationId,
      userId: args.otherUserId,
      hasRead: true,
    });

    return conversationId;
  },
});

export const createGroupConversation = mutation({
  args: { 
    clerkId: v.string(), 
    memberIds: v.array(v.id("users")), 
    name: v.string(), 
    imageUrl: v.optional(v.string()) 
  },
  handler: async (ctx, args) => {
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!currentUser) throw new Error("User not found");

    const conversationId = await ctx.db.insert("conversations", {
      isGroup: true,
      name: args.name,
      imageUrl: args.imageUrl,
      adminId: currentUser._id,
    });

    // Add current user
    await ctx.db.insert("conversationMembers", {
      conversationId,
      userId: currentUser._id,
      hasRead: true,
    });

    // Add other members
    for (const userId of args.memberIds) {
      await ctx.db.insert("conversationMembers", {
        conversationId,
        userId,
        hasRead: true,
      });
    }

    return conversationId;
  },
});

export const getConversation = query({
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

export const getConversationMembers = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
      .collect();

    return await Promise.all(
      memberships.map(async (m) => {
        const user = await ctx.db.get(m.userId);
        return { ...m, user };
      })
    );
  }
});

export const setTyping = mutation({
  args: { 
    clerkId: v.string(), 
    conversationId: v.id("conversations"), 
    isTyping: v.boolean() 
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User not found");

    const existing = await ctx.db
      .query("typingStatus")
      .withIndex("by_conversation_and_user", (q) => 
        q.eq("conversationId", args.conversationId).eq("userId", user._id)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { isTyping: args.isTyping });
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
    const typing = await ctx.db
      .query("typingStatus")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) => q.eq(q.field("isTyping"), true))
      .collect();

    return await Promise.all(
      typing.map(async (t) => {
        const user = await ctx.db.get(t.userId);
        return { name: user?.name || "Unknown" };
      })
    );
  },
});
