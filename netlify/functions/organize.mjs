// Serverless proxy: keeps the AI key off the client. Any OpenAI-compatible provider works via env vars.
const hits = new Map();
export default async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const key = process.env.AI_API_KEY;
  if (!key) return new Response('AI not configured', { status: 503 });
  // best-effort rate limit: 30 requests / hour / IP
  const ip = req.headers.get('x-nf-client-connection-ip') || 'x', now = Date.now();
  const recent = (hits.get(ip) || []).filter(t => now - t < 3600e3);
  if (recent.length >= 30) return new Response('Too many requests', { status: 429 });
  hits.set(ip, [...recent, now]);
  let body; try { body = await req.json(); } catch { return new Response('bad request', { status: 400 }); }
  const { prompt, images = [] } = body;
  if (typeof prompt !== 'string' || prompt.length > 4000 || !Array.isArray(images) || images.length > 1) return new Response('bad request', { status: 400 });
  const base = process.env.AI_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4';
  const vision = images.length > 0;
  const model = vision ? (process.env.AI_VISION_MODEL || 'glm-4.6v-flash') : (process.env.AI_MODEL || 'glm-4.7-flash');
  const content = vision ? [...images.map(u => ({ type: 'image_url', image_url: { url: u } })), { type: 'text', text: prompt }] : prompt;
  const payload = { model, messages: [{ role: 'user', content }], temperature: 0.2 };
  if (base.includes('bigmodel.cn')) payload.thinking = { type: 'disabled' };
  const r = await fetch(base.replace(/\/$/, '') + '/chat/completions', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + key }, body: JSON.stringify(payload) });
  if (!r.ok) return new Response('upstream ' + r.status, { status: 502 });
  const j = await r.json();
  const text = (j.choices?.[0]?.message?.content || '').replace(/```json|```/g, '');
  const m = text.match(/\{[\s\S]*\}/);
  try { JSON.parse(m[0]); return new Response(m[0], { headers: { 'content-type': 'application/json' } }); }
  catch { return new Response('bad model output', { status: 502 }); }
};
export const config = { path: '/api/organize' };
