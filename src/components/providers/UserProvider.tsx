"use client";

import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
// @ts-ignore
import { api } from "../../../convex/_generated/api";
import { createContext, useContext, ReactNode, useEffect } from "react";

type UserContextType = {
  convexUser: any | null;
  isLoading: boolean;
};

const UserContext = createContext<UserContextType>({ convexUser: null, isLoading: true });

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { user: clerkUser, isLoaded } = useUser();
  const upsertUser = useMutation(api.users.upsertUser);
  const convexUser = useQuery(
    api.users.getUser,
    clerkUser ? { clerkId: clerkUser.id } : "skip"
  );

  useEffect(() => {
    if (clerkUser && convexUser === null) {
      upsertUser({
        clerkId: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || "",
        imageUrl: clerkUser.imageUrl || "",
        name: clerkUser.fullName || clerkUser.username || "User",
      });
    }
  }, [clerkUser, convexUser, upsertUser]);

  return (
    <UserContext.Provider
      value={{
        convexUser: convexUser !== undefined ? convexUser : null,
        isLoading: !isLoaded || (clerkUser !== null && convexUser === undefined),
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useConvexUser = () => useContext(UserContext);
