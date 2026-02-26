import { MessageSquare } from "lucide-react";

export default function ConversationsEmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full p-8 text-center bg-transparent">
        <div className="glass p-10 rounded-3xl max-w-md w-full relative overflow-hidden flex flex-col items-center border-white/5 shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
            
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-purple-500/30 flex items-center justify-center mb-6 shadow-inner border border-white/10">
                <MessageSquare className="w-10 h-10 text-indigo-300" />
            </div>
            <h2 className="text-2xl font-bold mb-2">NexusChat for Web</h2>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                Send and receive messages without keeping your phone online.
                Experience real-time sync across all your devices.
            </p>
            <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-zinc-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                End-to-end encrypted
            </div>
        </div>
    </div>
  );
}
