import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    imageUrl: v.optional(v.string()),
    isOnline: v.boolean(),
    lastSeen: v.number(),
  }).index("by_clerk_id", ["clerkId"]),

  conversations: defineTable({
    name: v.optional(v.string()),
    isGroup: v.boolean(),
    adminId: v.optional(v.id("users")),
    lastMessageId: v.optional(v.id("messages")),
    imageUrl: v.optional(v.string()),
  }),

  conversationMembers: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    hasRead: v.boolean(),
    lastReadMessageId: v.optional(v.id("messages")),
  })
    .index("by_conversationId", ["conversationId"])
    .index("by_userId", ["userId"])
    .index("by_conversation_and_user", ["conversationId", "userId"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    body: v.optional(v.string()),
    fileId: v.optional(v.id("_storage")),
    format: v.optional(v.string()), // 'image' | 'file'
    isDeleted: v.boolean(),
    isEdited: v.boolean(),
    deletedBy: v.optional(v.id("users")),
    reactions: v.optional(v.array(
      v.object({
        userId: v.id("users"),
        emoji: v.string(),
      })
    )),
    replyTo: v.optional(v.id("messages")),
  }).index("by_conversationId", ["conversationId"]),

  typingStatus: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    isTyping: v.boolean(),
  })
    .index("by_conversationId", ["conversationId"])
    .index("by_conversation_and_user", ["conversationId", "userId"]),
});
