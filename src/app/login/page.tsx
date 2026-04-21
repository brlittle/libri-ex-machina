"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SignInForm } from "@/components/auth/SignInForm";
import { Suspense } from "react";

function LoginContent() {
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
          <h2 className="text-base font-medium text-stone-200 mb-5">Sign in</h2>
          <SignInForm onSuccess={handleSuccess} />
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
