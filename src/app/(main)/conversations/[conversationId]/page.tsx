"use client";

import { useMutation, useQuery } from "convex/react";
// @ts-ignore
import { api } from "../../../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { 
  Send, 
  MoreVertical, 
  Phone, 
  Video, 
  Info, 
  FileIcon, 
  X, 
  CornerUpLeft, 
  Edit2, 
  Trash2, 
  Copy, 
  Smile,
  Paperclip,
  Image as ImageIcon
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import EmojiPicker from 'emoji-picker-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChatInfoSheet } from "@/components/modals/ChatInfoSheet";
import { MediaRoom } from "@/components/chat/MediaRoom";

export default function ConversationPage() {
  const { user } = useUser();
  const { conversationId } = useParams();
  const validId = conversationId as any;
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [isAudioCall, setIsAudioCall] = useState(false);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [editingMessage, setEditingMessage] = useState<any>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Queries
  const conversation = useQuery(api.conversations.getConversation, { 
    conversationId: validId,
    clerkId: user?.id 
  });
  const messages = useQuery(api.messages.getMessages, { conversationId: validId });
  const typingUsers = useQuery(api.conversations.getTypingUsers, { conversationId: validId });
  const currentUser = useQuery(api.users.getUser, { clerkId: user?.id || "" });

  // Mutations
  const sendMessage = useMutation(api.messages.sendMessage);
  const setTyping = useMutation(api.conversations.setTyping);
  const deleteMessage = useMutation(api.messages.deleteMessage);
  const editMessage = useMutation(api.messages.editMessage);
  const generateUploadUrl = useMutation(api.messages.generateUploadUrl);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, typingUsers]);

  // Typing effect
  useEffect(() => {
    if (!user) return;
    let timeout: any;
    if (isTyping) {
      setTyping({ clerkId: user.id, conversationId: validId, isTyping: true });
      timeout = setTimeout(() => {
        setIsTyping(false);
        setTyping({ clerkId: user.id, conversationId: validId, isTyping: false });
      }, 3000);
    }
    return () => clearTimeout(timeout);
  }, [isTyping, user?.id, conversationId]);

  if (!conversation) return null;

  const chatName = conversation.isGroup ? conversation.name : conversation.otherUser?.name;
  const chatImage = conversation.isGroup ? conversation.imageUrl : conversation.otherUser?.imageUrl;

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!message.trim() && !editingMessage) return;
    if (!user) return;

    try {
      if (editingMessage) {
        await editMessage({
          clerkId: user.id,
          messageId: editingMessage._id,
          body: message.trim(),
        });
        toast.success("Message updated");
        setEditingMessage(null);
      } else {
        await sendMessage({
          clerkId: user.id,
          conversationId: validId,
          body: message.trim(),
          replyTo: replyingTo?._id,
        });
        setReplyingTo(null);
      }
      setMessage("");
    } catch (error: any) {
      toast.error(error.message || "Failed to send message");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    const toastId = toast.loading("Uploading file...");

    try {
      // 1. Get upload URL
      const postUrl = await generateUploadUrl();

      // 2. POST the file
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      const { storageId } = await result.json();

      // 3. Send message with storageID
      await sendMessage({
        clerkId: user.id,
        conversationId: validId,
        fileId: storageId,
        format: file.type.startsWith("image/") ? "image" : "file",
        body: "", // Empty body for file-only messages
      });

      toast.success("File shared successfully!", { id: toastId });
    } catch (error: any) {
      toast.error(error.message || "Failed to upload file", { id: toastId });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleReply = (msg: any) => {
    setEditingMessage(null);
    setReplyingTo(msg);
  };

  const handleEdit = (msg: any) => {
    setReplyingTo(null);
    setEditingMessage(msg);
    setMessage(msg.body);
  };

  const handleDelete = async (msgId: any) => {
    if (!user) return;
    try {
      await deleteMessage({ clerkId: user.id, messageId: msgId });
      toast.success("Message deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete message");
    }
  };

  const handleCopy = (body: string) => {
    navigator.clipboard.writeText(body);
    toast.success("Copied to clipboard");
  };

  const onEmojiClick = (emojiData: any) => {
    setMessage(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  if (isVideoCall || isAudioCall) {
    return (
      <MediaRoom 
        chatId={validId as string}
        video={isVideoCall}
        audio={true}
        onDisconnected={() => {
          setIsVideoCall(false);
          setIsAudioCall(false);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-transparent relative z-10 min-h-0">
      {/* Header */}
      <div className="h-20 flex items-center justify-between px-6 border-b border-white/5 glass bg-zinc-950/30">
        <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setIsInfoOpen(true)}>
          <div className="relative">
            <Avatar className="h-11 w-11 border-2 border-indigo-500/20 group-hover:border-indigo-500/50 transition-all">
              <AvatarImage src={chatImage || ""} />
              <AvatarFallback className="bg-zinc-800 text-zinc-100">{chatName?.charAt(0)}</AvatarFallback>
            </Avatar>
            {!conversation.isGroup && conversation.otherUser?.isOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 border-2 border-[#121212] rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
            )}
          </div>
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 group-hover:text-indigo-400 transition-colors leading-none mb-1">{chatName}</h2>
            <div className="flex items-center gap-2">
               {typingUsers && typingUsers.length > 0 ? (
                   <span className="text-[10px] text-emerald-400 font-medium lowercase flex items-center gap-1">
                      {typingUsers.length === 1 ? typingUsers[0].name : `${typingUsers.length} people`} 
                      typing<span className="animate-bounce">.</span><span className="animate-bounce delay-100">.</span><span className="animate-bounce delay-200">.</span>
                   </span>
               ) : (
                  <span className="text-xs dark:text-zinc-400 font-medium opacity-60">Click to view info</span>
               )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="hover:bg-white/5 text-zinc-400 hover:text-indigo-400"
            onClick={() => setIsAudioCall(true)}
          >
            <Phone className="w-5 h-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="hover:bg-white/5 text-zinc-400 hover:text-indigo-400"
            onClick={() => setIsVideoCall(true)}
          >
            <Video className="w-5 h-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="hover:bg-white/5 text-zinc-400 hover:text-indigo-400"
            onClick={() => setIsInfoOpen(true)}
          >
            <Info className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 scroll-smooth scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
          {messages?.length === 0 && (
             <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
                  <div className="p-4 rounded-3xl bg-indigo-500/10 mb-4 border border-indigo-500/20">
                     <MessageSquare className="w-8 h-8 text-indigo-400" />
                  </div>
                  <div>
                      <h4 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">Start the conversation</h4>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm">
                          Send a message or a file to start the chat.
                      </p>
                  </div>
             </div>
          )}
          
          {messages?.map((msg: any) => {
            const isOwn = msg.clerkId === user?.id;
            const isAdmin = conversation?.adminId === currentUser?._id;
            const isRecent = (Date.now() - msg._creationTime < 600000); // 10 mins
            const canModify = isOwn && isRecent;
            const canDelete = isOwn || isAdmin;

            return (
              <div 
                key={msg._id} 
                className={`flex flex-col w-full ${isOwn ? "items-end pl-12" : "items-start pr-12"} group relative`}
              >
                {/* Reply Context */}
                {msg.replyToContent && (
                  <div className={`flex items-center gap-2 mb-1 px-3 py-1 rounded-full bg-zinc-800/40 border border-white/5 text-[10px] text-zinc-400 max-w-[85%] ${isOwn ? "mr-1" : "ml-1"}`}>
                    <CornerUpLeft className="w-3 h-3 text-indigo-400" />
                    <span className="font-semibold text-indigo-400/80">{msg.replyToContent.senderName}:</span>
                    <span className="truncate opacity-70">{msg.replyToContent.body || "Media"}</span>
                  </div>
                )}

                <div className={`flex items-start gap-3 max-w-full ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
                  {!isOwn && (
                    <Avatar className="h-8 w-8 mt-1 border border-white/10 shadow-xl shrink-0">
                      <AvatarImage src={msg.senderImageUrl} />
                      <AvatarFallback className="bg-zinc-800 text-[10px] font-bold">{msg.senderName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={`flex flex-col group/bubble relative ${isOwn ? "items-end" : "items-start"} max-w-[85%]`}>
                    <div className={`
                      px-4 py-3 rounded-2xl text-sm relative transition-all duration-300 shadow-2xl
                      ${isOwn 
                        ? "bg-gradient-to-br from-indigo-600 to-indigo-500 text-white rounded-tr-none" 
                        : "bg-zinc-800/90 border border-white/5 text-zinc-100 rounded-tl-none"
                      }
                      ${msg.isDeleted ? "opacity-60 grayscale-[0.5]" : "hover:scale-[1.01]"}
                    `}>
                      {msg.fileUrl ? (
                         <div className="space-y-2">
                            {msg.format === "image" ? (
                               <img 
                                src={msg.fileUrl} 
                                alt="Media" 
                                className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity border border-white/10 shadow-lg" 
                                onClick={() => window.open(msg.fileUrl, '_blank')}
                               />
                            ) : (
                               <div className="flex items-center gap-3 p-3 bg-black/30 rounded-xl border border-white/5 group/file hover:bg-black/40 transition-colors">
                                  <div className="p-2 bg-indigo-500/20 rounded-lg">
                                     <FileIcon className="w-5 h-5 text-indigo-400" />
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                     <span className="text-xs font-semibold truncate">File Attachment</span>
                                     <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-400 font-medium hover:underline">Download</a>
                                  </div>
                               </div>
                            )}
                           {msg.body && <p className={`mt-2 ${msg.isDeleted ? "text-zinc-500 italic" : "text-white/95"}`}>{msg.body}</p>}
                         </div>
                      ) : (
                        <p className={`whitespace-pre-wrap break-words leading-relaxed ${msg.isDeleted ? "text-zinc-500 italic text-xs" : ""}`}>
                          {msg.isDeleted ? (
                            `Message deleted ${msg.deletedBy ? `by ${msg.replyToName || "Admin"}` : ""}`
                          ) : (
                            msg.body
                          )}
                        </p>
                      )}
                      
                      {/* Action Menu */}
                      {!msg.isDeleted && (
                        <div className={`
                          absolute top-0 transform -translate-y-1/2 opacity-0 group-hover/bubble:opacity-100 transition-all duration-200 z-10
                          ${isOwn ? "left-0 -translate-x-full pr-2" : "right-0 translate-x-full pl-2"}
                        `}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                               <Button variant="secondary" size="icon-xs" className="h-7 w-7 rounded-full bg-zinc-950 border border-white/10 shadow-xl text-zinc-400 hover:text-white hover:border-indigo-500/50">
                                  <MoreVertical className="w-3 h-3" />
                               </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align={isOwn ? "end" : "start"} className="bg-zinc-950 border-white/10 text-zinc-100 shadow-2xl backdrop-blur-xl">
                               <DropdownMenuItem className="gap-2 focus:bg-indigo-500/10 focus:text-indigo-400 cursor-pointer" onClick={() => handleReply(msg)}>
                                  <CornerUpLeft className="w-4 h-4" /> Reply
                               </DropdownMenuItem>
                               <DropdownMenuItem className="gap-2 focus:bg-indigo-500/10 focus:text-indigo-400 cursor-pointer" onClick={() => handleCopy(msg.body)}>
                                  <Copy className="w-4 h-4" /> Copy
                               </DropdownMenuItem>
                               {canModify && (
                                 <DropdownMenuItem className="gap-2 focus:bg-indigo-500/10 focus:text-indigo-400 cursor-pointer" onClick={() => handleEdit(msg)}>
                                    <Edit2 className="w-4 h-4" /> Edit
                                 </DropdownMenuItem>
                               )}
                               {canDelete && (
                                 <>
                                   {canModify && <DropdownMenuSeparator className="bg-white/5" />}
                                   <DropdownMenuItem className="gap-2 focus:bg-rose-500/10 text-rose-500 focus:text-rose-400 cursor-pointer" onClick={() => handleDelete(msg._id)}>
                                      <Trash2 className="w-4 h-4" /> Delete
                                   </DropdownMenuItem>
                                 </>
                               )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </div>
                    
                    <div className={`flex items-center gap-2 mt-1.5 px-1 ${isOwn ? "justify-end" : "justify-start"}`}>
                      {!isOwn && msg.senderName && (
                        <span className="text-[10px] font-bold text-indigo-400/70 tracking-tight">{msg.senderName}</span>
                      )}
                      <span className="text-[10px] font-medium text-zinc-600">
                        {new Date(msg._creationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {msg.isEdited && !msg.isDeleted && (
                        <span className="text-[10px] text-zinc-600/80 italic font-medium">edited</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} className="h-2" />
        </div>
      </div>

      {/* Input */}
      <div className="p-6 relative z-10 glass bg-zinc-950/20">
        <div className="max-w-5xl mx-auto space-y-2">
          {/* Reply/Edit Preview */}
          {(replyingTo || editingMessage) && (
            <div className="flex items-center justify-between p-3 rounded-t-2xl bg-indigo-500/10 border-t border-x border-indigo-500/20 animate-in slide-in-from-bottom-2 duration-300">
               <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-1.5 bg-indigo-500/20 rounded-lg">
                    {editingMessage ? <Edit2 className="w-4 h-4 text-indigo-400" /> : <CornerUpLeft className="w-4 h-4 text-indigo-400" />}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-indigo-300">
                       {editingMessage ? "Editing message" : `Replying to ${replyingTo?.senderName}`}
                    </span>
                    <span className="text-xs text-zinc-400 truncate break-all">
                       {editingMessage?.body || replyingTo?.body || "Media"}
                    </span>
                  </div>
               </div>
               <Button 
                variant="ghost" 
                size="icon-xs" 
                onClick={() => { setReplyingTo(null); setEditingMessage(null); if(editingMessage) setMessage(""); }}
                className="hover:bg-white/10 text-zinc-400"
               >
                  <X className="w-4 h-4" />
               </Button>
            </div>
          )}

          <form 
            onSubmit={handleSend}
            className={`flex items-end gap-3 p-2 bg-zinc-900/80 border border-white/5 shadow-2xl transition-all duration-300 ${replyingTo || editingMessage ? "rounded-b-2xl rounded-t-none" : "rounded-2xl"}`}
          >
            <div className="flex items-center gap-1 mb-1 ml-1">
               <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon-sm" className="hover:bg-white/5 text-zinc-400 hover:text-indigo-400">
                        <Smile className="w-5 h-5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 border-none shadow-2xl bg-transparent" side="top" align="start">
                     <EmojiPicker 
                        onEmojiClick={onEmojiClick} 
                        theme={undefined}
                        lazyLoadEmojis={true}
                     />
                  </PopoverContent>
               </Popover>
               
               <input 
                 type="file" 
                 className="hidden" 
                 ref={fileInputRef} 
                 onChange={handleFileUpload}
                 accept="image/*,.pdf,.doc,.docx,.txt"
               />
               
               <Button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                variant="ghost" 
                size="icon-sm" 
                className="hover:bg-white/5 text-zinc-400 hover:text-indigo-400"
               >
                  <Paperclip className={`w-5 h-5 ${isUploading ? "animate-pulse text-indigo-400" : ""}`} />
               </Button>
            </div>
            
            <div className="flex-1 relative">
              <Input 
                 value={message}
                 onChange={(e) => {
                   setMessage(e.target.value);
                   setIsTyping(true);
                 }}
                 placeholder="Write something..."
                 className="bg-transparent border-none focus-visible:ring-0 text-sm py-3 min-h-[44px] max-h-32 placeholder:text-zinc-500 text-white"
              />
            </div>

            <Button 
              type="submit" 
              disabled={!message.trim() || isUploading}
              className={`
                h-10 w-10 rounded-xl transition-all duration-300
                ${message.trim() && !isUploading ? "bg-indigo-500 scale-100 hover:scale-105" : "bg-zinc-800 scale-90 opacity-50 cursor-not-allowed"}
              `}
            >
              <Send className="w-4 h-4 text-white" />
            </Button>
          </form>
        </div>
      </div>

      <ChatInfoSheet 
        open={isInfoOpen} 
        onOpenChange={setIsInfoOpen} 
        conversationId={validId} 
        conversation={conversation}
        chatName={chatName}
        chatImage={chatImage}
      />
    </div>
  );
}
