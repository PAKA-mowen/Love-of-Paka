// functions/api/login.js
export async function onRequestPost({ request, env }) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return new Response(JSON.stringify({ error: '用户名和密码不能为空' }), { status: 400 });
    }

    const userKey = `user:${username}`;
    const userData = await env.AUTH_STORE.get(userKey, { type: 'json' });
    if (!userData) {
      return new Response(JSON.stringify({ error: '用户名或密码错误' }), { status: 401 });
    }

    const hashedInput = await sha256(password);
    if (hashedInput !== userData.passwordHash) {
      return new Response(JSON.stringify({ error: '用户名或密码错误' }), { status: 401 });
    }

    const token = crypto.randomUUID();
    await env.AUTH_STORE.put(`token:${token}`, username, { expirationTtl: 86400 });

    const headers = new Headers();
    headers.set('Set-Cookie', `auth_token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`);

    return new Response(JSON.stringify({ success: true, username }), { status: 200, headers });
  } catch (err) {
    console.error('login error:', err);
    return new Response(JSON.stringify({ error: '服务器内部错误' }), { status: 500 });
  }
}

async function sha256(message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}