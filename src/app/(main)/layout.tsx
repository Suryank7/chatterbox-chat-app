"use client";

import { Sidebar } from "@/components/sidebar/Sidebar";
import React, { useState, useCallback, useEffect } from "react";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(350);
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (mouseMoveEvent: any) => {
      if (isResizing) {
        const newWidth = mouseMoveEvent.clientX;
        if (newWidth > 200 && newWidth < 600) {
          setSidebarWidth(newWidth);
        }
      }
    },
    [isResizing]
  );

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <div style={{ width: `${sidebarWidth}px` }} className="flex-shrink-0 flex flex-col h-full min-h-0">
        <Sidebar />
      </div>

      {/* Resize Slider (Yellow/Red marked line area in user image) */}
      <div
        className={`w-1.5 cursor-col-resize hover:bg-indigo-500/50 transition-colors relative z-50 flex items-center justify-center group ${isResizing ? "bg-indigo-500" : "bg-transparent"}`}
        onMouseDown={startResizing}
      >
         <div className="w-[1px] h-full bg-white/5 group-hover:bg-indigo-500/50" />
      </div>
      
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full bg-zinc-50 dark:bg-[#0a0a0a] relative min-h-0">
         {/* Background glow effects */}
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
         <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-pink-500/10 rounded-full blur-[100px] pointer-events-none" />
         
         <div className="absolute inset-0 z-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none" />

         <div className="relative z-10 w-full h-full flex flex-col min-h-0">
            {children}
         </div>
      </main>
    </div>
  );
}
