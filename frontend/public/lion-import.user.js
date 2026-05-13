// ==UserScript==
// @name         Lion Affiliate Import
// @namespace    https://lion-affiliate.vercel.app/
// @version      1.0.0
// @description  1-click import sản phẩm Shopee về Lion Affiliate admin. Bypass CSP, lấy giá + ảnh + mô tả thật từ DOM.
// @author       Lion Affiliate
// @match        https://shopee.vn/*
// @match        https://shopee.com.my/*
// @match        https://shopee.com.sg/*
// @match        https://shopee.co.id/*
// @match        https://shopee.com.tw/*
// @match        https://shopee.ph/*
// @match        https://shopee.com.br/*
// @grant        none
// @run-at       document-idle
// @updateURL    https://lion-affiliate.vercel.app/lion-import.user.js
// @downloadURL  https://lion-affiliate.vercel.app/lion-import.user.js
// ==/UserScript==

(function() {
  'use strict';

  const ADMIN_BASE = 'https://lion-affiliate.vercel.app';

  // Chỉ chạy trên trang sản phẩm Shopee (/product/X/Y hoặc -i.X.Y)
  function isProductPage() {
    return /\/product\/\d+\/\d+|-i\.\d+\.\d+/i.test(location.pathname);
  }

  function buildButton() {
    if (document.getElementById('lion-import-btn')) return; // tránh duplicate
    const btn = document.createElement('button');
    btn.id = 'lion-import-btn';
    btn.textContent = '📌 Lion Import';
    btn.title = 'Click để import sản phẩm này về Lion Affiliate';
    Object.assign(btn.style, {
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: '999999',
      background: 'linear-gradient(135deg, #f97316, #ef4444)',
      color: 'white',
      padding: '12px 20px',
      borderRadius: '999px',
      border: 'none',
      cursor: 'pointer',
      boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
      fontWeight: '700',
      fontSize: '14px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      transition: 'transform 0.15s, box-shadow 0.15s',
    });
    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'translateY(-2px)';
      btn.style.boxShadow = '0 8px 24px rgba(239,68,68,0.35)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translateY(0)';
      btn.style.boxShadow = '0 4px 14px rgba(0,0,0,0.25)';
    });
    btn.addEventListener('click', handleImport);
    document.body.appendChild(btn);
  }

  function readDomData() {
    // ============ Title ============
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const title = (ogTitle && ogTitle.content) ||
      (document.title || '').split('|')[0].trim();

    // ============ Prices ============
    // Tìm element có text dạng "<số>đ" hoặc "<số>đ - <số>đ"
    // - Strikethrough = giá gốc (oldPrice)
    // - Font lớn nhất + không strikethrough = giá hiện tại (price)
    // - "-X%" = discount
    const prices = [];
    const olds = [];
    let discount = null;

    const nodes = document.querySelectorAll('div, span, h1, h2');
    for (let i = 0; i < nodes.length; i++) {
      const el = nodes[i];
      if (el.children.length > 1) continue;
      const t = (el.innerText || '').trim();
      if (!t) continue;
      const compact = t.replace(/\s+/g, '');

      // Discount "-X%"
      if (/^-?\d{1,3}%$/.test(compact)) {
        const m = compact.match(/\d+/);
        if (m) {
          const v = parseInt(m[0], 10);
          if (v > 0 && v <= 100) discount = v;
        }
        continue;
      }

      // Price patterns
      const priceRegex = /^\d{1,3}([.,]\d{3})+\s*đ(\s*-\s*\d{1,3}([.,]\d{3})+\s*đ)?$/;
      if (priceRegex.test(t.replace(/\s+/g, ' '))) {
        const numMatches = t.match(/\d{1,3}([.,]\d{3})+/g) || [];
        const nums = numMatches.map(n => parseInt(n.replace(/[.,]/g, ''), 10))
          .filter(n => n > 100);
        if (!nums.length) continue;
        const style = window.getComputedStyle(el);
        const fontSize = parseFloat(style.fontSize) || 0;
        const isStrike = (style.textDecorationLine || style.textDecoration || '')
          .indexOf('line-through') >= 0;
        (isStrike ? olds : prices).push({ nums, fontSize });
      }
    }

    // Sort theo font-size (giá chính font lớn nhất)
    prices.sort((a, b) => b.fontSize - a.fontSize);
    olds.sort((a, b) => b.fontSize - a.fontSize);
    const p = (prices[0] && prices[0].nums) || [];
    const o = (olds[0] && olds[0].nums) || [];

    // ============ Images ============
    // Lọc ảnh susercontent.com/file/, bỏ promo-dim banner
    const imgSet = new Set();
    document.querySelectorAll('img').forEach(el => {
      const src = el.currentSrc || el.src || '';
      if (/susercontent\.com\/file\//.test(src) && !/promo-dim|banner|voucher/i.test(src)) {
        imgSet.add(src.split('?')[0]);
      }
    });
    // Cũng tìm trong <source srcset>
    document.querySelectorAll('source[srcset]').forEach(el => {
      const srcset = el.getAttribute('srcset') || '';
      const m = srcset.match(/https:\/\/[^\s,]+susercontent\.com\/file\/[^\s,?]+/);
      if (m && !/promo-dim|banner|voucher/i.test(m[0])) {
        imgSet.add(m[0]);
      }
    });
    const images = Array.from(imgSet).slice(0, 12);

    // ============ Video ============
    let video = null;
    document.querySelectorAll('video').forEach(el => {
      const src = el.src || el.currentSrc;
      if (src && /\.(mp4|webm)/i.test(src) && !video) {
        video = src;
      }
    });
    if (!video) {
      document.querySelectorAll('source[src]').forEach(el => {
        const src = el.src;
        if (src && /\.(mp4|webm)/i.test(src) && !video) {
          video = src;
        }
      });
    }

    // ============ Rating ============
    const bodyText = document.body.innerText || '';
    const rm = bodyText.match(/\b([0-5]\.\d)\s*(?:trên 5|\/5|⭐)?/);
    const rating = rm ? parseFloat(rm[1]) : null;

    // ============ Sold count text ============
    const sm = bodyText.match(/Đã Bán\s*([\w.,+]+)/i);
    const soldText = sm ? sm[1].trim() : null;

    // ============ Description ============
    // Tìm section "MÔ TẢ SẢN PHẨM" → đọc text dưới đó
    let description = '';
    const headings = Array.from(document.querySelectorAll('h2, h3, div, span'))
      .filter(el => {
        const t = (el.innerText || '').trim().toUpperCase();
        return t === 'MÔ TẢ SẢN PHẨM' || t === 'PRODUCT DESCRIPTION';
      });

    if (headings.length > 0) {
      // Lấy parent container của heading
      const heading = headings[0];
      const container = heading.closest('section, div[class]');
      if (container) {
        // Đọc text các phần tử SAU heading trong cùng container hoặc anh em
        const allText = (container.innerText || '').trim();
        // Loại bỏ chính heading
        description = allText
          .replace(/^MÔ TẢ SẢN PHẨM\s*/i, '')
          .replace(/^PRODUCT DESCRIPTION\s*/i, '')
          .slice(0, 4000);
      }
    }

    // Fallback: og:description nếu không tìm được
    if (!description) {
      const ogD = document.querySelector('meta[property="og:description"]');
      if (ogD && ogD.content && !/^Mua\s.*giá tốt/i.test(ogD.content)) {
        description = ogD.content;
      }
    }

    return {
      sourceUrl: location.href,
      title: title,
      images: images,
      video: video,
      priceMin: p[0] || null,
      priceMax: p[1] || null,
      oldPriceMin: o[0] || null,
      oldPriceMax: o[1] || null,
      discountPercent: discount,
      rating: rating,
      soldText: soldText,
      description: description,
    };
  }

  function handleImport() {
    const data = readDomData();

    // Validate
    if (!data.title) {
      alert('❌ Không tìm thấy title sản phẩm trên trang này.\nĐợi trang load xong rồi thử lại.');
      return;
    }

    // Show summary để user confirm
    const summary =
      '📌 LION IMPORT — preview\n\n' +
      'Title: ' + data.title.slice(0, 80) + '\n' +
      'Ảnh: ' + (data.images.length) + ' ảnh\n' +
      'Giá: ' + (data.priceMin ? data.priceMin.toLocaleString('vi-VN') + 'đ' : '?') +
        (data.priceMax ? ' - ' + data.priceMax.toLocaleString('vi-VN') + 'đ' : '') + '\n' +
      'Giá gốc: ' + (data.oldPriceMin ? data.oldPriceMin.toLocaleString('vi-VN') + 'đ' : '?') + '\n' +
      'Discount: ' + (data.discountPercent ? '-' + data.discountPercent + '%' : '?') + '\n' +
      'Rating: ' + (data.rating || '?') + '\n' +
      'Đã bán: ' + (data.soldText || '?') + '\n' +
      'Mô tả: ' + data.description.length + ' ký tự\n\n' +
      '─────────────\n' +
      'Bước tiếp: dán Affiliate URL (link mua của bạn).';

    const affiliateUrl = prompt(summary + '\n\nĐể trống = dùng link Shopee gốc:', '');
    if (affiliateUrl === null) return; // user cancel

    data.affiliateUrl = (affiliateUrl && affiliateUrl.trim()) || data.sourceUrl;

    // Encode + open admin tab
    try {
      const json = JSON.stringify(data);
      const b64 = btoa(unescape(encodeURIComponent(json)));
      window.open(ADMIN_BASE + '/admin/import-san-pham?prefill=' + b64, '_blank');
    } catch (e) {
      alert('❌ Lỗi encode: ' + e.message);
    }
  }

  // ===== Init =====
  if (isProductPage()) {
    buildButton();
    // Re-insert nếu SPA Shopee re-render
    const observer = new MutationObserver(() => {
      if (!document.getElementById('lion-import-btn') && document.body) {
        buildButton();
      }
    });
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: false });
    }
  }
})();
