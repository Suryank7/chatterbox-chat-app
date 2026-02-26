"use client";

import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import "@livekit/components-styles";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

interface MediaRoomProps {
  chatId: string;
  video: boolean;
  audio: boolean;
  onDisconnected: () => void;
}

export const MediaRoom = ({ chatId, video, audio, onDisconnected }: MediaRoomProps) => {
  const { user } = useUser();
  const [token, setToken] = useState("");

  useEffect(() => {
    if (!user) return;

    const name = user.fullName || user.username || user.firstName || user.primaryEmailAddress?.emailAddress || "Guest";

    (async () => {
      try {
        const resp = await fetch(`/api/livekit?room=${chatId}&username=${name}`);
        const data = await resp.json();
        if (data.token) {
           setToken(data.token);
        } else {
           console.error("Token missing from resp", data);
        }
      } catch (e) {
        console.error(e);
      }
    })();

    return () => {
      setToken("");
    };
  }, [user?.id, chatId]);

  if (token === "") {
    return (
      <div className="flex flex-col flex-1 justify-center items-center">
        <Loader2 className="h-7 w-7 text-indigo-500 animate-spin my-4" />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Loading secure token...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full bg-zinc-950/50">
        <LiveKitRoom
            data-lk-theme="default"
            serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
            token={token}
            connect={true}
            video={video}
            audio={audio}
            onDisconnected={onDisconnected}
            className="flex-1 h-full w-full"
        >
            <VideoConference />
        </LiveKitRoom>
    </div>
  );
};
