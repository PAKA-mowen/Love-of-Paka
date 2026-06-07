export async function onRequestPost({ request, env }) {
    try {
        const { username } = await request.json();
        if (!username) {
            return new Response(JSON.stringify({ error: '未提供用户名' }), { status: 400 });
        }

        // 检查今日是否已打卡（防止重复积分）
        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const checkinKey = `checkin:${username}:${today}`;
        const alreadyCheckin = await env.AUTH_STORE.get(checkinKey);
        if (alreadyCheckin) {
            return new Response(JSON.stringify({ error: '今日已打卡' }), { status: 409 });
        }

        // 更新积分（存储在 user:username 对象中）
        const userKey = `user:${username}`;
        const userDataStr = await env.AUTH_STORE.get(userKey);
        let userData = {};
        if (userDataStr) {
            try {
                userData = JSON.parse(userDataStr);
            } catch (e) {}
        }
        // 积分字段名 score，每次加10
        const currentScore = (userData.score || 0) + 10;
        userData.score = currentScore;

        // 保存用户数据
        await env.AUTH_STORE.put(userKey, JSON.stringify(userData));
        // 标记今日已打卡
        await env.AUTH_STORE.put(checkinKey, '1', { expirationTtl: 86400 }); // 24小时后自动删除

        return new Response(JSON.stringify({ success: true, totalScore: currentScore }), { status: 200 });
    } catch (err) {
        console.error('checkin error:', err);
        return new Response(JSON.stringify({ error: '服务器错误' }), { status: 500 });
    }
}