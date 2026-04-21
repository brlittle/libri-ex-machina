"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SignInForm } from "@/components/auth/SignInForm";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { Suspense } from "react";

function LoginContent() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSuccess = () => {
    const next = searchParams.get("next") ?? "/library";
    router.push(next);
  };

  return (
    <div className="min-h-screen flex items-center justify-center"
         style={{ background: "rgb(8,8,20)" }}>
      <div className="w-full max-w-sm px-6">

        {/* Logo / title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-stone-100">
            Libri Ex Machina
          </h1>
          <p className="mt-1 text-sm text-stone-500">Your personal media library</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-stone-800 p-7"
             style={{ background: "rgba(18,18,36,0.9)" }}>
          <h2 className="text-base font-medium text-stone-200 mb-5">
            {mode === "signin" ? "Sign in" : "Create account"}
          </h2>

          {mode === "signin"
            ? <SignInForm onSuccess={handleSuccess} />
            : <SignUpForm onSuccess={handleSuccess} />}

          <p className="mt-5 text-center text-xs text-stone-500">
            {mode === "signin" ? (
              <>No account?{" "}
                <button onClick={() => setMode("signup")}
                        className="text-stone-300 hover:text-stone-100 underline underline-offset-2">
                  Sign up
                </button>
              </>
            ) : (
              <>Already have one?{" "}
                <button onClick={() => setMode("signin")}
                        className="text-stone-300 hover:text-stone-100 underline underline-offset-2">
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
