// functions/api/register.js
export async function onRequestPost({ request, env }) {
  try {
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
  } catch (err) {
    console.error('register error:', err);
    return new Response(JSON.stringify({ error: '服务器内部错误' }), { status: 500 });
  }
}

async function sha256(message) { /* 与 login.js 相同的函数 */ }