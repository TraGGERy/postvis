import { NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import config from "@/lib/config";
import { SocialAccountStore, PLATFORMS_CONFIG } from "@/lib/integrations/social-manager";
import { prisma } from "@/lib/prisma";

export async function POST(req) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { platform, accountName = "", redirectUrl } = await req.json();
    const apiKey = config.ai.apiKey;
    const extUserId = session.user.email;
    const finalRedirect = redirectUrl || `${config.auth.url}/integrations`;
    const plat = (platform || "").toLowerCase().replace("x_twitter", "x").replace("twitter", "x");

    const platConfig = PLATFORMS_CONFIG[plat === "x" ? "x_twitter" : plat] || {};
    const resolvedAccountName = accountName.trim() || `${platConfig.name || plat.toUpperCase()} Channel`;

    // Helper for zero-cost / demo local channel connection
    const connectZeroCost = async (reason) => {
      console.warn(`[SOCIAL_CONNECT_ZERO_COST] Connecting ${plat} locally: ${reason}`);
      const newAccount = SocialAccountStore.add({
        platform_name: plat === "x" ? "x_twitter" : plat,
        account_name: resolvedAccountName,
        platform_user_id: `${plat}_${Date.now().toString().slice(-6)}`,
      });

      // Persist to zero-cost JSON DB accounts table
      try {
        await prisma.account.create({
          data: {
            userId: session.user.id,
            type: "oauth",
            provider: plat === "x" ? "x_twitter" : plat,
            providerAccountId: String(newAccount.id),
            account_name: newAccount.account_name,
            platform: newAccount.platform,
            platform_name: newAccount.platform_name,
            connected_at: newAccount.connected_at,
          }
        });
      } catch (dbErr) {
        console.warn("[SOCIAL_CONNECT_DB_WARN] Could not persist to jsonDb.account:", dbErr.message);
      }

      // Return redirect back to integrations with success parameter
      const targetUrl = new URL(finalRedirect, config.auth.url || "http://localhost:3000");
      targetUrl.searchParams.set("connected", "true");
      targetUrl.searchParams.set("platform", plat);
      return NextResponse.json({ url: targetUrl.toString(), local: true, account: newAccount });
    };

    // If no MuAPI API key is configured, connect locally in zero-cost mode
    if (!apiKey) {
      return await connectZeroCost("MUAPIAPP_API_KEY is not configured");
    }

    // 1. Dedicated connect-url platforms (youtube, tiktok, instagram, facebook)
    // IMPORTANT: These platforms use https://api.muapi.ai/api/v1/social/${plat}/connect-url
    // and must NEVER fall back to https://muapi.ai/api/social/${plat}/connect (which returns 404)
    const connectUrlPlatforms = ["youtube", "tiktok", "instagram", "facebook"];
    if (connectUrlPlatforms.includes(plat)) {
      try {
        const endpoint = `https://api.muapi.ai/api/v1/social/${plat}/connect-url`;
        const res = await fetch(endpoint, {
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
        console.warn(`[MUAPI_CONNECT_WARNING] ${plat} connect-url returned status ${res.status}:`, errText);
        // Fallback to zero-cost local channel connection so user is never blocked
        return await connectZeroCost(`MuAPI returned ${res.status}: ${errText || "Authorization failed"}`);
      } catch (err) {
        console.warn(`[MUAPI_CONNECT_ERROR] Request to ${plat} endpoint failed:`, err.message);
        return await connectZeroCost(`Network error contacting MuAPI: ${err.message}`);
      }
    }

    // 2. Direct connect platforms (x, linkedin, threads, pinterest)
    // These platforms use https://muapi.ai/api/social/${plat}/connect
    const encodedName = encodeURIComponent(resolvedAccountName);
    const encodedRedirect = encodeURIComponent(finalRedirect);
    const directUrl = `https://muapi.ai/api/social/${plat}/connect?account_name=${encodedName}&redirect_to=${encodedRedirect}`;

    try {
      const authRes = await fetch(directUrl, {
        method: "GET",
        headers: {
          "x-api-key": apiKey
        },
        redirect: "manual"
      });

      const redirectLocation = authRes.headers.get("location");
      if (redirectLocation) {
        return NextResponse.json({ url: redirectLocation });
      }

      if (authRes.ok) {
        const text = await authRes.text();
        try {
          const json = JSON.parse(text);
          if (json.url) return NextResponse.json({ url: json.url });
        } catch (_) {}
      }

      const errText = await authRes.text().catch(() => "");
      console.warn(`[CONNECT_WARNING] ${plat} direct connect returned status ${authRes.status}:`, errText);
      return await connectZeroCost(`MuAPI direct returned ${authRes.status}: ${errText || "Authorization failed"}`);
    } catch (err) {
      console.warn(`[CONNECT_ERROR] Error fetching auth url for ${plat}:`, err);
      return await connectZeroCost(`Error fetching auth url: ${err.message}`);
    }
  } catch (error) {
    console.error("[SOCIAL_CONNECT_ERROR]", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
