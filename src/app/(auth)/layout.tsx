import React from "react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background dark:bg-[#0a0a0a]">
      <div className="glass p-8 rounded-2xl shadow-2xl relative overflow-hidden">
        {/* Neon accent effects */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              NexusChat
            </h1>
            <p className="text-sm text-zinc-400 mt-2">
              Next-generation real-time communication
            </p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
