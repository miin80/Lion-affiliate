import { useMemo } from 'react';
import Seo from '../components/Seo';
import { useSiteSettings } from '../hooks/useSiteSettings';

const DEFAULTS = {
  privacy: {
    title: 'Chính sách bảo mật',
    seoTitle: 'Chính sách bảo mật',
    description: 'Cách chúng tôi thu thập, sử dụng và bảo vệ thông tin của bạn.',
    body: `Lion Affiliate (gọi tắt "chúng tôi") tôn trọng quyền riêng tư của người dùng. Tài liệu này mô tả ngắn gọn cách dữ liệu được xử lý trên website.

## Thông tin chúng tôi thu thập
- Cookies / trình theo dõi cơ bản (Google Analytics, Microsoft Clarity, Meta Pixel, TikTok Pixel — chỉ kích hoạt nếu admin cấu hình) để hiểu hành vi người dùng tổng quát.
- Click trên nút "Mua ngay" để đo conversion (ID sản phẩm + timestamp, không có thông tin cá nhân).

## Chúng tôi KHÔNG thu thập
- Tên, email, số điện thoại trừ khi bạn chủ động gửi qua form liên hệ.
- Thông tin thanh toán (toàn bộ giao dịch diễn ra trên Shopee/TikTok Shop/Lazada — chúng tôi chỉ là affiliate, không xử lý đơn hàng).

## Cookies bên thứ ba
- Google Analytics / Microsoft Clarity / Meta Pixel / TikTok Pixel (nếu được kích hoạt) đặt cookies theo chính sách riêng của họ.
- Bạn có thể từ chối qua cài đặt trình duyệt.

## Liên hệ
Nếu bạn có thắc mắc về quyền riêng tư, vui lòng liên hệ qua thông tin tại [trang Liên hệ](/contact).`,
  },
  terms: {
    title: 'Điều khoản sử dụng',
    seoTitle: 'Điều khoản sử dụng',
    description: 'Điều khoản và điều kiện khi sử dụng website.',
    body: `Khi truy cập và sử dụng website này, bạn đồng ý với các điều khoản sau:

## 1. Nội dung
- Toàn bộ nội dung (sản phẩm, review, hình ảnh) chỉ mang tính giới thiệu / tham khảo.
- Chúng tôi cố gắng cập nhật chính xác, tuy nhiên giá / khuyến mãi / mô tả có thể thay đổi từ phía nhà bán hàng (Shopee / TikTok Shop / Lazada / ...).
- Hãy kiểm tra trực tiếp trên trang gốc trước khi mua.

## 2. Liên kết affiliate
- Một số liên kết "Mua ngay" là liên kết tiếp thị. Khi bạn mua hàng qua liên kết này, chúng tôi có thể nhận được hoa hồng.
- Bạn KHÔNG phải trả thêm chi phí nào so với mua trực tiếp trên trang gốc.

## 3. Trách nhiệm
- Chúng tôi không chịu trách nhiệm về chất lượng sản phẩm, giao hàng, hoàn tiền — đây là trách nhiệm của nhà bán hàng / sàn TMĐT.
- Vui lòng đọc kỹ chính sách của sàn TMĐT trước khi mua.

## 4. Bản quyền
- Hình ảnh sản phẩm có thể thuộc bản quyền của nhà sản xuất / nhà bán hàng. Chúng tôi sử dụng để giới thiệu sản phẩm theo thỏa thuận affiliate.
- Vui lòng không sao chép nội dung của chúng tôi mà không có sự cho phép.

## 5. Liên hệ
Mọi thắc mắc xin liên hệ qua [trang Liên hệ](/contact).`,
  },
  affiliate: {
    title: 'Tiết lộ liên kết tiếp thị',
    seoTitle: 'Affiliate Disclosure',
    description: 'Cách chúng tôi sử dụng liên kết affiliate và minh bạch với người đọc.',
    body: '', // sẽ override bằng settings.disclosure (đã có sẵn từ trước)
  },
  contact: {
    title: 'Liên hệ',
    seoTitle: 'Liên hệ',
    description: 'Thông tin liên hệ và hợp tác với chúng tôi.',
    body: '',
  },
};

