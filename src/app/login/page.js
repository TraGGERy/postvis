"use client";

import { SignIn, useUser } from "@clerk/nextjs";
import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FaInfoCircle } from "react-icons/fa";

function LoginContent() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("redirect_url") || searchParams.get("callbackUrl") || "/";
  const hasClerk = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push(next);
    }
  }, [isLoaded, isSignedIn, router, next]);

  return (
    <div className="min-h-dvh flex items-center justify-center bg-zinc-950 px-6 text-white select-none">
      <div className="relative w-full max-w-md flex flex-col items-center">
        {hasClerk ? (
          <SignIn
            routing="hash"
            fallbackRedirectUrl={next}
            signUpUrl="/sign-up"
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
          <div className="bg-[#18181b] border border-zinc-800 w-full rounded-2xl p-8 space-y-6 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-full bg-indigo-500/10 border border-indigo-500/20 mx-auto flex items-center justify-center text-2xl text-indigo-400 font-black">
              P
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">Postvis Studio Sign In</h2>
              <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                Connect your Clerk account to access post scheduling, AI writer, and social integrations.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-left text-xs text-zinc-300 space-y-2">
              <p className="font-semibold text-indigo-400">Setup Clerk Keys in .env:</p>
              <code className="block bg-black/50 p-2 rounded text-[11px] text-zinc-400 font-mono select-all">
                NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...<br />
                CLERK_SECRET_KEY=sk_test_...
              </code>
            </div>

            <Link
              href="/"
              className="inline-block w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 text-center"
            >
              Continue to Studio Demo
            </Link>

            <div className="flex items-start gap-2 text-left bg-zinc-900/60 border border-zinc-800/80 p-3 rounded-lg text-[11px] text-zinc-400">
              <FaInfoCircle className="text-indigo-400 text-xs shrink-0 mt-0.5" />
              <span>
                Running in zero-cost JSON DB mode. No external database connection is required.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center bg-zinc-950 text-white">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
