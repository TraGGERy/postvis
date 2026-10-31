"use client";

import { SignUp } from "@clerk/nextjs";
import { isValidClerkPublishableKey } from "@/lib/clerk-config";
import Link from "next/link";

export default function SignUpPage() {
  const hasClerk = isValidClerkPublishableKey(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  return (
    <div className="min-h-dvh flex items-center justify-center bg-zinc-950 px-6 text-white select-none">
      <div className="relative w-full max-w-md flex flex-col items-center">
        {hasClerk ? (
          <SignUp
            routing="hash"
            fallbackRedirectUrl="/"
            signInUrl="/login"
            appearance={{
              elements: {
                card: "bg-[#18181b] border border-zinc-800 shadow-2xl rounded-2xl text-white",
                headerTitle: "text-white font-bold text-xl",
                headerSubtitle: "text-zinc-400 text-xs",
                socialButtonsBlockButton: "border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800",
                formButtonPrimary: "bg-indigo-600 hover:bg-indigo-700 text-white font-semibold",
                footerActionLink: "text-indigo-400 hover:text-indigo-300 font-semibold",
              },
            }}
          />
        ) : (
          <div className="bg-[#18181b] border border-zinc-800 p-8 rounded-2xl text-center space-y-4">
            <h2 className="text-xl font-bold">Sign Up for Postvis</h2>
            <p className="text-xs text-zinc-400">Configure valid Clerk keys to enable registration.</p>
            <Link
              href="/"
              className="inline-block py-2.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
            >
              Continue to Studio Demo
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
