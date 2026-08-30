// 通信工程学习站 - 通用交互脚本
// 1. 返回顶部按钮
// 2. 滚动高亮左侧目录当前章节
// 3. 代码块自动添加语言标签
(function() {
  // ---- 返回顶部按钮 ----
  const btn = document.createElement('a');
  btn.href = '#';
  btn.className = 'back-to-top';
  btn.innerHTML = '↑';
  btn.title = '返回顶部';
  document.body.appendChild(btn);

  btn.addEventListener('click', function(e) {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ---- 滚动处理：返回顶部 + 侧栏高亮 ----
  const sidebarLinks = document.querySelectorAll('.sidebar a[href^="#"]');
  const sectionMap = new Map(); // href -> {link, section}

  sidebarLinks.forEach(a => {
    const id = a.getAttribute('href').slice(1);
    const sec = document.getElementById(id);
    if (sec) sectionMap.set(a, sec);
  });

  function onScroll() {
    if (window.scrollY > 400) btn.classList.add('show');
    else btn.classList.remove('show');

    if (sectionMap.size === 0) return;
    // 找到当前最靠近顶部的 section
    let currentLink = null;
    const offset = 90;
    sectionMap.forEach((sec, link) => {
      const rect = sec.getBoundingClientRect();
      if (rect.top - offset <= 0) currentLink = link;
    });
    sidebarLinks.forEach(a => a.classList.remove('active'));
    if (currentLink) currentLink.classList.add('active');
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---- 点击侧栏锚点，平滑滚动并立刻高亮 ----
  sidebarLinks.forEach(a => {
    a.addEventListener('click', function() {
      sidebarLinks.forEach(x => x.classList.remove('active'));
      a.classList.add('active');
    });
  });

  // ---- 高亮顶部导航当前页 ----
  const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.site-nav a').forEach(a => {
    const href = (a.getAttribute('href') || '').split('/').pop().toLowerCase();
    if (href && href === path) a.classList.add('active');
  });

  // ---- 代码块自动加语言标签 ----
  document.querySelectorAll('.code-block').forEach(block => {
    const code = block.querySelector('code, pre');
    if (!code) return;
    const m = (code.className || '').match(/language-(\w+)/);
    if (m) {
      const tag = document.createElement('span');
      tag.className = 'lang';
      tag.textContent = m[1];
      block.appendChild(tag);
    }
  });
})();
