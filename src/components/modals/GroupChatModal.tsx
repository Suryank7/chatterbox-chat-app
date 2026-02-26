"use client";

import { useMutation, useQuery } from "convex/react";
// @ts-ignore
import { api } from "../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function GroupChatModal({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // Queries
  const allUsers = useQuery(api.users.getAllUsers);
  const createGroup = useMutation(api.conversations.createGroupConversation);

  const availableUsers = allUsers?.filter((u: any) => u.clerkId !== user?.id) || [];

  const toggleUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreate = async () => {
    if (!name.trim()) return toast.error("Group name is required");
    if (selectedUsers.length < 1) return toast.error("Select at least 1 other member");
    if (!user) return;

    try {
      setIsCreating(true);
      const conversationId = await createGroup({
        clerkId: user.id,
        name: name.trim(),
        memberIds: selectedUsers as any,
      });

      toast.success("Group created!");
      setOpen(false);
      setName("");
      setSelectedUsers([]);
      router.push(`/conversations/${conversationId}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to create group");
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md bg-zinc-950 border-white/10 text-white glass overflow-hidden">
        
         <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
        
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="p-2 bg-indigo-500/20 rounded-xl">
                 <Users className="w-5 h-5 text-indigo-400" />
              </div>
              Create Group Chat
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2 group neon-focus rounded-xl">
            <label className="text-xs font-medium text-zinc-400 pl-1 uppercase tracking-wider">Group Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="E.g. Engineering Team"
              className="bg-white/5 border-white/10 h-12 focus-visible:ring-0"
              maxLength={30}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400 pl-1 uppercase tracking-wider">
               Select Members ({selectedUsers.length})
            </label>
            <ScrollArea className="h-48 border border-white/10 rounded-xl bg-black/20 p-2">
              <div className="space-y-1">
                {availableUsers.map((u: any) => (
                  <div
                    key={u._id}
                    onClick={() => toggleUser(u._id)}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                      selectedUsers.includes(u._id)
                        ? "bg-indigo-500/20 border border-indigo-500/30"
                        : "hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={u.imageUrl} />
                        <AvatarFallback className="bg-zinc-800 text-xs text-white">{u.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                         <span className="text-sm font-medium text-zinc-200">{u.name}</span>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                       selectedUsers.includes(u._id) ? "border-indigo-500 bg-indigo-500" : "border-zinc-600"
                    }`}>
                        {selectedUsers.includes(u._id) && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                  </div>
                ))}
                {availableUsers.length === 0 && (
                  <div className="text-center text-sm text-zinc-500 py-4">
                    No users available to add
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-2 relative z-10">
          <Button variant="ghost" onClick={() => setOpen(false)} className="hover:bg-white/5">
            Cancel
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={isCreating || !name.trim() || selectedUsers.length < 1}
            className="bg-indigo-600 hover:bg-indigo-500 text-white min-w-[100px]"
          >
            {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
