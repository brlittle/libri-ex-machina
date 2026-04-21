"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn as signInAction, signUp as signUpAction } from "@/actions";

export function useAuth() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await signInAction(email, password);
      if (result.success) {
        router.refresh();
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await signUpAction(email, password);
      if (result.success) {
        router.refresh();
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  return { signIn, signUp, isLoading };
}
