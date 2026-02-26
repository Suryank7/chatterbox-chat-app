"use client";

import { useMutation, useQuery } from "convex/react";
// @ts-ignore
import { api } from "../../../convex/_generated/api";
import { UserButton, useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { 
  Search, 
  MessageSquare, 
  Users2, 
  Plus, 
  Hash,
  MessageCircle,
  Clock,
  Settings
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useParams, useRouter } from "next/navigation";
import { GroupChatModal } from "../modals/GroupChatModal";
import { SettingsModal } from "../modals/SettingsModal";

export const Sidebar = () => {
  const { user } = useUser();
  const { conversationId } = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"chats" | "users">("chats");
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Queries
  const allUsers = useQuery(api.users.getAllUsers);
  const conversations = useQuery(api.conversations.getConversations, user ? { clerkId: user.id } : "skip");
  
  // Mutations
  const createChat = useMutation(api.conversations.createConversation);

  const filterUsers = (users: any[]) => {
    if (!searchQuery) return users;
    return users.filter(u => 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const otherUsers = filterUsers(allUsers?.filter((u: any) => u.clerkId !== user?.id) || []);
  const filteredConversations = filterUsers(conversations?.map((conv: any) => ({
    ...conv,
    name: conv.isGroup ? conv.name : conv.otherUser?.name,
    email: conv.isGroup ? "" : conv.otherUser?.email,
    imageUrl: conv.isGroup ? conv.imageUrl : conv.otherUser?.imageUrl,
  })) || []);

  const handleCreateChat = async (otherUserId: string) => {
    if (!user) return;
    try {
      const id = await createChat({
        clerkId: user.id,
        otherUserId: otherUserId as any,
      });
      router.push(`/conversations/${id}`);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-zinc-950 border-r border-white/5 relative z-20 min-h-0">
      {/* Header */}
      <div className="p-6 border-b border-white/5 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 focus:outline-none select-none">
            <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-zinc-500 tracking-tight">
               NexusChat
            </h1>
          </div>
          <GroupChatModal>
             <Button size="icon-sm" className="bg-indigo-500 hover:bg-indigo-600 rounded-lg">
                <Plus className="w-4 h-4" />
             </Button>
          </GroupChatModal>
        </div>

        {/* User Profile Hook */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 transition-all duration-500 hover:bg-white/10 group">
          {!mounted ? (
            <>
              <Skeleton className="w-8 h-8 rounded-full bg-white/10" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24 bg-white/10" />
                <Skeleton className="h-3 w-16 bg-white/10" />
              </div>
            </>
          ) : (
            <>
              <UserButton afterSignOutUrl="/sign-in" />
              <div className="flex flex-col">
                <span className="text-sm font-semibold truncate max-w-[120px] text-zinc-900 dark:text-zinc-100">{user?.fullName || "You"}</span>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-xs text-emerald-500 font-medium">Online</span>
                </div>
              </div>
              <SettingsModal>
                <Settings className="w-4 h-4 text-zinc-500 ml-auto opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:text-white" />
              </SettingsModal>
            </>
          )}
        </div>

        <div className="relative">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
           <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search people or groups..." 
              className="pl-10 h-11 bg-white/5 border-white/5 focus-visible:ring-indigo-500/50 rounded-xl placeholder:text-white"
           />
        </div>

        <div className="flex p-1 bg-white/5 rounded-xl border border-white/5">
          <button 
            onClick={() => setActiveTab("chats")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === "chats" ? "bg-indigo-500 text-white shadow-lg" : "text-zinc-400 hover:text-white"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Chats
          </button>
          <button 
            onClick={() => setActiveTab("users")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === "users" ? "bg-indigo-500 text-white shadow-lg" : "text-zinc-400 hover:text-white"
            }`}
          >
            <Users2 className="w-4 h-4" />
            People
          </button>
        </div>
      </div>

      {/* List Area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          {activeTab === "chats" && (
             <div className="p-2 space-y-1">
                {conversations === undefined ? (
                   Array(5).fill(0).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl animate-pulse">
                         <div className="w-12 h-12 rounded-full bg-white/5" />
                         <div className="flex-1 space-y-2">
                            <div className="h-4 w-32 bg-white/5 rounded" />
                            <div className="h-3 w-48 bg-white/5 rounded" />
                         </div>
                      </div>
                   ))
                ) : filteredConversations.length === 0 ? (
                   <div className="py-20 text-center text-zinc-500 flex flex-col items-center">
                      <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
                      <p className="text-sm">No conversations yet</p>
                      <Button 
                         variant="link" 
                         className="text-indigo-400 mt-2"
                         onClick={() => setActiveTab("users")}
                      >
                         Find people to chat
                      </Button>
                   </div>
                ) : (
                  filteredConversations.map((conv: any) => (
                    <div 
                      key={conv._id}
                      onClick={() => router.push(`/conversations/${conv._id}`)}
                      className={`flex items-center gap-4 p-3 rounded-2xl cursor-pointer transition-all ${
                        conversationId === conv._id 
                          ? "bg-indigo-500/20 border border-indigo-500/30" 
                          : "hover:bg-white/5 border border-transparent"
                      }`}
                    >
                       <div className="relative">
                          <Avatar className="h-12 w-12 border border-white/10">
                            <AvatarImage src={conv.imageUrl || ""} />
                            <AvatarFallback className="bg-zinc-800 text-zinc-100">
                               {conv.name?.charAt(0) || <Hash className="w-4 h-4" />}
                            </AvatarFallback>
                          </Avatar>
                          {!conv.isGroup && conv.otherUser?.isOnline && (
                             <span className="absolute bottom-0 right-0 w-3 h-3 border-2 border-[#121212] rounded-full bg-emerald-500"></span>
                          )}
                       </div>
                       <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                             <h4 className="text-sm font-semibold text-zinc-200 truncate">{conv.name}</h4>
                             <span className="text-[10px] text-zinc-500">
                                {conv.lastMessage?._creationTime ? new Date(conv.lastMessage._creationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                             </span>
                          </div>
                          <p className={`text-xs truncate ${conv.unreadCount > 0 ? "text-white font-medium" : "text-zinc-500"}`}>
                             {conv.lastMessage?.body || "Start a conversation..."}
                          </p>
                       </div>
                       {conv.unreadCount > 0 && (
                          <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
                             <span className="text-[10px] font-bold text-white">{conv.unreadCount}</span>
                          </div>
                       )}
                    </div>
                  ))
                )}
             </div>
          )}

          {activeTab === "users" && (
             <div className="p-2 space-y-1">
                {allUsers === undefined ? (
                   Array(5).fill(0).map((_, i) => (
                     <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
                       <Skeleton className="w-10 h-10 rounded-full bg-white/5" />
                       <div className="flex-1 space-y-2">
                         <Skeleton className="h-4 w-24 bg-white/5" />
                       </div>
                     </div>
                   ))
                ) : otherUsers.length === 0 ? (
                   <div className="py-10 text-center text-zinc-500 flex flex-col items-center">
                     <Users2 className="w-12 h-12 mb-3 opacity-20" />
                     <p className="text-sm">No other users found</p>
                   </div>
                ) : (
                   otherUsers.map((u: any) => (
                    <div key={u._id} className="flex flex-col gap-2 p-3 rounded-xl hover:bg-white/5 transition-all">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <div className="relative">
                               <Avatar className="h-10 w-10">
                                  <AvatarImage src={u.imageUrl || ""} />
                                  <AvatarFallback className="bg-zinc-800 text-zinc-200">{u.name.charAt(0)}</AvatarFallback>
                               </Avatar>
                               {u.isOnline && (
                                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 border-[1.5px] border-[#121212] rounded-full bg-emerald-500"></span>
                               )}
                            </div>
                            <div>
                               <p className="text-sm font-medium text-zinc-200">{u.name}</p>
                               <p className="text-xs text-zinc-500 truncate max-w-[120px]">{u.email}</p>
                            </div>
                         </div>
                         <Button 
                           size="sm" 
                           variant="secondary"
                           onClick={() => handleCreateChat(u._id as any)}
                           className="h-8 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 hover:text-white transition-colors"
                         >
                            Message
                         </Button>
                      </div>
                    </div>
                  ))
                )}
             </div>
          )}
      </div>
    </div>
  );
}
