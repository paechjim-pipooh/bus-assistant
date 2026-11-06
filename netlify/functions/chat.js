const MODEL = 'claude-haiku-5-5';
const FALLBACK = "Sorry PIPOOH, B.U.S. is taking a little break. Please try again in a moment!";

const SYSTEM = `You are B.U.S., a friendly, warm and fun AI assistant for a child named PIPOOH.
Rules:
- Always reply in simple, natural English a child can understand.
- Keep replies short: usually 1 to 3 sentences. Be encouraging and curious.
- Call the child "PIPOOH". Refer to yourself as B.U.S.
- Never claim to be a human. If asked, say you are an AI assistant.
- Never ask for or repeat personal details such as full name, school, address, phone number, or photos.
- Keep everything safe and suitable for a young child. Do not discuss violence, weapons, drugs, sexual topics, or scary content. Gently change the topic and suggest talking to a trusted adult.
- If PIPOOH says they feel sad, scared, or hurt, respond kindly and tell them to talk to a parent or trusted adult right away.
- If you do not know something, say so honestly instead of guessing.`;

// ตัวกรองก่อนส่งถึง AI (ประหยัดค่าใช้จ่ายและปลอดภัยกว่า)
const CARE_RE = /\b(hurt myself|kill myself|suicide|want to die|self[- ]?harm)\b/i;
const BLOCK_RE = /\b(kill|murder|gun|knife|weapon|drugs?|sex|sexual|naked|porn|blood)\b/i;
const PHONE_RE = /\d{8,}/;

const CARE_REPLY = "PIPOOH, if you feel sad, scared, or hurt, please tell a parent or a grown-up you trust right now. You are not alone.";
const BLOCK_REPLY = "That's not something B.U.S. can talk about, PIPOOH. Please ask a parent or a grown-up you trust. Want to talk about something fun instead?";
const PHONE_REPLY = "Please don't share your phone number or address with me, PIPOOH. Ask a parent if you need help with that.";
const LIMIT_REPLY = "B.U.S. needs a little rest now, PIPOOH. Let's talk again later!";

// จำกัดจำนวนครั้งต่อชั่วโมงต่อผู้ใช้ (หมายเหตุ: นับในหน่วยความจำของเซิร์ฟเวอร์ อาจรีเซ็ตเมื่อระบบพักตัว)
const hits = new Map();
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_HOUR = 60;
function overLimit(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter(t => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_HOUR;
}

const json = (statusCode, obj) => ({
  statusCode,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(obj)
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return json(400, { error: 'Bad JSON' }); }

  const message = String(body.message || '').trim().slice(0, 300);
  if (!message) return json(400, { error: 'Missing message' });

  const ip = event.headers['x-nf-client-connection-ip'] || event.headers['client-ip'] || 'unknown';
  if (overLimit(ip)) return json(429, { reply: LIMIT_REPLY });

  if (CARE_RE.test(message)) return json(200, { reply: CARE_REPLY });
  if (BLOCK_RE.test(message)) return json(200, { reply: BLOCK_REPLY });
  if (PHONE_RE.test(message)) return json(200, { reply: PHONE_REPLY });

  let history = (Array.isArray(body.history) ? body.history : [])
    .filter(h => (h.role === 'user' || h.role === 'assistant') && typeof h.content === 'string')
    .slice(-10)
    .map(h => ({ role: h.role, content: h.content.slice(0, 500) }));
  while (history.length && history[0].role !== 'user') history.shift();

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 300,
        system: SYSTEM,
        messages: [...history, { role: 'user', content: message }]
      })
    });
    if (!res.ok) throw new Error('Upstream status ' + res.status);
    const data = await res.json();
    const reply = (data.content || []).map(b => b.text || '').join('').trim();
    return json(200, { reply: reply || FALLBACK });
  } catch (err) {
    console.error(err);
    return json(200, { reply: FALLBACK });
  } finally {
    clearTimeout(timer);
  }
};
