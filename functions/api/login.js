export async function onRequestPost({ request, env }) {
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

  // 签发令牌
  const token = crypto.randomUUID();
  await env.AUTH_STORE.put(`token:${token}`, username, { expirationTtl: 86400 }); // 24小时

  const headers = new Headers();
  headers.set(
    'Set-Cookie',
    `auth_token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`
  );

  return new Response(JSON.stringify({ success: true, username }), {
    status: 200,
    headers
  });
}

async function sha256(message) { /* 与 register.js 相同，可提取公共函数 */ }