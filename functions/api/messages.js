// 管理员密钥（请修改为自己的密钥，不要泄露）
const ADMIN_KEY = 'lika070612';

export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const adminKeyFromHeader = request.headers.get('X-Admin-Key');

    // 简单的权限检查
    const isAdmin = (adminKeyFromHeader === ADMIN_KEY);

    if (request.method === 'GET') {
        // 获取所有留言
        const messages = await env.MESSAGE_STORE.get('messages', { type: 'json' });
        const list = messages || [];

        // 根据权限过滤私密留言内容
        const filtered = list.map(msg => {
            if (msg.type === 'private') {
                if (isAdmin) {
                    return msg; // 管理员返回明文
                } else {
                    return { ...msg, content: '' }; // 非管理员不返回内容
                }
            }
            return msg;
        });

        return new Response(JSON.stringify(filtered), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    if (request.method === 'POST') {
        const body = await request.json();
        const { nickname, content, type, secretKey } = body;

        if (!content || !type) {
            return new Response('Invalid request', { status: 400 });
        }

        let entry = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2),
            nickname: nickname || '匿名',
            type,
            timestamp: Date.now()
        };

        if (type === 'public') {
            entry.content = content;
        } else if (type === 'restricted') {
            // 使用 secretKey 加密内容后存储（后端不做加密，由前端加密？为了安全，我们在后端加密）
            // 这里简单示例：如果前端没加密，这里可以用 AES 加密，但需要导入库。
            // 为了方便，我们假设前端在提交时已经用 CryptoJS 加密好了，直接存加密字符串。
            // 统一：我们要求前端提交 restricted 类型时，content 已经是加密后的内容。
            // 因此此处直接存储前端传来的 content（已是密文）。
            entry.encryptedContent = content;
        } else if (type === 'private') {
            // 私密留言存明文，权限由 GET 控制
            entry.content = content;
        }

        // 从 KV 读取现有列表，追加并保存
        const messages = await env.MESSAGE_STORE.get('messages', { type: 'json' });
        const list = messages || [];
        list.push(entry);
        await env.MESSAGE_STORE.put('messages', JSON.stringify(list));

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    return new Response('Method not allowed', { status: 405 });
}