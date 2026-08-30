/* ----------------------------------------------------------
   search.js  v2  客户端搜索（站内全部内容）
   数据来源：window.SEARCH_INDEX（js/search-data.js）
   监听所有 .search-host 内的 input，其下挂 .search-results 下拉
   ------------------------------------------------------------ */
(function () {
  if (typeof window.SEARCH_INDEX === 'undefined') return;

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => (
      { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]
    ));
  }

  function highlight(text, q) {
    if (!q) return escapeHtml(text);
    const safe = escapeHtml(text);
    const safeQ = escapeHtml(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return safe.replace(new RegExp('(' + safeQ + ')', 'gi'), '<mark>$1</mark>');
  }

  function score(item, q) {
    const t = item.title.toLowerCase();
    const c = item.content.toLowerCase();
    q = q.toLowerCase();
    let s = 0;
    if (t.includes(q)) s += 30;
    if (t.startsWith(q)) s += 20;
    if (c.includes(q)) s += 10;
    const occurrences = (c.match(new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    s += Math.min(occurrences, 5);
    return s;
  }

  /* === Header / Hero 下拉搜索（任何 [data-search-host] 内的 input + .search-results） === */
  document.querySelectorAll('[data-search-host]').forEach(host => {
    const input = host.querySelector('input[type="search"]');
    const dropdown = host.querySelector('.search-results');
    if (!input || !dropdown) return;

    let timer = null;

    function render(query) {
      if (!query || query.length < 1) {
        dropdown.hidden = true;
        dropdown.innerHTML = '';
        return;
      }
      const results = window.SEARCH_INDEX
        .map(item => ({ item, s: score(item, query) }))
        .filter(x => x.s > 0)
        .sort((a, b) => b.s - a.s)
        .slice(0, 8);

      if (results.length === 0) {
        dropdown.hidden = false;
        dropdown.innerHTML =
          '<div class="sr-empty">没有找到匹配 <strong>' + escapeHtml(query) + '</strong> 的内容，试试其它关键词</div>';
        return;
      }
      dropdown.hidden = false;
      dropdown.innerHTML = results.map(({ item }) => {
        const url = item.url;
        const dot = url.indexOf('#');
        const page = dot >= 0 ? url.slice(0, dot) : url;
        return (
          '<a class="sr-item" href="' + escapeHtml(url) + '">' +
            '<span class="sr-title">' + highlight(item.title, query) + '</span>' +
            '<span class="sr-snip">' + highlight(item.content.slice(0, 100), query) + '</span>' +
            '<span class="sr-page">' + escapeHtml(page) + '</span>' +
          '</a>'
        );
      }).join('') +
      '<a class="sr-more" href="search.html?q=' + encodeURIComponent(query) + '">查看全部搜索结果 &rsaquo;</a>';
    }

    input.addEventListener('input', () => {
      clearTimeout(timer);
      const v = input.value.trim();
      timer = setTimeout(() => render(v), 80);
    });
    input.addEventListener('focus', () => {
      if (input.value.trim()) render(input.value.trim());
    });
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const q = input.value.trim();
        if (q) window.location.href = 'search.html?q=' + encodeURIComponent(q);
      } else if (e.key === 'Escape') {
        input.blur();
        dropdown.hidden = true;
      }
    });
  });

  // 点击外部收起所有下拉
  document.addEventListener('click', e => {
    if (!e.target.closest('[data-search-host]')) {
      document.querySelectorAll('.search-results').forEach(d => d.hidden = true);
    }
  });

  /* === search.html 全屏搜索 === */
  const fullRoot = document.getElementById('search-full-results');
  if (fullRoot) {
    const params = new URLSearchParams(location.search);
    const initialQ = params.get('q') || '';
    const inputFull = document.getElementById('search-input');

    function fullRender(q) {
      if (!q) {
        fullRoot.innerHTML =
          '<div class="search-tip">' +
            '<h3>📚 在本站搜索</h3>' +
            '<p>输入关键词（如 5G、TCP、卷积、MIMO、PID、Linux 等）即可在 7 门课程的所有章节中查找。</p>' +
            '<p>当前站内已索引 <strong>' + window.SEARCH_INDEX.length + '</strong> 条内容。</p>' +
          '</div>';
        return;
      }
      const list = window.SEARCH_INDEX
        .map(item => {
          const t = item.title.toLowerCase();
          const c = item.content.toLowerCase();
          let s = 0;
          if (t.includes(q.toLowerCase())) s += 30;
          if (c.includes(q.toLowerCase())) s += 10;
          const occ = (c.match(new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length;
          s += Math.min(occ, 5);
          return { item, s };
        })
        .filter(x => x.s > 0)
        .sort((a, b) => b.s - a.s);

      if (list.length === 0) {
        fullRoot.innerHTML =
          '<div class="search-tip">' +
            '<h3>😅 没有找到匹配的内容</h3>' +
            '<p>关键词：<strong>' + escapeHtml(q) + '</strong></p>' +
            '<p>试试 5G、TCP、信号调制、卷积、MIMO、PID、Linux、STM32 等术语。</p>' +
          '</div>';
        return;
      }

      const groups = new Map();
      list.forEach(({ item }) => {
        const dot = item.url.indexOf('#');
        const page = dot >= 0 ? item.url.slice(0, dot) : item.url;
        if (!groups.has(page)) groups.set(page, []);
        groups.get(page).push(item);
      });

      const pageNames = {
        'comm-principle.html':'通信原理',
        'os-linux.html':'操作系统与 Linux',
        'signal-system.html':'信号与系统',
        'c-programming.html':'C 语言',
        'mcu.html':'单片机原理',
        'data-network.html':'数据通信与网络',
        'mobile-comm.html':'移动通信',
        'ee-info.html':'电子信息工程',
        'info-eng.html':'信息工程',
        'oe-info.html':'光电信息',
        'index.html':'通信工程主页',
      };

      let html = '<div class="search-count">找到 <strong>' + list.length +
                 '</strong> 条与 <em>' + escapeHtml(q) + '</em> 相关的结果</div>';
      for (const [page, items] of groups) {
        html += '<div class="search-group">';
        html += '<div class="search-group-title">📄 <strong>' +
                (pageNames[page] || page) + '</strong> <span class="sg-url">' +
                escapeHtml(page) + '</span></div>';
        items.forEach(it => {
          const heading = it.title.replace(/【.*?】/g, '').trim();
          html += '<a class="search-result" href="' + escapeHtml(it.url) + '">';
          html += '<div class="sr-h">' + highlight(heading, q) + '</div>';
          html += '<div class="sr-c">' + highlight(it.content.replace(/【.*?】/g,'').slice(0, 200), q) + '</div>';
          html += '<div class="sr-p">🔗 ' + escapeHtml(it.url) + '</div>';
          html += '</a>';
        });
        html += '</div>';
      }
      fullRoot.innerHTML = html;
    }

    if (inputFull) {
      inputFull.addEventListener('input', () => {
        const q = inputFull.value.trim();
        const url = new URL(location.href);
        if (q) url.searchParams.set('q', q); else url.searchParams.delete('q');
        history.replaceState(null, '', url);
        fullRender(q);
      });
      if (initialQ) {
        inputFull.value = initialQ;
        fullRender(initialQ);
      } else {
        fullRender('');
      }
      inputFull.focus();
    }
  }
})();
