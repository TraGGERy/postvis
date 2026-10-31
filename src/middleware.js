import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isValidClerkPublishableKey } from "@/lib/clerk-config";

const isPublicRoute = createRouteMatcher([
  "/",
  "/login(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/pricing(.*)",
  "/gallery(.*)",
  "/media(.*)",
  "/api/stripe/webhook(.*)",
  "/api/webhook(.*)",
]);

const clerkHandler = clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export default function middleware(req, evt) {
  const pubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  // If Clerk publishable key is not configured or invalid, allow pass-through
  if (!isValidClerkPublishableKey(pubKey)) {
    return NextResponse.next();
  }

  return clerkHandler(req, evt);
}

export const config = {
  matcher: [
    // Match all routes except Next.js internals and static assets
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
