export async function onRequestGet({ env }) {
    try {
        // 获取所有 user: 开头的key
        const list = await env.AUTH_STORE.list({ prefix: 'user:' });
        const rankings = [];
        for (const key of list.keys) {
            const value = await env.AUTH_STORE.get(key.name);
            if (!value) continue;
            try {
                const userData = JSON.parse(value);
                if (userData.score && userData.score > 0) {
                    const username = key.name.replace('user:', '');
                    rankings.push({ username, score: userData.score });
                }
            } catch (e) {}
        }
        // 按积分降序排列
        rankings.sort((a, b) => b.score - a.score);
        return new Response(JSON.stringify({ rankings }), { status: 200 });
    } catch (err) {
        console.error('rank error:', err);
        return new Response(JSON.stringify({ error: '服务器错误' }), { status: 500 });
    }
}