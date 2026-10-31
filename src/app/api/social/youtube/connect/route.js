import { NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import config from "@/lib/config";
import { SocialAccountStore } from "@/lib/integrations/social-manager";
import { prisma } from "@/lib/prisma";

export async function POST(req) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { redirectUrl } = await req.json().catch(() => ({}));
    const apiKey = config.ai.apiKey;
    const extUserId = session.user.email;
    const finalRedirect = redirectUrl || `${config.auth.url}/integrations`;

    // Zero-cost connection fallback helper
    const connectZeroCost = async (reason) => {
      console.warn(`[YOUTUBE_CONNECT_ZERO_COST] Connecting YouTube locally: ${reason}`);
      const newAccount = SocialAccountStore.add({
        platform_name: "youtube",
        account_name: `${session.user.name || "Creator"}'s YouTube Channel`,
        platform_user_id: `yt_${Date.now().toString().slice(-6)}`,
      });

      try {
        await prisma.account.create({
          data: {
            userId: session.user.id,
            type: "oauth",
            provider: "youtube",
            providerAccountId: String(newAccount.id),
            account_name: newAccount.account_name,
            platform: 1,
            platform_name: "youtube",
            connected_at: newAccount.connected_at,
          }
        });
      } catch (dbErr) {
        console.warn("[YOUTUBE_DB_WARN] Could not persist to jsonDb.account:", dbErr.message);
      }

      const targetUrl = new URL(finalRedirect, config.auth.url || "http://localhost:3000");
      targetUrl.searchParams.set("connected", "true");
      targetUrl.searchParams.set("platform", "youtube");
      return NextResponse.json({ url: targetUrl.toString(), local: true, account: newAccount });
    };

    if (!apiKey) {
      return await connectZeroCost("MUAPIAPP_API_KEY is not configured");
    }

    // Call MuAPI to generate the connect URL
    try {
      const res = await fetch("https://api.muapi.ai/api/v1/social/youtube/connect-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey
        },
        body: JSON.stringify({
          external_user_id: extUserId,
          redirect_to: finalRedirect
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          return NextResponse.json({ url: data.url });
        }
      }

      const errText = await res.text().catch(() => "");
      console.warn(`[YOUTUBE_CONNECT_WARNING] MuAPI returned status ${res.status}:`, errText);
      return await connectZeroCost(`MuAPI returned ${res.status}: ${errText || "Authorization failed"}`);
    } catch (err) {
      console.warn("[YOUTUBE_CONNECT_NET_ERROR]", err.message);
      return await connectZeroCost(`Network error contacting MuAPI: ${err.message}`);
    }
  } catch (error) {
    console.error("[YOUTUBE_CONNECT_ERROR]", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
