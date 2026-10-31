import { NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import config from "@/lib/config";
import { SocialAccountStore, PLATFORMS_CONFIG } from "@/lib/integrations/social-manager";
import { prisma } from "@/lib/prisma";

const PLATFORM_ID_MAP = {
  youtube: 1,
  tiktok: 2,
  instagram: 3,
  x: 4,
  x_twitter: 4,
  twitter: 4,
  facebook: 5,
  linkedin: 6,
  threads: 7,
  pinterest: 8
};

export async function GET(req) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const apiKey = config.ai.apiKey;
    const email = session.user.email;
    const accounts = [];
    const seenIds = new Set();

    if (apiKey) {
      // 1. Fetch all accounts connected on behalf of the end-user (YouTube, TikTok, Instagram, Facebook, X, LinkedIn, Threads, Pinterest)
      try {
        const extRes = await fetch(`https://api.muapi.ai/api/v1/social/ext/accounts?external_user_id=${encodeURIComponent(email)}`, {
          headers: { "x-api-key": apiKey }
        });
        if (extRes.ok) {
          const extAccounts = await extRes.json();
          if (Array.isArray(extAccounts)) {
            extAccounts.forEach(acc => {
              const rawPlat = (acc.platform_name || "").toLowerCase();
              const platName = rawPlat === "x" || rawPlat === "twitter" ? "x_twitter" : rawPlat;
              const platId = PLATFORM_ID_MAP[platName] || acc.platform || 99;
              
              if (!seenIds.has(acc.id)) {
                seenIds.add(acc.id);
                accounts.push({
                  id: acc.id,
                  platform: platId,
                  platform_name: platName,
                  account_name: acc.account_name || `${PLATFORMS_CONFIG[platName]?.name || platName} Account`,
                  platform_user_id: acc.platform_user_id,
                  connected_at: acc.connected_at
                });
              }
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch external accounts:", err);
      }

      // 2. Fetch first-party accounts (connected under the developer's key)
      try {
        const devRes = await fetch("https://muapi.ai/api/social/accounts", {
          headers: { "x-api-key": apiKey }
        });
        if (devRes.ok) {
          const devAccounts = await devRes.json();
          if (Array.isArray(devAccounts)) {
            devAccounts.forEach(acc => {
              const rawPlat = (acc.platform_name || "").toLowerCase();
              const platName = rawPlat === "x" || rawPlat === "twitter" ? "x_twitter" : rawPlat;
              const platId = PLATFORM_ID_MAP[platName] || acc.platform || 99;
              
              if (!seenIds.has(acc.id)) {
                seenIds.add(acc.id);
                accounts.push({
                  id: acc.id,
                  platform: platId,
                  platform_name: platName,
                  account_name: acc.account_name || `${PLATFORMS_CONFIG[platName]?.name || platName} Account`,
                  platform_user_id: acc.platform_user_id,
                  connected_at: acc.connected_at
                });
              }
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch developer accounts:", err);
      }
    }

    // 3. Merge persisted accounts from zero-cost JSON DB
    try {
      const dbAccounts = await prisma.account.findMany({
        where: { userId: session.user.id }
      });
      if (Array.isArray(dbAccounts)) {
        dbAccounts.forEach(acc => {
          const id = acc.providerAccountId || acc.id;
          if (!seenIds.has(id)) {
            seenIds.add(id);
            accounts.push({
              id: isNaN(Number(id)) ? id : Number(id),
              platform: acc.platform || 1,
              platform_name: acc.platform_name || acc.provider || "youtube",
              account_name: acc.account_name || "Connected Channel",
              platform_user_id: acc.providerAccountId || acc.id,
              connected_at: acc.connected_at || acc.createdAt,
            });
          }
        });
      }
    } catch (dbErr) {
      console.warn("[ACCOUNTS_DB_WARN] Could not read from prisma.account:", dbErr.message);
    }

    // 4. Merge local SocialAccountStore accounts
    const localAccounts = SocialAccountStore.getAll();
    localAccounts.forEach(acc => {
      if (!seenIds.has(acc.id)) {
        seenIds.add(acc.id);
        accounts.push(acc);
      }
    });

    return NextResponse.json(accounts);
  } catch (error) {
    console.error("[GET_ACCOUNTS_ERROR]", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
