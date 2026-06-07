// js/auth.js
(async function() {
  const authArea = document.getElementById('authArea');
  if (!authArea) return;

  try {
    const res = await fetch('/api/user-status');
    const data = await res.json();

    if (data.loggedIn) {
      authArea.innerHTML = `
        <span style="color:#F5F0E0;">👤 ${escapeHtml(data.username)}</span>
        <a href="/api/logout">退出</a>
      `;
    } else {
      authArea.innerHTML = `<a href="/pages/login.html">登录 / 注册</a>`;
    }
  } catch (err) {
    // 网络异常时显示登录链接
    authArea.innerHTML = `<a href="/pages/login.html">登录 / 注册</a>`;
  }

  function escapeHtml(text) {
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
})();