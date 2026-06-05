// API 地址（Cloudflare Pages Functions 会在同域 /api/ 下处理）
const API_BASE = '/api/messages';
let isAdmin = false;          // 管理员模式标志
let adminKey = '';           // 管理员密钥（前端暂存）

// 页面加载时获取并渲染留言
document.addEventListener('DOMContentLoaded', () => {
    // 检查本地存储的管理员密钥
    const savedAdminKey = localStorage.getItem('admin_key');
    if (savedAdminKey) {
        adminKey = savedAdminKey;
        isAdmin = true;
        document.getElementById('adminKeyInput').value = savedAdminKey;
        document.getElementById('adminStatus').innerText = '✅ 管理员模式';
    }
    loadMessages();

    // 监听留言类型切换，显示/隐藏密钥输入框
    document.getElementById('messageType').addEventListener('change', function (e) {
        const keyInput = document.getElementById('secretKeyInput');
        if (e.target.value === 'restricted') {
            keyInput.style.display = 'inline-block';
        } else {
            keyInput.style.display = 'none';
            keyInput.value = '';
        }
    });
});

// 获取留言并渲染到三栏
async function loadMessages() {
    try {
        const headers = {};
        if (isAdmin && adminKey) {
            headers['X-Admin-Key'] = adminKey;
        }
        const res = await fetch(API_BASE, { headers });
        const messages = await res.json();
        renderMessages(messages);
    } catch (err) {
        console.error('加载留言失败', err);
    }
}

// 渲染三栏
function renderMessages(messages) {
    const publicDiv = document.getElementById('publicMessages');
    const restrictedDiv = document.getElementById('restrictedMessages');
    const privateDiv = document.getElementById('privateMessages');

    // 清空
    publicDiv.innerHTML = '';
    restrictedDiv.innerHTML = '';
    privateDiv.innerHTML = '';

    if (!messages.length) {
        publicDiv.innerHTML = '<p class="private-hint">暂无公开留言</p>';
        restrictedDiv.innerHTML = '<p class="private-hint">暂无指定留言</p>';
        privateDiv.innerHTML = '<p class="private-hint">暂无私密留言</p>';
        return;
    }

    messages.forEach(msg => {
        const card = document.createElement('div');
        card.className = 'message-item';
        const timeStr = new Date(msg.timestamp).toLocaleString();

        let contentHtml = '';
        if (msg.type === 'public') {
            contentHtml = escapeHtml(msg.content);
        } else if (msg.type === 'restricted') {
            // 加密内容 + 解密框
            contentHtml = `
        <div class="content" style="font-family:monospace; background:#f0ede5; padding:0.4rem; border-radius:5px;">
          ${escapeHtml(msg.encryptedContent)}
        </div>
        <div style="margin-top:0.5rem;">
          <input type="text" id="key-${msg.id}" placeholder="输入密钥解密" style="width:70%;" />
          <button onclick="decryptMessage('${msg.id}', '${escapeHtml(msg.encryptedContent)}')">解密</button>
          <div id="decrypted-${msg.id}" style="margin-top:0.3rem; color:#2c3e50;"></div>
        </div>
      `;
        } else if (msg.type === 'private') {
            if (isAdmin && msg.content) {
                // 管理员可见明文
                contentHtml = `<div class="content">${escapeHtml(msg.content)}</div>`;
            } else {
                contentHtml = `<div class="private-hint">🔒 这是一条私密留言，仅站长可见</div>`;
            }
        }

        card.innerHTML = `
      <span class="nick">${escapeHtml(msg.nickname || '匿名')}</span>
      <span class="time">${timeStr}</span>
      ${contentHtml}
    `;

        if (msg.type === 'public') publicDiv.appendChild(card);
        else if (msg.type === 'restricted') restrictedDiv.appendChild(card);
        else if (msg.type === 'private') privateDiv.appendChild(card);
    });
}

// 提交留言
async function submitMessage() {
    const nickname = document.getElementById('nickname').value.trim() || '匿名';
    const content = document.getElementById('messageContent').value.trim();
    const type = document.getElementById('messageType').value;
    const secretKey = document.getElementById('secretKeyInput').value.trim();

    if (!content) {
        alert('留言内容不能为空');
        return;
    }
    if (type === 'restricted' && !secretKey) {
        alert('请设置一个查看密钥');
        return;
    }

    let finalContent = content;
    if (type === 'restricted') {
        // 前端使用 secretKey 加密内容
        finalContent = CryptoJS.AES.encrypt(content, secretKey).toString();
    }

    const body = {
        nickname,
        content: finalContent,   // 对于 public/private 是明文，restricted 是密文
        type,
    };

    try {
        await fetch(API_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        // 清空表单
        document.getElementById('nickname').value = '';
        document.getElementById('messageContent').value = '';
        document.getElementById('secretKeyInput').value = '';
        loadMessages();
    } catch (err) {
        alert('提交失败，请重试');
    }
}

// 解密指定留言
function decryptMessage(msgId, encryptedContent) {
    const keyInput = document.getElementById(`key-${msgId}`);
    const key = keyInput.value.trim();
    if (!key) return;
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedContent, key);
        const original = bytes.toString(CryptoJS.enc.Utf8);
        const resultDiv = document.getElementById(`decrypted-${msgId}`);
        if (original) {
            resultDiv.innerText = original;
        } else {
            resultDiv.innerText = '⚠️ 密钥错误';
        }
    } catch (e) {
        document.getElementById(`decrypted-${msgId}`).innerText = '⚠️ 解密失败';
    }
}

// 管理员模式切换
// 点击右上角锁图标，显示/隐藏密码输入框
document.addEventListener('DOMContentLoaded', () => {
    // 原有 DOMContentLoaded 内的代码保留，再追加下列代码
    const toggleBtn = document.getElementById('adminToggleBtn');
    const loginBox = document.getElementById('adminLoginBox');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            if (loginBox.style.display === 'none' || loginBox.style.display === '') {
                loginBox.style.display = 'flex';
            } else {
                loginBox.style.display = 'none';
            }
        });
    }
});

// 管理员登录验证
function loginAsAdmin() {
    const key = document.getElementById('adminKeyInput').value.trim();
    if (!key) {
        alert('请输入管理员密码');
        return;
    }
    adminKey = key;
    isAdmin = true;
    localStorage.setItem('admin_key', key);
    document.getElementById('adminStatus').innerText = '✅ 已验证';
    document.getElementById('adminLoginBox').style.display = 'none';
    loadMessages();  // 重新加载留言以显示私密内容
}

// 注销管理员（可自行扩展）
function logoutAdmin() {
    isAdmin = false;
    adminKey = '';
    localStorage.removeItem('admin_key');
    document.getElementById('adminKeyInput').value = '';
    document.getElementById('adminStatus').innerText = '';
    loadMessages();
}

// 工具函数
function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}