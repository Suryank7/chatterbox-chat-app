"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatSmartTimestamp } from "@/lib/utils/timestamps";
import { Users, Shield, Calendar, Image as ImageIcon, Link as LinkIcon, FileText } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "convex/react";
import { useState, useEffect } from "react";
// @ts-ignore
import { api } from "../../../convex/_generated/api";

interface ChatInfoSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: any;
  conversation: any;
  chatName?: string;
  chatImage?: string;
}

export const ChatInfoSheet = ({ open, onOpenChange, conversationId, conversation, chatName, chatImage }: ChatInfoSheetProps) => {
  const [activeTab, setActiveTab] = useState<"info" | "media" | "links">("info");
  
  // Fetch members and messages
  const rawMembers = useQuery(api.conversations.getConversationMembers, { conversationId }) || [];
  const messages = useQuery(api.messages.getMessages, { conversationId }) || [];
  
  const mediaMsgs = messages.filter((m: any) => m.fileUrl);
  const linkMsgs = messages.filter((m: any) => m.body && (m.body.includes("http://") || m.body.includes("https://")));

  useEffect(() => {
    if (!open) setActiveTab("info");
  }, [open]);
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] border-l border-white/10 glass bg-zinc-950/95 overflow-hidden flex flex-col p-0 text-zinc-100">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <SheetHeader className="p-6 pb-0 mb-6 shrink-0 relative z-10">
          <SheetTitle className="text-xl font-semibold flex items-center gap-2 text-zinc-100">
             {activeTab === "info" ? "Contact Info" : activeTab === "media" ? "Media" : "Links"}
             {activeTab !== "info" && (
                 <button onClick={() => setActiveTab("info")} className="ml-auto text-xs text-indigo-400 hover:underline">Back</button>
             )}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 w-full relative z-10">
          {activeTab === "info" ? (
             <>
          <div className="flex flex-col items-center py-6 px-6 border-b border-white/5">
            <Avatar className="h-24 w-24 border-4 border-zinc-900 shadow-xl mb-4">
              <AvatarImage src={chatImage || ""} />
              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-3xl">
                  {chatName?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-bold text-center break-words">{chatName}</h2>
            <p className="text-sm text-zinc-400 mt-1">
              {conversation.isGroup ? `Group · ${rawMembers?.length || 0} participants` : "Direct Message"}
            </p>
          </div>

          <div className="p-6 space-y-6">
             <div className="space-y-3">
                <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">About</h3>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                   <Calendar className="w-5 h-5 text-indigo-400" />
                   <div className="flex flex-col">
                      <span className="text-sm text-zinc-200">Created</span>
                      <span className="text-xs text-zinc-500">{new Date(conversation._creationTime).toLocaleDateString()}</span>
                   </div>
                </div>
             </div>

             {conversation.isGroup && (
               <div className="space-y-3">
                  <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Members</h3>
                  <div className="flex flex-col gap-1 rounded-xl bg-white/5 p-2">
                     {rawMembers.map((member: any) => (
                        <div key={member._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                           <Avatar className="h-10 w-10">
                              <AvatarImage src={member.user?.imageUrl} />
                              <AvatarFallback className="bg-zinc-800 text-zinc-300">{member.user?.name?.charAt(0)}</AvatarFallback>
                           </Avatar>
                           <div className="flex-1 overflow-hidden">
                              <div className="flex items-center justify-between">
                                 <span className="text-sm font-medium truncate">{member.user?.name}</span>
                                 {conversation.adminId === member.user?._id && (
                                   <div className="flex items-center gap-1 text-[10px] font-medium text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded-full">
                                      <Shield className="w-3 h-3" />
                                      Admin
                                   </div>
                                 )}
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
             )}

              <div className="space-y-3">
                 <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Media, Links, and Docs</h3>
                 <div className="grid grid-cols-3 gap-2">
                    <div 
                        onClick={() => setActiveTab("media")}
                        className="aspect-square rounded-xl bg-white/5 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white/10 transition-colors text-zinc-400 hover:text-indigo-400"
                    >
                       <ImageIcon className="w-6 h-6" />
                       <span className="text-xs font-medium">Media</span>
                       <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full">{mediaMsgs.length}</span>
                    </div>
                    <div 
                        onClick={() => setActiveTab("links")}
                        className="aspect-square rounded-xl bg-white/5 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white/10 transition-colors text-zinc-400 hover:text-indigo-400"
                    >
                       <LinkIcon className="w-6 h-6" />
                       <span className="text-xs font-medium">Links</span>
                       <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full">{linkMsgs.length}</span>
                    </div>
                    <div className="aspect-square rounded-xl bg-white/5 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white/10 transition-colors text-zinc-400 hover:text-indigo-400 opacity-50 cursor-not-allowed">
                       <FileText className="w-6 h-6" />
                       <span className="text-xs font-medium">Docs</span>
                       <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full">0</span>
                    </div>
                 </div>
                 
                 {mediaMsgs.length > 0 && (
                     <div className="grid grid-cols-3 gap-1 mt-3">
                         {mediaMsgs.slice(0, 6).map((m: any) => (
                             <div key={m._id} className="aspect-square bg-white/5 rounded-md overflow-hidden hover:opacity-80 transition-opacity cursor-pointer">
                                 <img src={m.fileUrl} className="w-full h-full object-cover" alt="Media" />
                             </div>
                         ))}
                     </div>
                 )}
              </div>
           </div>
           </>
          ) : activeTab === "media" ? (
              <div className="p-6">
                  <div className="grid grid-cols-3 gap-1">
                    {mediaMsgs.map((m: any) => (
                         <div key={m._id} className="aspect-square bg-white/5 rounded-md overflow-hidden hover:opacity-80 transition-opacity cursor-pointer">
                             <img src={m.fileUrl} className="w-full h-full object-cover" alt="Media" />
                         </div>
                    ))}
                  </div>
                  {mediaMsgs.length === 0 && (
                      <div className="text-center py-20 text-zinc-500">No media found</div>
                  )}
              </div>
          ) : (
              <div className="p-6 space-y-3">
                  {linkMsgs.map((m: any) => (
                      <div key={m._id} className="p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                          <a href={m.body.match(/https?:\/\/[^\s]+/)?.[0]} target="_blank" rel="noreferrer" className="text-indigo-400 text-sm break-all hover:underline">
                              {m.body.match(/https?:\/\/[^\s]+/)?.[0]}
                          </a>
                          <div className="text-[10px] text-zinc-500 mt-1">{new Date(m._creationTime).toLocaleString()}</div>
                      </div>
                  ))}
                  {linkMsgs.length === 0 && (
                      <div className="text-center py-20 text-zinc-500">No links found</div>
                  )}
              </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
