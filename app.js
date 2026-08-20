(function () {
  let SECTIONS = [];
  let tocEl = null;
  const contentEl = document.getElementById('content');

  function slugify(s) {
    return s.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
  }

  function buildTOC() {
    if (!tocEl) return;
    tocEl.innerHTML = '';
    SECTIONS.forEach((sec, i) => {
      const a = document.createElement('a');
      a.href = '#' + sec.id;
      a.className = 'toc-item';
      a.dataset.target = sec.id;
      a.innerHTML = `<span class="toc-num">${String(i + 1).padStart(2, '0')}</span><span>${sec.title}</span>`;
      a.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById(sec.id)?.scrollIntoView({ behavior: 'smooth' });
        history.replaceState(null, '', '#' + sec.id);
        document.querySelector('.sidebar')?.classList.remove('open');
      });
      tocEl.appendChild(a);
    });
  }

  function processCTAs(section) {
    const paras = section.querySelectorAll('p');
    for (const p of paras) {
      const text = p.textContent.trim();
      if (!text.startsWith('==') || !text.endsWith('==')) continue;

      const links = p.querySelectorAll('a');
      if (!links.length) continue;

      const cta = document.createElement('div');
      cta.className = 'section-cta';

      links.forEach((a) => {
        const btn = document.createElement('a');
        btn.href = a.getAttribute('href') || '#';
        btn.target = a.target || '_blank';
        btn.rel = a.rel || 'noopener noreferrer';
        btn.className = 'btn-primary';
        btn.textContent = a.textContent;
        cta.appendChild(btn);
      });

      p.replaceWith(cta);
      break;
    }
  }

  function wrapH3IntoCards(section) {
    const h3s = [];
    for (const child of section.children) {
      if (child.tagName === 'H3') h3s.push(child);
    }
    if (!h3s.length) return;

    const cards = h3s.map((h3, idx) => {
      const nodes = [];
      let node = h3.nextSibling;
      let hitEndMarker = false;
      while (node) {
        if (node.nodeType === 1 && node.tagName === 'H3') break;
        if (node.nodeType === 1 && node.classList &&
            (node.classList.contains('timeline-list-wrap') || node.classList.contains('links-grid-wrap'))) break;
        if (node.nodeType === 1 && node.tagName === 'P') {
          const t = node.textContent.trim();
          if (t === '!###') {
            hitEndMarker = true;
            node = node.nextSibling;
            break;
          }
        }
        if (hitEndMarker) break;
        nodes.push(node);
        node = node.nextSibling;
      }

      let descEl = null;
      const contentNodes = [];
      let foundFirstEl = false;
      for (const n of nodes) {
        if (!foundFirstEl && n.nodeType === 3 && !n.textContent.trim()) continue;
        if (!foundFirstEl && n.nodeType === 1) {
          foundFirstEl = true;
          if (n.tagName === 'BLOCKQUOTE') {
            descEl = n;
            continue;
          }
        }
        contentNodes.push(n);
      }

      return { h3, idx, descEl, contentNodes };
    });

    const firstH3 = h3s[0];
    const beforeFirst = firstH3.previousSibling;

    const grid = document.createElement('div');
    grid.className = 'cards-grid';

    cards.forEach(({ h3, idx, descEl, contentNodes }) => {
      const card = document.createElement('div');
      card.className = 'feature-card';

      const icon = document.createElement('div');
      icon.className = 'feature-card-icon';
      const text = h3.textContent;
      const m = text.match(/\s*\[([^\]]+)\]\s*$/);
      if (m) {
        icon.textContent = m[1];
        h3.textContent = text.replace(/\s*\[([^\]]+)\]\s*$/, '');
      } else {
        icon.textContent = String(idx + 1).padStart(2, '0');
      }
      card.appendChild(icon);
      card.appendChild(h3);

      if (descEl) {
        const desc = document.createElement('p');
        desc.className = 'card-desc';
        const innerP = descEl.querySelector('p');
        desc.innerHTML = innerP ? innerP.innerHTML : descEl.innerHTML;
        descEl.remove();
        card.appendChild(desc);
      }

      contentNodes.forEach((n) => {
        if (n.nodeType === 1 && n.tagName === 'P') {
          const t = n.textContent.trim();
          if (t.startsWith('==') && t.endsWith('==')) {
            const links = n.querySelectorAll('a');
            if (links.length) {
              const cta = document.createElement('div');
              cta.className = 'card-cta';
              links.forEach((a) => {
                const btn = document.createElement('a');
                btn.href = a.getAttribute('href') || '#';
                btn.target = a.target || '_blank';
                btn.rel = a.rel || 'noopener noreferrer';
                btn.className = 'btn-primary';
                btn.textContent = a.textContent;
                cta.appendChild(btn);
              });
              card.appendChild(cta);
            }
            n.remove();
            return;
          }
        }
        if (n.nodeType === 1 && n.tagName === 'UL') {
          const items = n.querySelectorAll(':scope > li');
          let allLinkRows = items.length > 0;
          items.forEach((li) => {
            const link = li.querySelector('a');
            const txt = li.textContent.trim();
            if (!link || !txt.includes('|')) allLinkRows = false;
          });
          if (allLinkRows) {
            const list = document.createElement('div');
            list.className = 'link-row-list';
            items.forEach((li) => {
              const link = li.querySelector('a');
              const parts = li.textContent.trim().split('|').map(s => s.trim());
              const label = parts[1] || 'LINK';
              const row = document.createElement('a');
              row.href = link.getAttribute('href') || '#';
              row.target = link.target || '_blank';
              row.rel = link.rel || 'noopener noreferrer';
              row.className = 'link-row';
              const left = document.createElement('span');
              left.className = 'link-row-left';
              left.textContent = link.textContent;
              row.appendChild(left);
              const right = document.createElement('span');
              right.className = 'link-row-right';
              right.textContent = label;
              row.appendChild(right);
              list.appendChild(row);
            });
            card.appendChild(list);
            return;
          }
        }
        card.appendChild(n);
      });
      grid.appendChild(card);
    });

    if (beforeFirst && beforeFirst.parentNode === section) {
      section.insertBefore(grid, beforeFirst.nextSibling);
    } else {
      section.insertBefore(grid, section.firstChild);
    }
  }

  function processTimelineLists(section) {
    const blocks = [];
    const tmp = document.createElement('div');
    tmp.innerHTML = section.innerHTML;

    const ps = tmp.querySelectorAll('p');
    ps.forEach((p) => {
      const t = p.textContent.trim();
      if (!/^!!!TIMELINE\s*:/.test(t)) return;

      const titleRaw = t.replace(/^!!!TIMELINE\s*:\s*/, '').replace(/\s*!!!$/, '');
      const badge = (titleRaw.match(/\[([^\]]+)\]\s*$/) || [])[1] || '';
      const title = titleRaw.replace(/\s*\[([^\]]+)\]\s*$/, '').trim();

      let ul = p.nextElementSibling;
      while (ul && ul.tagName !== 'UL') {
        if (ul.tagName === 'H2' || ul.tagName === 'H3') { ul = null; break; }
        ul = ul.nextElementSibling;
      }

      const items = [];
      if (ul) {
        ul.querySelectorAll(':scope > li').forEach((li) => {
          const parts = li.textContent.split('|').map((s) => s.trim());
          items.push({ date: parts[0] || '', content: parts[1] || '', tag: parts[2] || '', link: parts[3] || '' });
        });
      }

      blocks.push({ title, badge, items });
    });

    blocks.forEach(({ title, badge, items }) => {
      const wrap = document.createElement('div');
      wrap.className = 'timeline-list-wrap';

      const header = document.createElement('div');
      header.className = 'timeline-list-header';
      const titleEl = document.createElement('div');
      titleEl.className = 'timeline-list-title';
      if (badge) {
        const b = document.createElement('span');
        b.className = 'tl-badge';
        b.textContent = badge;
        titleEl.appendChild(b);
      }
      const ts = document.createElement('span');
      ts.textContent = title;
      titleEl.appendChild(ts);
      header.appendChild(titleEl);

      const meta = document.createElement('div');
      meta.className = 'timeline-list-meta';
      meta.textContent = 'Timeline · ' + items.length + ' Events';
      header.appendChild(meta);

      wrap.appendChild(header);

      const list = document.createElement('div');
      list.className = 'timeline-list';

      items.forEach(({ date, content, tag, link }) => {
        const item = document.createElement('div');
        item.className = 'timeline-item';

        const dateEl = document.createElement('div');
        dateEl.className = 'tl-date';
        dateEl.textContent = date;
        item.appendChild(dateEl);

        const contentEl = document.createElement('div');
        contentEl.className = 'tl-content';
        contentEl.textContent = content;
        item.appendChild(contentEl);

        if (tag) {
          const tagEl = document.createElement('div');
          tagEl.className = 'tl-tag';
          tagEl.textContent = tag;
          item.appendChild(tagEl);
        }

        if (link) {
          const linkEl = document.createElement('a');
          linkEl.href = link;
          linkEl.className = 'tl-link';
          linkEl.target = '_blank';
          linkEl.rel = 'noopener noreferrer';
          linkEl.textContent = 'View on X';
          item.appendChild(linkEl);
        }

        list.appendChild(item);
      });

      wrap.appendChild(list);
      section.appendChild(wrap);
    });

    section.querySelectorAll('p').forEach((p) => {
      if (/^!!!TIMELINE\s*:/.test(p.textContent.trim())) {
        const ul = p.nextElementSibling;
        if (ul && ul.tagName === 'UL') ul.remove();
        p.remove();
      }
    });
  }
  function processLinkCards(section) {
    const allPs = section.querySelectorAll('p');
    const linkBlocks = [];

    allPs.forEach((el) => {
      const t = el.textContent.trim();
      if (t !== '!!!LINKS!!!') return;

      let ul = el.nextElementSibling;
      while (ul && ul.tagName !== 'UL') {
        if (ul.tagName === 'H2' || ul.tagName === 'H3') { ul = null; break; }
        ul = ul.nextElementSibling;
      }
      if (!ul || ul.tagName !== 'UL') return;

      const items = ul.querySelectorAll(':scope > li');
      if (!items.length) return;

      const grid = document.createElement('div');
      grid.className = 'links-grid-wrap';
      const inner = document.createElement('div');
      inner.className = 'links-grid';

      items.forEach((li) => {
        const link = li.querySelector('a');
        if (!link) return;
        const txt = li.textContent.trim();
        const parts = txt.split('|').map(s => s.trim());
        const label = parts[1] || 'View';

        const card = document.createElement('a');
        card.href = link.getAttribute('href') || '#';
        card.target = link.target || '_blank';
        card.rel = link.rel || 'noopener noreferrer';
        card.className = 'link-card';

        const left = document.createElement('span');
        left.className = 'link-card-left';
        left.textContent = link.textContent;
        card.appendChild(left);

        const right = document.createElement('span');
        right.className = 'link-card-right';
        right.textContent = label;
        card.appendChild(right);

        inner.appendChild(card);
      });

      grid.appendChild(inner);
      linkBlocks.push({ el, ul, grid });
    });

    linkBlocks.forEach(({ el, ul, grid }) => {
      el.remove();
      ul.remove();
      section.appendChild(grid);
    });
  }

  function processHTML(html) {
    const doc = document.createElement('div');
    doc.innerHTML = html;

    const h2s = Array.from(doc.querySelectorAll('h2'));
    SECTIONS = h2s.map((h, i) => ({
      id: slugify(h.textContent) || 'section-' + (i + 1),
      title: h.textContent.trim(),
    }));
    buildTOC();

    const firstH1 = doc.querySelector('h1');
    const heroWrap = document.createElement('section');
    heroWrap.className = 'hero-banner';
    heroWrap.id = 'top';

    const heroBg = document.createElement('div');
    heroBg.className = 'hero-bg';
    heroWrap.appendChild(heroBg);

    const heroInner = document.createElement('div');
    heroInner.className = 'hero-inner';

    if (firstH1) {
      let eyebrow = null;
      let eyebrowRight = null;
      let prev = firstH1.previousSibling;
      while (prev) {
        const p = prev.previousSibling;
        if (prev.nodeType === 1 && prev.tagName === 'BLOCKQUOTE') {
          const innerP = prev.querySelector('p');
          const txt = innerP ? innerP.textContent : prev.textContent;
          const parts = txt.split(' | ');
          eyebrow = parts[0].trim();
          eyebrowRight = parts[1] ? parts[1].trim() : null;
          prev.remove();
          break;
        }
        if (prev.nodeType === 1 && prev.tagName === 'P' && prev.textContent.trim()) break;
        prev = p;
      }

      const h1 = firstH1.cloneNode(true);
      const origNextAfterH1 = firstH1.nextSibling;
      firstH1.remove();

      const desc = document.createElement('p');
      desc.className = 'hero-desc';
      let next = origNextAfterH1;
      while (next) {
        if (next.nodeType === 1 && next.tagName === 'H2') break;
        if (next.nodeType === 1 && next.tagName === 'P' && desc.textContent.length < 300) {
          if (desc.textContent) desc.innerHTML += ' ';
          desc.innerHTML += next.innerHTML;
          const after = next.nextSibling;
          next.remove();
          next = after;
          continue;
        }
        break;
      }

      let cta = null;
      let metaRow = null;
      next = origNextAfterH1;
      while (next) {
        if (next.nodeType === 1 && next.tagName === 'H2') break;
        const cur = next;
        next = cur.nextSibling;

        if (cur.nodeType === 1 && cur.tagName === 'P') {
          const t = cur.textContent.trim();
          if (t.startsWith('==') && t.endsWith('==')) {
            const links = cur.querySelectorAll('a');
            if (links.length) {
              cta = document.createElement('div');
              cta.className = 'hero-cta';
              links.forEach((a, idx) => {
                const btn = document.createElement('a');
                btn.href = a.getAttribute('href') || '#';
                btn.target = a.target || '_self';
                btn.rel = a.rel || '';
                btn.className = idx === 0 ? 'btn-hero-primary' : 'btn-hero-secondary';
                btn.textContent = a.textContent.toUpperCase();
                cta.appendChild(btn);
              });
            }
            cur.remove();
          } else if (t && !metaRow && !cta) {
            if (desc.textContent) desc.innerHTML += ' ';
            desc.innerHTML += cur.innerHTML;
            cur.remove();
          }
        }
        if (cur.nodeType === 1 && cur.tagName === 'UL' && !metaRow) {
          const items = cur.querySelectorAll(':scope > li');
          if (items.length) {
            metaRow = document.createElement('div');
            metaRow.className = 'hero-meta-row';
            items.forEach((li) => {
              const txt = li.textContent.trim();
              const colon = txt.indexOf(':');
              let label = '', value = '';
              if (colon > 0) {
                label = txt.slice(0, colon).trim();
                value = txt.slice(colon + 1).trim();
              } else {
                value = txt;
              }
              const item = document.createElement('div');
              item.className = 'hero-meta-item';
              if (label) {
                const l = document.createElement('span');
                l.className = 'hero-meta-label';
                l.textContent = label;
                item.appendChild(l);
              }
              const v = document.createElement('span');
              v.className = 'hero-meta-value';
              v.textContent = value;
              item.appendChild(v);
              metaRow.appendChild(item);
            });
          }
          cur.remove();
        }
      }

      if (eyebrow) {
        const bar = document.createElement('div');
        bar.className = 'hero-eyebrow';
        const left = document.createElement('span');
        left.className = 'hero-eyebrow-left';
        left.innerHTML = `<span class="dot"></span>${eyebrow.toUpperCase()}`;
        bar.appendChild(left);
        if (eyebrowRight) {
          const right = document.createElement('span');
          right.className = 'hero-eyebrow-right';
          right.textContent = eyebrowRight.toUpperCase();
          bar.appendChild(right);
        }
        heroInner.appendChild(bar);
      }

      h1.className = 'hero-title';
      heroInner.appendChild(h1);

      if (desc.textContent.trim()) heroInner.appendChild(desc);

      if (metaRow) heroInner.appendChild(metaRow);

      if (cta) heroInner.appendChild(cta);

      heroWrap.appendChild(heroInner);
    }

    doc.insertBefore(heroWrap, doc.firstChild);

    const pageBody = document.createElement('div');
    pageBody.className = 'page-body';

    const sidebar = document.createElement('aside');
    sidebar.className = 'sidebar';
    sidebar.innerHTML = `
      <div class="sidebar-inner">
        <div class="brand">
          <img src="/logo-orange.png" class="brand-mark" alt="" />
        </div>
        <nav class="toc" id="toc"></nav>
        <div class="sidebar-footer">
          <span class="dot"></span>
          <span>Make data useful onchain</span>
        </div>
      </div>
    `;
    pageBody.appendChild(sidebar);

    const contentMain = document.createElement('div');
    contentMain.className = 'content-main';

    let node = heroWrap.nextSibling;
    while (node) {
      const next = node.nextSibling;
      contentMain.appendChild(node);
      node = next;
    }
    pageBody.appendChild(contentMain);

    heroWrap.parentNode.insertBefore(pageBody, heroWrap.nextSibling);

    tocEl = sidebar.querySelector('#toc');
    if (tocEl) buildTOC();

    h2s.forEach((target, i) => {
      const sec = SECTIONS[i];

      target.id = sec.id;
      target.textContent = target.textContent.toUpperCase();

      const num = document.createElement('span');
      num.className = 'section-num';
      num.textContent = String(i + 1).padStart(2, '0');
      target.insertBefore(num, target.firstChild);

      const section = document.createElement('section');
      section.id = sec.id + '-section';

      let node = target.nextSibling;
      const sectionNodes = [];
      while (node) {
        if (node.nodeType === 1 && node.tagName === 'H2') break;
        const next = node.nextSibling;
        sectionNodes.push(node);
        node = next;
      }

      const parent = target.parentNode;
      parent.insertBefore(section, target);
      section.appendChild(target);
      sectionNodes.forEach((n) => section.appendChild(n));

      const lead = section.querySelector('p');
      if (lead) {
        lead.classList.add('section-lead');
      }

      processTimelineLists(section);
      processLinkCards(section);

      wrapH3IntoCards(section);

      processCTAs(section);
    });

    const grids = doc.querySelectorAll('.grid');
    grids.forEach((g) => {
      const items = g.querySelectorAll(':scope > ul > li');
      if (items.length) {
        const cardGrid = document.createElement('div');
        cardGrid.className = 'grid';
        items.forEach((li) => {
          const card = document.createElement('div');
          card.className = 'card';
          const strong = li.querySelector('strong');
          if (strong) {
            const h4 = document.createElement('h4');
            h4.textContent = strong.textContent;
            strong.remove();
            card.appendChild(h4);
          }
          const p = document.createElement('p');
          p.innerHTML = li.innerHTML;
          card.appendChild(p);
          cardGrid.appendChild(card);
        });
        g.replaceWith(cardGrid);
      }
    });

    const timelines = doc.querySelectorAll('.timeline');
    timelines.forEach((t) => {
      const items = t.querySelectorAll(':scope > ul > li');
      if (items.length) {
        const tl = document.createElement('div');
        tl.className = 'timeline';
        items.forEach((li) => {
          const item = document.createElement('div');
          item.className = 'timeline-item';
          const strong = li.querySelector('strong');
          if (strong) {
            const h4 = document.createElement('h4');
            h4.textContent = strong.textContent;
            strong.remove();
            item.appendChild(h4);
          }
          const p = document.createElement('p');
          p.innerHTML = li.innerHTML;
          item.appendChild(p);
          tl.appendChild(item);
        });
        t.replaceWith(tl);
      }
    });

    const statRows = doc.querySelectorAll('.stat-row');
    statRows.forEach((r) => {
      const items = r.querySelectorAll(':scope > ul > li');
      if (items.length) {
        const row = document.createElement('div');
        row.className = 'stat-row';
        items.forEach((li) => {
          const stat = document.createElement('div');
          stat.className = 'stat';
          const strong = li.querySelector('strong');
          if (strong) {
            const num = document.createElement('div');
            num.className = 'stat-num';
            num.textContent = strong.textContent;
            strong.remove();
            stat.appendChild(num);
          }
          const label = document.createElement('div');
          label.className = 'stat-label';
          label.innerHTML = li.innerHTML;
          stat.appendChild(label);
          row.appendChild(stat);
        });
        r.replaceWith(row);
      }
    });

    return doc.innerHTML;
  }

  function setupScrollSpy() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id.replace('-section', '');
            document.querySelectorAll('.toc-item').forEach((item) => {
              item.classList.toggle('active', item.dataset.target === id);
            });
          }
        });
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 }
    );

    SECTIONS.forEach((sec) => {
      const el = document.getElementById(sec.id + '-section');
      if (el) observer.observe(el);
    });
  }

  function setupMobileToggle() {
    const btn = document.createElement('button');
    btn.className = 'mobile-nav-toggle';
    btn.innerHTML = '☰';
    btn.setAttribute('aria-label', 'Toggle navigation');
    document.body.appendChild(btn);

    btn.addEventListener('click', () => {
      document.querySelector('.sidebar').classList.toggle('open');
    });

    contentEl.addEventListener('click', () => {
      document.querySelector('.sidebar').classList.remove('open');
    });
  }

  async function loadContent() {
    try {
      const res = await fetch('content.md');
      if (!res.ok) throw new Error('Failed to load content.md');
      const md = await res.text();

      if (window.marked) {
        marked.setOptions({ breaks: false, gfm: true });
      }
      const html = marked.parse(md);
      const processed = processHTML(html);

      contentEl.innerHTML = `<div class="md">${processed}</div>`;
      document.title = 'Primus Brief';

      setupScrollSpy();
      setupMobileToggle();

      if (window.location.hash) {
        const target = document.getElementById(window.location.hash.slice(1));
        if (target) setTimeout(() => target.scrollIntoView(), 50);
      }
    } catch (err) {
      contentEl.innerHTML = `<div class="loader" style="color:var(--orange-dark)">Error: ${err.message}<br><br>Make sure you're serving this page over HTTP (not <code>file://</code>).<br>Try: <code>python3 -m http.server 8000</code></div>`;
    }
  }

  loadContent();
})();
