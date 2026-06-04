// 留言存储键名（localStorage）
const STORAGE_KEY = 'encrypted_messages';

// 从 localStorage 读取留言列表
function getMessages() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

// 保存留言列表
function saveMessages(messages) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
}

// AES 加密
function encrypt(text, key) {
  if (!key) return text; // 无密钥则不加密
  return CryptoJS.AES.encrypt(text, key).toString();
}

// AES 解密
function decrypt(cipherText, key) {
  if (!key) return cipherText;
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, key);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    return originalText || '⚠️ 密钥错误或解密失败';
  } catch (e) {
    return '⚠️ 解密出错';
  }
}

// 提交新留言
function submitMessage() {
  const nickname = document.getElementById('nickname').value.trim() || '匿名';
  const message = document.getElementById('message').value.trim();
  const key = document.getElementById('secretKey').value.trim();

  if (!message) {
    alert('留言内容不能为空');
    return;
  }

  // 加密留言（如果有密钥）
  const encryptedContent = encrypt(message, key);
  const newMsg = {
    id: Date.now(),
    nickname,
    encryptedContent,
    hasKey: !!key,          // 标记是否加密
    timestamp: new Date().toLocaleString()
  };

  const messages = getMessages();
  messages.unshift(newMsg);
  saveMessages(messages);

  // 清空表单
  document.getElementById('nickname').value = '';
  document.getElementById('message').value = '';
  document.getElementById('secretKey').value = '';

  renderMessages();
}

// 渲染留言列表
function renderMessages() {
  const container = document.getElementById('messageList');
  const messages = getMessages();

  if (messages.length === 0) {
    container.innerHTML = '<p>暂无留言，快来写第一条吧 ✍️</p>';
    return;
  }

  container.innerHTML = messages.map(msg => {
    const lockIcon = msg.hasKey ? '🔒' : '🌐';
    return `
      <div class="card" style="margin-bottom:1rem;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <strong>${escapeHtml(msg.nickname)}</strong>
          <small>${msg.timestamp} ${lockIcon}</small>
        </div>
        <div style="margin:0.8rem 0; background:#f0ede5; padding:0.6rem; border-radius:5px; font-family:monospace;">
          ${escapeHtml(msg.encryptedContent)}
        </div>
        ${msg.hasKey ? `
        <div style="display:flex; gap:0.5rem; align-items:center;">
          <input type="text" id="key-input-${msg.id}" placeholder="输入密钥解密" style="flex:1;" />
          <button onclick="decryptMessage(${msg.id})">🔓 解密</button>
        </div>
        <div id="decrypted-${msg.id}" style="margin-top:0.5rem; color:#2c3e50;"></div>
        ` : '<div style="color:#666; font-style:italic;">此留言未加密，直接可见</div>'}
      </div>
    `;
  }).join('');
}

// 解密某条留言
function decryptMessage(msgId) {
  const keyInput = document.getElementById(`key-input-${msgId}`);
  const key = keyInput.value.trim();
  const messages = getMessages();
  const msg = messages.find(m => m.id === msgId);
  if (!msg) return;

  const decrypted = decrypt(msg.encryptedContent, key);
  document.getElementById(`decrypted-${msgId}`).innerText = decrypted;
}

// 简单转义防 XSS
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// 页面加载时渲染留言
document.addEventListener('DOMContentLoaded', renderMessages);
