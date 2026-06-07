// functions/api/register.js
export async function onRequestPost({ request, env }) {
    try {
        const body = await request.json();
        const { username, password } = body;

        if (!username || !password) {
            return new Response(JSON.stringify({ error: '用户名和密码不能为空' }), { status: 400 });
        }
        if (username.length < 2 || password.length < 6) {
            return new Response(JSON.stringify({ error: '用户名至少2位，密码至少6位' }), { status: 400 });
        }

        const userKey = `user:${username}`;
        const existing = await env.AUTH_STORE.get(userKey);
        if (existing) {
            return new Response(JSON.stringify({ error: '用户名已存在' }), { status: 409 });
        }

        const hash = await sha256(password);

        // ⚠️ 关键：必须将对象转为 JSON 字符串再存储
        const userData = JSON.stringify({ passwordHash: hash });
        await env.AUTH_STORE.put(userKey, userData);

        return new Response(JSON.stringify({ success: true }), { status: 201 });
    } catch (err) {
        console.error('register error:', err);
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