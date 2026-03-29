interface Env {
  ROTO_KV: KVNamespace;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return new Response(JSON.stringify({ error: "No code provided" }), { status: 400 });
  }

  const clientId = await env.ROTO_KV.get("yahoo_client_id");
  const clientSecret = await env.ROTO_KV.get("yahoo_client_secret");

  if (!clientId || !clientSecret) {
    return new Response(JSON.stringify({ error: "Missing credentials in KV" }), { status: 500 });
  }

  const credentials = btoa(`${clientId}:${clientSecret}`);

  const tokenRes = await fetch("https://api.login.yahoo.com/oauth2/get_token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: `${url.origin}/api/yahoo-auth`,
    }).toString(),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    return new Response(JSON.stringify({ error: "Token exchange failed", detail: err }), { status: 500 });
  }

  const tokens = await tokenRes.json() as { access_token: string; refresh_token: string; expires_in: number };

  await env.ROTO_KV.put("yahoo_access_token", tokens.access_token);
  await env.ROTO_KV.put("yahoo_refresh_token", tokens.refresh_token);
  await env.ROTO_KV.put("yahoo_token_expiry", String(Date.now() + tokens.expires_in * 1000));

  return new Response(JSON.stringify({ ok: true, message: "Tokens stored successfully. You are authorized!" }), {
    headers: { "Content-Type": "application/json" },
  });
};