// Render markdown đơn giản: ## heading, **bold**, [text](url), paragraph, list.
function renderMarkdown(md) {
  if (!md) return null;
  const lines = md.split('\n');
  return lines.map((line, i) => {
    const t = line.trim();
    if (!t) return <div key={i} className="h-3" />;
    if (t.startsWith('## ')) {
      return (
        <h2 key={i} className="mt-6 text-xl font-extrabold sm:text-2xl">
          {t.replace('## ', '')}
        </h2>
      );
    }
    if (t.startsWith('- ')) {
      const content = t.replace('- ', '');
      return (
        <li key={i} className="ml-5 list-disc leading-relaxed">
          {renderInline(content)}
        </li>
      );
    }
    return (
      <p key={i} className="mt-3 leading-relaxed text-brand-ink-700">
        {renderInline(t)}
      </p>
    );
  });
}

function renderInline(text) {
  // Markdown link [text](url)
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  return parts.map((p, i) => {
    const m = p.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (m) {
      return (
        <a key={i} href={m[2]} className="text-brand-orange-600 hover:underline">
          {m[1]}
        </a>
      );
    }
    // Bold **text**
    const boldParts = p.split(/(\*\*[^*]+\*\*)/g);
    return boldParts.map((bp, j) => {
      const bm = bp.match(/^\*\*([^*]+)\*\*$/);
      if (bm) return <strong key={`${i}-${j}`}>{bm[1]}</strong>;
      return <span key={`${i}-${j}`}>{bp}</span>;
    });
  });
}

/**
 * LegalPage — generic component dùng cho /privacy-policy, /terms, /affiliate-disclosure, /contact.
 * Nội dung lấy từ siteSettings.legal.{key} (admin chỉnh trong Cài đặt → tab Pháp lý).
 * Nếu admin chưa nhập → fallback default text.
 */
export default function LegalPage({ pageKey }) {
  const { settings } = useSiteSettings();
  const def = DEFAULTS[pageKey] || DEFAULTS.privacy;

  // Resolve body content
  const body = useMemo(() => {
    if (pageKey === 'contact') {
      // Build contact body from settings.contact
      const c = settings?.contact || {};
      const profile = settings?.profile || {};
      const lines = [];
      lines.push(`Bạn có thể liên hệ ${profile.name || 'mình'} qua các kênh sau:\n`);
      if (c.email || settings?.email) lines.push(`- **Email**: [${c.email || settings.email}](mailto:${c.email || settings.email})`);
      if (c.phone) lines.push(`- **Điện thoại / Zalo**: ${c.phone}`);
      if (c.zalo) lines.push(`- **Zalo**: [${c.zalo}](${c.zalo.startsWith('http') ? c.zalo : `https://zalo.me/${c.zalo.replace(/[^\d]/g, '')}`})`);
      if (c.facebook || settings?.socials?.facebook) {
        const fb = c.facebook || settings.socials.facebook;
        lines.push(`- **Facebook**: [${fb}](${fb})`);
      }
      if (c.address) lines.push(`- **Địa chỉ**: ${c.address}`);
      if (lines.length === 1) {
        lines.push('- (Chưa có thông tin liên hệ. Admin có thể cập nhật trong /admin → Cài đặt website.)');
      }
      lines.push('\n## Hợp tác / quảng cáo / review sản phẩm');
      lines.push('Nếu bạn là brand muốn hợp tác review sản phẩm, vui lòng gửi email kèm thông tin sản phẩm + brief. Chúng tôi sẽ phản hồi trong vòng 2-3 ngày làm việc.');
      return lines.join('\n');
    }
    if (pageKey === 'affiliate') {
      return (
        settings?.legal?.affiliateDisclosure ||
        settings?.disclosure ||
        DEFAULTS.affiliate.body ||
        DEFAULTS.privacy.body
      );
    }
    if (pageKey === 'privacy') return settings?.legal?.privacyPolicy || def.body;
    if (pageKey === 'terms') return settings?.legal?.terms || def.body;
    return def.body;
  }, [pageKey, settings]);

  return (
    <>
      <Seo title={def.seoTitle} description={def.description} type="article" />
      <article className="container-page mx-auto mt-8 max-w-3xl pb-12">
        <h1 className="text-2xl font-extrabold leading-tight sm:text-4xl">{def.title}</h1>
        <div className="mt-2 text-xs text-brand-ink-500">
          Cập nhật: {new Date().toLocaleDateString('vi-VN')}
        </div>
        <div className="prose prose-slate mt-6 max-w-none text-base text-brand-ink-700">
          {renderMarkdown(body)}
        </div>
      </article>
    </>
  );
}
