import { useState } from 'react';

/**
 * Bookmarklet — 1-click auto-import từ tab Shopee.
 * User kéo nút "📌 Lion Import" vào bookmark bar, mở Shopee product → click bookmark
 * → tab admin mới mở với form đã auto-fill toàn bộ title/giá/ảnh/rating/discount.
 *
 * Cách hoạt động:
 *  1. Bookmarklet chạy trong context shopee.vn → đọc DOM (có JS đã render giá).
 *  2. Build URL admin với data encoded base64.
 *  3. window.open() tab mới → admin ImportPanel đọc `?prefill=...` → setDraft.
 *
 * Không cần JWT trong code (auth ở phía admin), không cần CORS (chỉ open tab).
 */

const ADMIN_BASE =
  typeof window !== 'undefined' ? window.location.origin : 'https://lion-affiliate.vercel.app';

// Bookmarklet source — sẽ minify thành 1 dòng javascript: link.
// Đọc Shopee DOM:
//  - Title: og:title hoặc <title>
//  - Price (current): div text "<số>đ" hoặc "<số>đ - <số>đ", font-size lớn nhất, không strikethrough
//  - Old price: cùng pattern + strikethrough
//  - Discount: text "-X%"
//  - Images: <img src> chứa "susercontent.com/file/" (bỏ promo-dim)
//  - Rating: regex "4.X trên 5" hoặc số nổi giữa pattern
function buildBookmarkletSource(adminBase) {
  return `
javascript:(function(){
  if(!/shopee\\./.test(location.host)){alert('Chỉ dùng trên tab Shopee. Mở 1 sản phẩm Shopee rồi click lại.');return;}
  var ogT=document.querySelector('meta[property="og:title"]');
  var title=(ogT&&ogT.content)||(document.title||'').split('|')[0].trim();
  var prices=[],olds=[],disc=null;
  var nodes=document.querySelectorAll('div,span');
  for(var i=0;i<nodes.length;i++){
    var el=nodes[i];if(el.children.length)continue;
    var t=(el.innerText||'').trim();if(!t)continue;
    var c=t.replace(/\\s+/g,' ');
    if(/^-?\\d{1,3}\\s*%$/.test(c.replace(/\\s/g,''))){var m=c.match(/\\d+/);if(m)disc=parseInt(m[0],10);continue;}
    if(/^\\d{1,3}([.,]\\d{3})+\\s*đ(\\s*-\\s*\\d{1,3}([.,]\\d{3})+\\s*đ)?$/.test(c.replace(/\\s+/g,''))){
      var nums=(c.match(/\\d{1,3}([.,]\\d{3})+/g)||[]).map(function(n){return parseInt(n.replace(/[.,]/g,''),10);});
      var s=getComputedStyle(el);var sz=parseFloat(s.fontSize)||0;
      var strike=(s.textDecorationLine||s.textDecoration||'').indexOf('line-through')>=0;
      (strike?olds:prices).push({nums:nums,size:sz});
    }
  }
  prices.sort(function(a,b){return b.size-a.size;});
  olds.sort(function(a,b){return b.size-a.size;});
  var p=prices[0]&&prices[0].nums||[];
  var o=olds[0]&&olds[0].nums||[];
  // Images: bỏ promo-dim, dedupe
  var imgs={};
  document.querySelectorAll('img').forEach(function(el){
    var src=el.currentSrc||el.src||'';
    if(/susercontent\\.com\\/file\\//.test(src)&&!/promo-dim/.test(src)){
      imgs[src.split('?')[0]]=1;
    }
  });
  var images=Object.keys(imgs).slice(0,12);
  // Rating
  var bodyT=document.body.innerText||'';
  var rm=bodyT.match(/\\b([0-5]\\.\\d)\\b/);
  var rating=rm?parseFloat(rm[1]):null;
  // Sold text
  var sm=bodyT.match(/Đã Bán\\s*([\\w.,]+)/i);
  var soldText=sm?sm[1]:null;
  // Affiliate URL — prompt user
  var affiliateUrl=prompt('Dán Affiliate URL (link mua có mã của bạn). Để trống = dùng link Shopee gốc:','');
  var data={
    sourceUrl:location.href,
    affiliateUrl:affiliateUrl||location.href,
    title:title,
    images:images,
    priceMin:p[0]||null,priceMax:p[1]||null,
    oldPriceMin:o[0]||null,oldPriceMax:o[1]||null,
    discountPercent:disc,
    rating:rating,
    soldText:soldText
  };
  try{
    var json=JSON.stringify(data);
    var b64=btoa(unescape(encodeURIComponent(json)));
    window.open('${adminBase}/admin/import-san-pham?prefill='+b64,'_blank');
  }catch(e){alert('Lỗi: '+e.message);}
})();
`.trim().replace(/\s*\n\s*/g, ' ').replace(/\s{2,}/g, ' ');
}

