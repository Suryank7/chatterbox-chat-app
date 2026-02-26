# NexusChat 🚀
A next-generation real-time communication platform built for seamless private and group collaboration.

## 🌟 Features
- **Real-Time Messaging**: Built on Convex WebSockets for zero-latency messaging.
- **Glassmorphism UI**: Beautiful, dark-mode first design utilizing Tailwind CSS v4 and shadcn/ui.
- **Typing Indicators**: Live typing status synced across all group members.
- **Smart Timestamps**: Context-aware timestamp formatting logic.
- **User Discovery**: Global directory to find and connect with other users instantaneously.
- **Group Chats**: Create collaborative spaces with multiple peers.

---

## 🏗️ Architecture Design

- **Frontend**: Next.js (App Router) + TypeScript + Tailwind v4
- **State & UI**: React Hooks + Context + shadcn/ui + Framer Motion
- **Backend & Database**: Convex (Serverless REAL-TIME database)
- **Authentication**: Clerk (with Webhook Syncing to Convex)
- **Deployment**: Vercel

### Data Flow
1. User authenticates via Clerk.
2. Clerk sends a webhook (`user.created`) to the Next.js API route.
3. The API route securely (via Svix) mutates the Convex database to register the user.
4. The client wrapper (`ConvexClientProvider`) authenticates the Convex connection using the Clerk session token.
5. All queries (`useQuery`) establish live WebSocket subscriptions to the database tables. Any mutation (e.g. `sendMessage`) instantly pushes the updated UI state to all connected clients.

### Database Schema (Convex)
- `users`: Synchronized identities from Clerk. (Fields: `clerkId, name, email, imageUrl, isOnline, lastSeen`)
- `conversations`: Chat rooms (1-on-1 or Groups). (Fields: `name, isGroup, adminId, lastMessageId`)
- `conversationMembers`: Join table linking Users to Conversations.
- `messages`: The actual chat payloads.
- `typingStatus`: Ephemeral presence data.

---

## 🚀 DevOps & Deployment Guide

### 1. Git Commit Strategy & Branch Naming
- **Branch Naming**: 
  - `feature/name-of-feature`
  - `fix/description-of-bug`
  - `chore/config-updates`
- **Commit Strategy**: Use conventional commits (`feat:`, `fix:`, `refactor:`, `style:`, `docs:`).

### 2. Environment Variables Setup
Required `.env.local` keys:
```env
# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Clerk Webhook Secret (from Clerk Dashboard -> Webhooks)
WEBHOOK_SECRET=whsec_...

# Convex
CONVEX_DEPLOYMENT=dev:...
NEXT_PUBLIC_CONVEX_URL=https://...
```

### 3. Vercel Deployment Steps
1. Push repository upstream to GitHub.
2. Log in to Vercel and import the repository.
3. Vercel will auto-detect Next.js.
4. **Environment Variables**: Head to the Vercel project settings -> Environment Variables. Copy the **Production** keys from Convex and Clerk dashboards.
5. Trigger Deploy.

### 4. Production Build Optimization
- Images are served via `next/image` to optimize formats and sizes.
- Convex utilizes edge caching and automatically batches subscription updates to prevent rapid UI thrashing.
- UI elements (Dialogs, Dropdowns) utilize granular React Client Components to prevent entire page hydration blocking.

---

## 📹 LOOM VIDEO SCRIPT (5 Minutes)

**0:00 - 0:30 (Intro)**
"Hi there, I'm presenting NexusChat, a next-generation real-time messaging application. The goal here was to build a WhatsApp-grade web experience using a modern, scalable tech stack: Next.js App Router, Convex for real-time db sync, and Clerk for authentication."

**0:30 - 1:30 (Architecture Overview & Auth)**
"NexusChat uses a serverless architecture. When a user creates an account via our Clerk integration, a webhook is securely fired to our Next.js backend, validated via Svix, and synchronized directly into our Convex database. This ensures identity is perfectly mirrored between auth and data layers."

**1:30 - 3:00 (Feature Demo & UI UX)**
"Let's jump into the app. We're using a dark-mode first, glassmorphism design system inspired by Discord and Linear. You'll notice the neon borders on active focus. 
Over here on the Sidebar, we have Real-Time User Discovery. I can swap to the Directory tab and instantly start a conversation with anyone on the platform. Let's create a Group Chat. I'll hit the new message icon, select a few peers, give it a name, and hit create."

**3:00 - 4:00 (Code Walkthrough - Realtime & State)**
"The magic happens in how we handle state. Rather than complex Redux setups, we leverage local reactivity. Let me show you `src/app/(main)/conversations/[conversationId]/page.tsx`. Here we are querying `api.messages.getMessages` and `api.presence.getTypingUsers`. Convex automatically establishes a WebSocket connection for these queries. If anyone types or sends a message, this component re-renders instantly without ever needing to manually refetch or poll the server."

**4:00 - 5:00 (Live Edit & Outro)**
"To prove the zero-latency, I'll send a message now. Watch the typing indicator bubble up, and the message populate instantaneously. We also implemented smart auto-scrolling and timestamp formatting. In a production scenario, this architecture easily scales horizontally through Vercel's edge network and Convex's managed infrastructure. Thank you for your time."
