export async function onRequestPost({ request, env }) {
  const { username, password } = await request.json();
  if (!username || !password) {
    return new Response(JSON.stringify({ error: '用户名和密码不能为空' }), { status: 400 });
  }
  if (username.length < 2 || password.length < 6) {
    return new Response(JSON.stringify({ error: '用户名至少2位，密码至少6位' }), { status: 400 });
  }

  const userKey = `user:${username}`;
  const exists = await env.AUTH_STORE.get(userKey);
  if (exists) {
    return new Response(JSON.stringify({ error: '用户名已存在' }), { status: 409 });
  }

  const hash = await sha256(password);
  await env.AUTH_STORE.put(userKey, JSON.stringify({ passwordHash: hash }));

  return new Response(JSON.stringify({ success: true }), { status: 201 });
}

async function sha256(message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}