export default function BookmarkletGenerator() {
  const [copied, setCopied] = useState(false);
  const code = buildBookmarkletSource(ADMIN_BASE);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      alert('Copy thất bại: ' + e.message);
    }
  };

  const userscriptUrl = `${ADMIN_BASE}/lion-import.user.js`;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold sm:text-3xl">📌 Auto-import từ Shopee</h1>
        <p className="mt-1 text-sm text-brand-ink-500">
          Bypass Shopee anti-bot bằng cách chạy script trong tab Shopee thật của bạn (có session
          + cookies). 2 cách: <strong>Tampermonkey (recommend)</strong> hoặc Bookmarklet.
        </p>
      </div>

      {/* ============ TAMPERMONKEY (recommend) ============ */}
      <div className="rounded-3xl bg-gradient-to-br from-green-50 to-emerald-50 p-5 shadow-card ring-1 ring-green-200">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-green-500 px-2.5 py-1 text-[11px] font-bold text-white">
            RECOMMEND
          </div>
          <div>
            <h2 className="text-lg font-extrabold">⚡ Cách 1 — Tampermonkey userscript (reliable)</h2>
            <p className="mt-1 text-sm text-brand-ink-700">
              Bookmarklet hay bị Shopee chặn CSP → không hoạt động. Tampermonkey là extension
              chính thức Chrome — Shopee KHÔNG thể chặn. Sau khi cài, nút <strong>"📌 Lion Import"</strong> sẽ
              hiện ngay trên trang Shopee, click 1 cái là xong.
            </p>
          </div>
        </div>

        <ol className="ml-5 mt-4 list-decimal space-y-2 text-sm text-brand-ink-800">
          <li>
            Cài <strong>Tampermonkey</strong> extension miễn phí:{' '}
            <a
              href="https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-green-700 underline hover:text-green-900"
            >
              Chrome Web Store →
            </a>
          </li>
          <li>
            Click vào link install script bên dưới — Tampermonkey tự nhận diện + hỏi "Install":
            <div className="mt-2">
              <a
                href={userscriptUrl}
                className="inline-flex items-center gap-2 rounded-full bg-green-600 px-5 py-2.5 text-sm font-bold text-white shadow-cta hover:bg-green-700"
              >
                📥 Install Lion Import Userscript
              </a>
              <p className="mt-1 text-[11px] text-brand-ink-500">
                URL: <code className="rounded bg-white px-1.5 py-0.5 text-[10px]">{userscriptUrl}</code>
              </p>
            </div>
          </li>
          <li>Bấm <strong>Install</strong> trong popup Tampermonkey.</li>
          <li>
            Vào Shopee với link sản phẩm bất kỳ → đợi giá load (~2s) → <strong>nút "📌 Lion Import" hiện ở góc phải dưới màn hình</strong>.
          </li>
          <li>
            Click nút đó → popup preview data → dán Affiliate URL → OK → tab admin mới mở với
            <strong> form auto-fill 100% (kể cả giá!)</strong>.
          </li>
          <li>Review → bấm Save → xong.</li>
        </ol>

        <div className="mt-4 rounded-2xl bg-white p-3 text-xs text-brand-ink-700 ring-1 ring-green-200">
          <strong>✅ Tại sao Tampermonkey work mà bookmarklet không:</strong> Bookmarklet dùng
          <code className="mx-1 rounded bg-brand-ink-100 px-1.5">javascript:</code> URL, Shopee
          có CSP <code className="mx-1 rounded bg-brand-ink-100 px-1.5">script-src 'self'</code>
          → chặn. Tampermonkey chạy như extension → quyền cao hơn, bypass mọi CSP.
        </div>
      </div>

      {/* ============ BOOKMARKLET (fallback) ============ */}
      <details className="rounded-3xl bg-white p-5 shadow-card ring-1 ring-brand-ink-100">
        <summary className="cursor-pointer text-base font-bold">
          📎 Cách 2 — Bookmarklet (fallback, có thể bị Shopee chặn CSP)
        </summary>
        <p className="mt-3 text-sm text-brand-ink-500">
          Chỉ dùng nếu không cài được Tampermonkey. Cảnh báo: hay bị Shopee chặn — click không
          hiện gì cả.
        </p>
      </details>

      <div className="rounded-2xl bg-amber-50 p-3 text-xs text-amber-800 ring-1 ring-amber-200">
        ⚠️ Bookmarklet thường bị Shopee chặn (CSP). Khuyên dùng Tampermonkey ở trên.
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-card ring-1 ring-brand-ink-100">
        <div className="font-bold">1️⃣ Kéo nút này vào thanh Bookmark:</div>
        <div className="mt-3 flex items-center gap-3">
          <a
            href={code}
            onClick={(e) => e.preventDefault()}
            draggable
            className="inline-flex items-center gap-2 rounded-full bg-brand-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-cta hover:bg-brand-orange-600"
          >
            📌 Lion Import
          </a>
          <span className="text-xs text-brand-ink-500">
            ← Bấm giữ + kéo nút này lên thanh Bookmark
          </span>
        </div>
        <p className="mt-2 text-[11px] text-brand-ink-400">
          ⚠️ Trên Chrome/Edge: nếu kéo không hoạt động, bấm chuột phải vào nút →
          "Thêm vào bookmark" → đổi tên thành "Lion Import".
        </p>
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-card ring-1 ring-brand-ink-100">
        <div className="flex items-center justify-between">
          <div className="font-bold">2️⃣ Hoặc copy code (paste manually):</div>
          <button
            onClick={copyCode}
            className="rounded-full bg-brand-ink-900 px-4 py-1.5 text-xs font-bold text-white"
          >
            {copied ? '✓ Đã copy' : '📋 Copy code'}
          </button>
        </div>
        <pre className="mt-3 max-h-48 overflow-y-auto rounded-xl bg-brand-ink-50 p-3 text-[10px] leading-relaxed text-brand-ink-700">
          {code}
        </pre>
        <p className="mt-2 text-[11px] text-brand-ink-400">
          Trên Chrome: vào <code>chrome://bookmarks</code> → Add new → URL = paste code này → đặt tên "Lion Import".
        </p>
      </div>

      <div className="rounded-2xl bg-amber-50 p-3 ring-1 ring-amber-200">
        <div className="text-xs font-bold text-amber-800">💡 Tại sao cần script?</div>
        <p className="mt-1 text-xs text-amber-900">
          Shopee chặn cứng API server-side (item/get, pdp/get_pc → 403) + chặn Puppeteer
          (redirect /verify/traffic/error) + chặn bookmarklet (CSP).
          Chỉ có <strong>browser thật của bạn</strong> lấy được giá vì có session cookies +
          fingerprint thật. <strong>Tampermonkey userscript</strong> chạy trong context đó →
          reliable 100%.
        </p>
      </div>
    </div>
  );
}
