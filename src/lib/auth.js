import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";
import { isValidClerkPublishableKey, isValidClerkSecretKey } from "./clerk-config";

/**
 * Get the currently authenticated user with Clerk,
 * synced automatically to our zero-cost JSON DB.
 */
export async function getAuthenticatedUser() {
  const hasClerk =
    isValidClerkPublishableKey(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) &&
    isValidClerkSecretKey(process.env.CLERK_SECRET_KEY);

  if (hasClerk) {
    try {
      const { userId } = await auth();
      if (!userId) {
        return null;
      }

      const clerkUser = await currentUser();
      const email = clerkUser?.emailAddresses?.[0]?.emailAddress || `${userId}@user.clerk`;
      const name =
        [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") ||
        clerkUser?.username ||
        "Social Creator";

      // Sync user to JSON DB if not already present
      let user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        user = await prisma.user.findUnique({ where: { email } });
        if (user) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { id: userId, name, email },
          });
        } else {
          user = await prisma.user.create({
            data: {
              id: userId,
              name,
              email,
              credits: 100,
            },
          });
        }
      }

      return {
        id: user.id,
        name: user.name || name,
        email: user.email || email,
        credits: user.credits ?? 100,
        image: clerkUser?.imageUrl || null,
      };
    } catch (err) {
      console.warn("[AUTH] Clerk session validation warning:", err.message);
    }
  }

  // Demo fallback when Clerk credentials are not provided (e.g. initial setup)
  return {
    id: "creator-main",
    name: "Social Creator",
    email: "creator@postvis.local",
    credits: 100,
    image: null,
  };
}

/**
 * Compatible helper for existing routes expecting getServerSession()
 */
export async function getServerSession() {
  const user = await getAuthenticatedUser();
  if (!user) return null;
  return { user };
}

export const authOptions = {};
export default getAuthenticatedUser;
