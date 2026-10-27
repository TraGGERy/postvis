"use client";

import { useUser, useClerk } from "@clerk/nextjs";

/**
 * Universal Auth Hook for Postvis:
 * Works seamlessly with Clerk authentication,
 * and provides a graceful demo creator profile when Clerk keys are not yet configured.
 */
export function useAuthUser() {
  const hasClerk = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  // If Clerk is not active or in local preview mode
  if (!hasClerk) {
    return {
      session: {
        user: {
          id: "creator-main",
          name: "Social Creator",
          email: "creator@postvis.local",
          image: null,
          credits: 100,
        },
      },
      status: "authenticated",
      isSignedIn: true,
      isLoaded: true,
      user: {
        id: "creator-main",
        fullName: "Social Creator",
        primaryEmailAddress: { emailAddress: "creator@postvis.local" },
      },
      signOut: () => {
        window.location.href = "/login";
      },
      openSignIn: () => {
        window.location.href = "/login";
      },
    };
  }

  // When Clerk is configured
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { isSignedIn, user, isLoaded } = useUser();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { signOut, openSignIn } = useClerk();

  const session =
    isSignedIn && user
      ? {
          user: {
            id: user.id,
            name:
              user.fullName ||
              [user.firstName, user.lastName].filter(Boolean).join(" ") ||
              user.username ||
              "Creator",
            email: user.primaryEmailAddress?.emailAddress || "",
            image: user.imageUrl || null,
            credits: 100,
          },
        }
      : null;

  return {
    session,
    status: !isLoaded ? "loading" : isSignedIn ? "authenticated" : "unauthenticated",
    isSignedIn: Boolean(isSignedIn),
    isLoaded,
    user,
    signOut: () => signOut({ redirectUrl: "/login" }),
    openSignIn,
  };
}

export default useAuthUser;
