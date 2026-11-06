const SYSTEM = `คุณคือ B.U.S. ผู้ช่วย AI ที่เป็นมิตร อบอุ่น สนุก
คุยกับน้อง PIPOOH ซึ่งเป็นเด็ก ตอบสั้น ภาษาไทยที่เข้าใจง่าย
ถ้าถูกถามว่าเป็นคนจริงหรือไม่ ให้ตอบตามจริงว่าเป็น AI`;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  const { message, history = [] } = JSON.parse(event.body || '{}');
  if (!message) return { statusCode: 400, body: 'Missing message' };

  const messages = [
    ...history.slice(-10),
    { role: 'user', content: message }
  ];

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-haiku-5-5',
      max_tokens: 300,
      system: SYSTEM,
      messages
    })
  });

  const data = await res.json();
  const reply = data.content?.map(b => b.text || '').join('') || 'ขอโทษครับ พี่ B.U.S. ตอบไม่ได้ตอนนี้';
  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ reply })
  };
};
