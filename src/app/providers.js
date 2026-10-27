"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";

export function Providers({ children }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  const innerContent = (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          className:
            "bg-white dark:bg-[#201f1f] text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-[#2e2d2d] shadow-lg rounded-xl text-xs font-medium",
          duration: 3500,
        }}
      />
    </ThemeProvider>
  );

  // If Clerk Publishable Key is available, wrap with ClerkProvider
  if (publishableKey) {
    return (
      <ClerkProvider publishableKey={publishableKey}>
        {innerContent}
      </ClerkProvider>
    );
  }

  return innerContent;
}
