const API_BASE = '/api/messages';
let isAdmin = false;
let adminKey = '';
let currentTab = 'public'; // 当前选中的类型

document.addEventListener('DOMContentLoaded', () => {
    // 管理员恢复
    const savedAdminKey = localStorage.getItem('admin_key');
    if (savedAdminKey) {
        adminKey = savedAdminKey;
        isAdmin = true;
        document.getElementById('adminStatus').innerText = '✅ 已验证';
    }

    // 管理员入口按钮
    const toggleBtn = document.getElementById('adminToggleBtn');
    const loginBox = document.getElementById('adminLoginBox');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            loginBox.style.display = loginBox.style.display === 'none' ? 'flex' : 'none';
        });
    }

    // 标签切换
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function () {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            currentTab = this.dataset.type;
            loadMessages();
        });
    });

    // 留言类型下拉
    document.getElementById('messageType').addEventListener('change', function (e) {
        const keyInput = document.getElementById('secretKeyInput');
        keyInput.style.display = e.target.value === 'restricted' ? 'inline-block' : 'none';
    });

    // 初始加载
    loadMessages();
});

async function loadMessages() {
    try {
        const headers = {};
        if (isAdmin && adminKey) headers['X-Admin-Key'] = adminKey;
        const res = await fetch(API_BASE, { headers });
        const messages = await res.json();
        renderMessages(messages);
    } catch (err) {
        console.error('加载留言失败', err);
    }
}

function renderMessages(messages) {
    const container = document.getElementById('messageContainer');
    const filtered = messages.filter(msg => msg.type === currentTab);

    if (filtered.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#8b7b6b;">暂无留言</p>';
        return;
    }

    container.innerHTML = filtered.map(msg => {
        const timeStr = new Date(msg.timestamp).toLocaleString();
        const preview = getPreview(msg);
        return `
      <div class="msg-compact" data-id="${msg.id}">
        <div class="msg-header" onclick="toggleDetail('${msg.id}')">
          <span class="msg-nick">${escapeHtml(msg.nickname || '匿名')}</span>
          <span class="msg-time">${timeStr}</span>
        </div>
        <div class="msg-preview" onclick="toggleDetail('${msg.id}')">${escapeHtml(preview)}</div>
        <div class="msg-detail" id="detail-${msg.id}">
          ${buildDetailContent(msg)}
          ${isAdmin ? `<button class="delete-btn" onclick="deleteMessage('${msg.id}')">🗑️ 删除</button>` : ''}
        </div>
      </div>
    `;
    }).join('');
}

function getPreview(msg) {
    if (msg.type === 'private' && !isAdmin) return '🔒 仅站长可见';
    if (msg.type === 'restricted') return '🔑 加密留言，点击展开并输入密钥';
    let text = msg.content || '';
    if (text.length > 30) return text.slice(0, 30) + '...';
    return text || '(无内容)';
}

function buildDetailContent(msg) {
    if (msg.type === 'public') {
        return `<div class="msg-full-content">${escapeHtml(msg.content)}</div>`;
    }
    if (msg.type === 'restricted') {
        return `
      <div class="msg-full-content" style="font-family:monospace; background:#f0ede5;">
        ${escapeHtml(msg.encryptedContent)}
      </div>
      <div class="decrypt-row">
        <input type="text" id="key-${msg.id}" placeholder="输入密钥解密" />
        <button onclick="decryptMessage('${msg.id}', '${escapeHtml(msg.encryptedContent)}')">解密</button>
      </div>
      <div id="decrypted-${msg.id}" style="margin-top:0.5rem; color:#2c3e50;"></div>
    `;
    }
    if (msg.type === 'private') {
        if (isAdmin) {
            return `<div class="msg-full-content">${escapeHtml(msg.content)}</div>`;
        }
        return `<div class="msg-full-content" style="color:#8b7b6b; font-style:italic;">🔒 这是一条私密留言，仅站长可见</div>`;
    }
}

// 点击卡片展开/收起
function toggleDetail(id) {
    const detail = document.getElementById(`detail-${id}`);
    if (detail) {
        detail.classList.toggle('open');
    }
}

// 删除留言
async function deleteMessage(id) {
    if (!confirm('确定要删除这条留言吗？')) return;
    try {
        await fetch(`${API_BASE}?id=${id}`, {
            method: 'DELETE',
            headers: { 'X-Admin-Key': adminKey }
        });
        loadMessages();
    } catch (err) {
        alert('删除失败');
    }
}

// 提交留言
async function submitMessage() {
    const nickname = document.getElementById('nickname').value.trim() || '匿名';
    const content = document.getElementById('messageContent').value.trim();
    const type = document.getElementById('messageType').value;
    const secretKey = document.getElementById('secretKeyInput').value.trim();

    if (!content) { alert('留言内容不能为空'); return; }
    if (type === 'restricted' && !secretKey) { alert('请设置一个查看密钥'); return; }

    let finalContent = content;
    if (type === 'restricted') {
        finalContent = CryptoJS.AES.encrypt(content, secretKey).toString();
    }

    try {
        await fetch(API_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nickname, content: finalContent, type })
        });
        document.getElementById('nickname').value = '';
        document.getElementById('messageContent').value = '';
        document.getElementById('secretKeyInput').value = '';
        loadMessages();
    } catch (err) {
        alert('提交失败');
    }
}

function decryptMessage(msgId, encryptedContent) {
    const keyInput = document.getElementById(`key-${msgId}`);
    const key = keyInput.value.trim();
    if (!key) return;
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedContent, key);
        const original = bytes.toString(CryptoJS.enc.Utf8);
        document.getElementById(`decrypted-${msgId}`).innerText = original || '⚠️ 密钥错误';
    } catch (e) {
        document.getElementById(`decrypted-${msgId}`).innerText = '⚠️ 解密失败';
    }
}

function loginAsAdmin() {
    const key = document.getElementById('adminKeyInput').value.trim();
    if (!key) { alert('请输入管理员密码'); return; }
    adminKey = key;
    isAdmin = true;
    localStorage.setItem('admin_key', key);
    document.getElementById('adminStatus').innerText = '✅ 已验证';
    document.getElementById('adminLoginBox').style.display = 'none';
    loadMessages();
}

function escapeHtml(text) {
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}