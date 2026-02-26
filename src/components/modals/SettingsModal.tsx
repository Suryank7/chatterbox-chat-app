"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useUser, SignOutButton } from "@clerk/nextjs";
import { 
  User, 
  Moon, 
  Sun, 
  Monitor, 
  Bell, 
  Shield, 
  LogOut,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";

interface SettingsModalProps {
  children: React.ReactNode;
}

export const SettingsModal = ({ children }: SettingsModalProps) => {
  const { user } = useUser();
  const { setTheme, theme } = useTheme();
  const [notifications, setNotifications] = useState(true);

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] border-white/10 glass bg-zinc-950/95 text-zinc-100 p-0 overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 animate-gradient-x shadow-[0_0_20px_rgba(99,102,241,0.5)]" />
        
        <DialogHeader className="p-6 pb-2 relative z-10">
          <DialogTitle className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500 tracking-tight">
            Settings
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-8 relative z-10">
          {/* Profile Section */}
          <section className="space-y-4">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Account info</h3>
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 group border-transparent hover:border-white/10 transition-all duration-300">
              <div className="relative">
                 <img src={user?.imageUrl} className="h-14 w-14 rounded-full border-2 border-indigo-500/20 group-hover:border-indigo-500 shadow-xl transition-all duration-500" alt="Profile" />
                 <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-zinc-950 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold truncate leading-tight">{user?.fullName}</p>
                <p className="text-sm text-zinc-400 truncate opacity-70">{user?.primaryEmailAddress?.emailAddress}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-zinc-900 border-white/5 hover:border-white/20 text-xs font-semibold gap-2 transition-all hover:scale-105 active:scale-95"
                onClick={() => window.open('https://accounts.clerk.com/user', '_blank')}
              >
                Edit Profile
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          </section>

          {/* Appearance Section */}
          <section className="space-y-4">
             <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Appearance</h3>
             <div className="grid grid-cols-3 gap-3">
                <button 
                  onClick={() => setTheme("dark")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-300 ${theme === "dark" ? "bg-indigo-500/10 border-indigo-500/50 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.2)]" : "bg-white/5 border-transparent text-zinc-400 hover:bg-white/10"}`}
                >
                   <Moon className="w-6 h-6" />
                   <span className="text-xs font-bold">Dark</span>
                </button>
                <button 
                  onClick={() => setTheme("light")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-300 ${theme === "light" ? "bg-indigo-500/10 border-indigo-500/50 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.2)]" : "bg-white/5 border-transparent text-zinc-400 hover:bg-white/10"}`}
                >
                   <Sun className="w-6 h-6" />
                   <span className="text-xs font-bold">Light</span>
                </button>
                <button 
                  onClick={() => setTheme("system")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-300 ${theme === "system" ? "bg-indigo-500/10 border-indigo-500/50 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.2)]" : "bg-white/5 border-transparent text-zinc-400 hover:bg-white/10"}`}
                >
                   <Monitor className="w-6 h-6" />
                   <span className="text-xs font-bold">System</span>
                </button>
             </div>
          </section>

          {/* Preferences Section */}
          <section className="space-y-4">
             <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">System preferences</h3>
             <div className="space-y-2">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors group">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-500/10 rounded-xl group-hover:scale-110 transition-transform">
                        <Bell className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">Priority Notifications</span>
                        <span className="text-[10px] text-zinc-500">Enable sound and badges</span>
                      </div>
                   </div>
                   <div 
                    onClick={() => setNotifications(!notifications)}
                    className={`w-11 h-6 rounded-full transition-all duration-300 cursor-pointer p-1 ${notifications ? "bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.4)]" : "bg-zinc-800"}`}
                   >
                      <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 ${notifications ? "translate-x-5 shadow-2xl" : "translate-x-0"}`} />
                   </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors group">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-500/10 rounded-xl group-hover:scale-110 transition-transform">
                        <Shield className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">Privacy & Security</span>
                        <span className="text-[10px] text-zinc-500">Manage encryption keys</span>
                      </div>
                   </div>
                   <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors" />
                </div>
             </div>
          </section>

          {/* Account Section */}
          <section className="pb-6">
             <SignOutButton>
                <Button variant="ghost" className="w-full h-14 rounded-2xl bg-rose-500/5 text-rose-500 border border-rose-500/10 hover:bg-rose-500 hover:text-white transition-all duration-300 gap-3 font-black uppercase tracking-tighter shadow-xl hover:shadow-rose-500/20 active:scale-95 group">
                   <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                   Sign Out to avoid nexus
                </Button>
             </SignOutButton>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
};
