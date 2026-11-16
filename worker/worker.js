// Cloudflare Worker: AI proxy for ICSE Study Hub. Your API key lives here, never in the page.
const MODELS = ["gemini-3.8-flash", "gemini-3.6-flash", "gemini-2.5-flash"];
const DAILY_LIMIT = 20; // AI requests per visitor (IP) per day

export default {
  async fetch(req, env) {
    const origin = req.headers.get("Origin") || "";
    const cors = {
      "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "content-type",
      "Vary": "Origin",
    };
    const send = (o, s = 200) =>
      new Response(JSON.stringify(o), { status: s, headers: { ...cors, "content-type": "application/json" } });

    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    if (req.method !== "POST" || origin !== env.ALLOWED_ORIGIN) return send({ error: "Not allowed" }, 403);

    let body;
    try { body = await req.json(); } catch { return send({ error: "Bad request" }, 400); }
    const prompt = String(body.prompt || "");
    if (!prompt || prompt.length > 8000) return send({ error: "Prompt missing or too long" }, 400);
    const images = (Array.isArray(body.images) ? body.images : []).slice(0, 2).filter(
      (i) => /^image\/(png|jpe?g|webp)$/.test(i.mime) && typeof i.data === "string" && i.data.length < 6e6
    );

    if (env.RATE) {
      const ip = req.headers.get("CF-Connecting-IP") || "unknown";
      const key = "r:" + ip + ":" + new Date().toISOString().slice(0, 10);
      const n = Number((await env.RATE.get(key)) || 0);
      if (n >= DAILY_LIMIT) return send({ error: "Daily free limit reached. Try again tomorrow." }, 429);
      await env.RATE.put(key, String(n + 1), { expirationTtl: 90000 });
    }

    const parts = [...images.map((i) => ({ inline_data: { mime_type: i.mime, data: i.data } })), { text: prompt }];
    for (const m of MODELS) {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
        body: JSON.stringify({ contents: [{ parts }] }),
      });
      if (r.status === 404) continue;
      if (r.status === 429) return send({ error: "The AI is busy right now. Try again in a minute." }, 429);
      if (!r.ok) return send({ error: "AI service error" }, 502);
      const j = await r.json();
      const text = ((j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || [])
        .map((x) => x.text || "").join("");
      return text ? send({ text }) : send({ error: "No answer returned. Try rephrasing." }, 502);
    }
    return send({ error: "No AI model available" }, 502);
  },
};
