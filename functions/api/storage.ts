interface Env {
  ROTO_KV: KVNamespace;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const key = url.searchParams.get("key");
  if (!key) return new Response(JSON.stringify({ error: "Missing key" }), { status: 400 });

  const value = await env.ROTO_KV.get(key);
  return new Response(JSON.stringify({ value }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const { key, value } = await request.json() as { key: string; value: string };
  if (!key || value === undefined) return new Response(JSON.stringify({ error: "Missing key or value" }), { status: 400 });

  await env.ROTO_KV.put(key, value);
  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};
