// ============================================================================
//  MOCK PRODUCTS — 12 sản phẩm mẫu phong cách KOL/TikToker
//
//  CÁCH THÊM SẢN PHẨM MỚI:
//  1. Copy 1 object trong mảng PRODUCTS bên dưới
//  2. Đổi `id`, `slug` (không trùng), `title`, `images`, `affiliateUrl`...
//  3. Save file — website tự reload.
//
//  HOẶC dùng trang /admin để dán link affiliate, hệ thống sẽ scrape tự động.
// ============================================================================

const IMG = (seed, w = 800, h = 800) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

export const PRODUCTS = [
  {
    id: 'p01',
    slug: 'noi-chien-khong-dau-8l-smart',
    title: 'Nồi chiên không dầu 8L cảm ứng — không khói, dễ lau',
    shortDesc: 'Dung tích 8L, đủ cho gia đình 4 người. 12 chương trình tự động.',
    fullDesc:
      'Mình dùng con này nửa năm, ưu điểm: dung tích to, lòng nồi dễ vệ sinh, ít khói. Khá hợp gia đình 3-5 người. Nhược: hơi nặng khi di chuyển.',
    pros: ['Lòng nồi chống dính dễ vệ sinh', 'Cảm ứng dễ dùng cho người lớn tuổi', '12 chương trình tự động'],
    forWho: 'Gia đình muốn ăn uống lành mạnh, ít dầu mỡ.',
    price: 1490000,
    originalPrice: 2490000,
    rating: 4.8,
    reviewCount: 2105,
    sold: 8430,
    images: [IMG('airfryer1'), IMG('airfryer2'), IMG('airfryer3')],
    video: 'https://cdn.coverr.co/videos/coverr-cooking-in-the-kitchen-7424/1080p.mp4',
    affiliateUrl: 'https://shopee.vn/product/12345/67890',
    platform: 'shopee',
    category: 'do-bep',
    tags: ['Nồi chiên', '8L', 'Cảm ứng'],
    badges: ['hot', 'deal', 'reviewed', 'bestseller'],
    createdAt: '2026-05-08T10:00:00Z',
  },
  {
    id: 'p02',
    slug: 'may-xay-mini-cam-tay',
    title: 'Máy xay mini cầm tay sạc USB — nhỏ gọn, mạnh mẽ',
    shortDesc: 'Xay sinh tố, smoothie ngay trong cốc — đem theo đi làm cực tiện.',
    fullDesc:
      'Mình review nhiều máy xay mini, đây là con cân bằng tốt giữa lực xay và giá. Sạc 1 lần dùng được 8-10 lần xay.',
    pros: ['Sạc USB-C, pin trâu', 'Lưỡi 6 cánh xay mịn', 'Cốc 380ml mang đi tiện'],
    forWho: 'Người bận rộn cần bữa sáng nhanh, hoặc dân văn phòng.',
    price: 290000,
    originalPrice: 490000,
    rating: 4.7,
    reviewCount: 1567,
    sold: 6820,
    images: [IMG('blender1'), IMG('blender2'), IMG('blender3')],
    video: null,
    affiliateUrl: 'https://shop.tiktok.com/view/product/2222222',
    platform: 'tiktok',
    category: 'do-bep',
    tags: ['Máy xay', 'Mini', 'USB'],
    badges: ['hot', 'reviewed'],
    createdAt: '2026-05-09T11:00:00Z',
  },
  {
    id: 'p03',
    slug: 'den-ngu-cam-ung-3-mau',
    title: 'Đèn ngủ cảm ứng 3 màu — chạm tắt mở, sạc USB',
    shortDesc: 'Ánh sáng dịu, 3 màu, cảm ứng chạm 1 phát. Đặt đầu giường siêu xinh.',
    fullDesc: 'Bedroom vibe must-have. Đặc biệt phù hợp với phòng tone trắng hoặc pastel.',
    pros: ['3 nhiệt độ màu', 'Cảm ứng nhạy', 'Sạc 1 lần dùng 3-5 ngày'],
    forWho: 'Gen Z setup phòng aesthetic.',
    price: 119000,
    originalPrice: 199000,
    rating: 4.9,
    reviewCount: 3210,
    sold: 18420,
    images: [IMG('lamp1'), IMG('lamp2'), IMG('lamp3')],
    video: null,
    affiliateUrl: 'https://shopee.vn/product/333/444',
    platform: 'shopee',
    category: 'gia-dung',
    tags: ['Đèn ngủ', 'Cảm ứng', 'Aesthetic'],
    badges: ['hot', 'deal', 'reviewed', 'bestseller'],
    createdAt: '2026-05-10T08:00:00Z',
  },
  {
    id: 'p04',
    slug: 'tai-nghe-bluetooth-anc-pro',
    title: 'Tai nghe Bluetooth Pro Max — chống ồn ANC, pin 36h',
    shortDesc: 'Âm bass mạnh, chống ồn tốt, đeo cả ngày không mỏi.',
    fullDesc:
      'Mình test ANC trong 3 môi trường (quán cà phê, văn phòng, đường phố) — block ồn tốt hơn nhiều đối thủ cùng giá.',
    pros: ['ANC chủ động', 'Pin 36h', 'Hi-Res Audio + LDAC'],
    forWho: 'Dân văn phòng, sinh viên, ai đi lại nhiều.',
    price: 890000,
    originalPrice: 1490000,
    rating: 4.8,
    reviewCount: 1284,
    sold: 5421,
    images: [IMG('headphone1'), IMG('headphone2'), IMG('headphone3')],
    video: 'https://cdn.coverr.co/videos/coverr-headphones-on-table-7029/1080p.mp4',
    affiliateUrl: 'https://shopee.vn/product/100/200',
    platform: 'shopee',
    category: 'cong-nghe',
    tags: ['Bluetooth', 'ANC', 'Hi-Res'],
    badges: ['hot', 'featured', 'reviewed'],
    createdAt: '2026-05-07T10:00:00Z',
  },
  {
    id: 'p05',
    slug: 'ke-bep-thong-minh-da-tang',
    title: 'Kệ bếp đa tầng thông minh — kéo trượt, inox không gỉ',
    shortDesc: 'Tối ưu không gian bếp nhỏ. Lắp 5 phút, tự đứng vững.',
    fullDesc: 'Mua xong là tủ bếp đẹp ra hẳn. Chứa được nồi cơm, lò vi sóng, gia vị, thớt — gọn gàng vô cùng.',
    pros: ['Inox không gỉ', 'Lắp không cần khoan', 'Chịu tải 30kg/tầng'],
    forWho: 'Bếp chung cư nhỏ, hoặc bếp đang lộn xộn.',
    price: 590000,
    originalPrice: 990000,
    rating: 4.7,
    reviewCount: 892,
    sold: 3245,
    images: [IMG('kitchenrack1'), IMG('kitchenrack2'), IMG('kitchenrack3')],
    video: null,
    affiliateUrl: 'https://www.lazada.vn/products/i55555.html',
    platform: 'lazada',
    category: 'do-bep',
    tags: ['Kệ bếp', 'Inox', 'Tổ chức'],
    badges: ['reviewed', 'featured'],
    createdAt: '2026-05-06T14:00:00Z',
  },
  {
    id: 'p06',
    slug: 'hop-dung-thuc-pham-thuy-tinh',
    title: 'Set 6 hộp đựng thực phẩm thuỷ tinh — an toàn lò vi sóng',
    shortDesc: 'Bộ 6 hộp đủ size, kín khí, dùng được trong lò vi sóng & ngăn đá.',
    fullDesc: 'Bỏ luôn đám hộp nhựa cũ. Hộp thuỷ tinh trong veo nhìn meal prep cực aesthetic, lại an toàn.',
    pros: ['Thuỷ tinh chịu nhiệt -20°C tới 400°C', 'Nắp kín 4 chốt', 'Dùng được lò vi sóng + máy rửa chén'],
    forWho: 'Người ăn meal prep, mẹ chuẩn bị đồ cho con đi học.',
    price: 349000,
    originalPrice: 590000,
    rating: 4.9,
    reviewCount: 2145,
    sold: 9820,
    images: [IMG('foodbox1'), IMG('foodbox2'), IMG('foodbox3')],
    video: null,
    affiliateUrl: 'https://shop.tiktok.com/view/product/4444',
    platform: 'tiktok',
    category: 'gia-dung',
    tags: ['Hộp thuỷ tinh', 'Meal prep'],
    badges: ['hot', 'reviewed'],
    createdAt: '2026-05-05T12:00:00Z',
  },
  {
    id: 'p07',
    slug: 'binh-giu-nhiet-stanley-1l',
    title: 'Bình giữ nhiệt 1L — giữ lạnh 24h, giữ nóng 12h',
    shortDesc: 'Inox 304 hai lớp, ống hút silicone, tay cầm tiện lợi.',
    fullDesc: 'Test thử cho đá vào 8h sáng, 11h tối đá vẫn còn. Đi gym, đi học, đi làm đều ổn.',
    pros: ['Giữ lạnh 24h thật', 'Inox 304 an toàn', 'Tay cầm tiện đi xe máy'],
    forWho: 'Người tập gym, dân văn phòng, mom mang sữa cho con.',
    price: 390000,
    originalPrice: 690000,
    rating: 4.8,
    reviewCount: 1890,
    sold: 7210,
    images: [IMG('tumbler1'), IMG('tumbler2'), IMG('tumbler3')],
    video: null,
    affiliateUrl: 'https://shopee.vn/product/700/800',
    platform: 'shopee',
    category: 'gia-dung',
    tags: ['Bình giữ nhiệt', '1L', 'Inox 304'],
    badges: ['deal', 'reviewed'],
    createdAt: '2026-05-04T09:00:00Z',
  },
  {
    id: 'p08',
    slug: 'kem-chong-nang-spf50',
    title: 'Kem chống nắng SPF50+ PA++++ — không bóng dầu, nâng tone nhẹ',
    shortDesc: 'Chống tia UV mạnh, da khô/dầu đều dùng được. Lớp finish lì tự nhiên.',
    fullDesc: 'Mình da hỗn hợp thiên dầu, dùng được 4 tháng — không gây mụn, không bí da, layer makeup ngon.',
    pros: ['SPF50+ PA++++', 'Không cồn, không paraben', 'Nâng tone nhẹ tự nhiên'],
    forWho: 'Mọi loại da, đặc biệt da dầu mụn.',
    price: 245000,
    originalPrice: 390000,
    rating: 4.9,
    reviewCount: 5678,
    sold: 22100,
    images: [IMG('sunscreen1'), IMG('sunscreen2'), IMG('sunscreen3')],
    video: null,
    affiliateUrl: 'https://shopee.vn/product/900/1000',
    platform: 'shopee',
    category: 'lam-dep',
    tags: ['SPF50', 'Skincare', 'Chống nắng'],
    badges: ['hot', 'featured', 'reviewed', 'bestseller'],
    createdAt: '2026-05-03T10:00:00Z',
  },
  {
    id: 'p09',
    slug: 'may-massage-co-vai-pin-sac',
    title: 'Máy massage cổ vai gáy — sạc pin, 3 chế độ rung & nhiệt',
    shortDesc: 'Đeo lên cổ, 15 phút xoa dịu cơn đau cứng cổ vai. Không dây, gọn.',
    fullDesc: 'Dân văn phòng cuối ngày là cần. Pin 1 lần sạc dùng ~7 ngày (15p/lần).',
    pros: ['3 chế độ rung + nhiệt', 'Pin lâu', 'Đeo gọn không vướng'],
    forWho: 'Dân văn phòng, lập trình viên, designer ngồi nhiều.',
    price: 590000,
    originalPrice: 990000,
    rating: 4.7,
    reviewCount: 1245,
    sold: 4320,
    images: [IMG('massager1'), IMG('massager2'), IMG('massager3')],
    video: null,
    affiliateUrl: 'https://www.lazada.vn/products/i88888.html',
    platform: 'lazada',
    category: 'gia-dung',
    tags: ['Massage', 'Cổ vai', 'Sức khoẻ'],
    badges: ['deal', 'reviewed'],
    createdAt: '2026-05-02T11:00:00Z',
  },
  {
    id: 'p10',
    slug: 'camera-wifi-trong-nha-2k',
    title: 'Camera WiFi trong nhà 2K — xoay 360°, đàm thoại 2 chiều',
    shortDesc: 'Xem mọi góc, báo động chuyển động, lưu thẻ nhớ hoặc cloud.',
    fullDesc: 'Mình dùng để xem em bé + bé mèo ở nhà. App tiếng Việt rõ ràng, đêm hồng ngoại nét.',
    pros: ['Xoay ngang 360°, dọc 90°', 'Đàm thoại 2 chiều', '2K rõ nét'],
    forWho: 'Gia đình có em bé, người nuôi thú cưng, ai đi làm xa.',
    price: 490000,
    originalPrice: 790000,
    rating: 4.6,
    reviewCount: 1567,
    sold: 5210,
    images: [IMG('camera1'), IMG('camera2'), IMG('camera3')],
    video: null,
    affiliateUrl: 'https://shopee.vn/product/1100/1200',
    platform: 'shopee',
    category: 'cong-nghe',
    tags: ['Camera', 'WiFi', '2K'],
    badges: ['new', 'reviewed'],
    createdAt: '2026-05-01T15:00:00Z',
  },
  {
    id: 'p11',
    slug: 'ban-phim-co-mini-65',
    title: 'Bàn phím cơ mini 65% — Hot-swap, RGB, kết nối 3 chế độ',
    shortDesc: 'Layout 65% nhỏ gọn, switch hot-swap dễ đổi, kết nối BT/2.4G/cable.',
    fullDesc: 'Học code, gõ bài, gaming đều ổn. RGB phối đẹp, build chắc tay.',
    pros: ['Hot-swap thay switch dễ', '3 chế độ kết nối', 'RGB tuỳ chỉnh'],
    forWho: 'Lập trình viên, content writer, gamer casual.',
    price: 990000,
    originalPrice: 1690000,
    rating: 4.8,
    reviewCount: 670,
    sold: 1820,
    images: [IMG('keyboard1'), IMG('keyboard2'), IMG('keyboard3')],
    video: null,
    affiliateUrl: 'https://shop.tiktok.com/view/product/9999',
    platform: 'tiktok',
    category: 'cong-nghe',
    tags: ['Bàn phím', 'Mini', 'Cơ'],
    badges: ['new', 'reviewed'],
    createdAt: '2026-04-29T10:00:00Z',
  },
  {
    id: 'p12',
    slug: 'do-an-vat-noi-dia-tong-hop',
    title: 'Combo đồ ăn vặt nội địa — 10 món snack đáng thử',
    shortDesc: 'Bánh tráng, mít sấy, khoai môn, hạt mix... — chuẩn vị Việt.',
    fullDesc: 'Tổng hợp các món mình thấy "ăn là nghiện". Tặng kèm danh sách quán chuẩn ngon nhất.',
    pros: ['10 món đa dạng', 'Đóng gói chỉn chu', 'Nội địa Việt — ủng hộ local brand'],
    forWho: 'Hội mê ăn vặt, quà tặng bạn bè.',
    price: 199000,
    originalPrice: 299000,
    rating: 4.9,
    reviewCount: 890,
    sold: 3210,
    images: [IMG('snack1'), IMG('snack2'), IMG('snack3')],
    video: null,
    affiliateUrl: 'https://shop.tiktok.com/view/product/7777',
    platform: 'tiktok',
    category: 'an-vat',
    tags: ['Ăn vặt', 'Nội địa', 'Combo'],
    badges: ['hot', 'deal', 'reviewed'],
    createdAt: '2026-04-28T16:00:00Z',
  },
];

// ---------- Helpers ----------

export function getProductBySlug(slug) {
  return PRODUCTS.find((p) => p.slug === slug);
}

export function filterAndSort(products, { category = 'all', search = '', sort = 'hot' } = {}) {
  let list = products;
  if (category && category !== 'all') {
    if (category === 'deal') {
      list = list.filter((p) => p.badges?.includes('deal') || p.badges?.includes('hot'));
    } else {
      list = list.filter((p) => p.category === category);
    }
  }
  if (search?.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.shortDesc?.toLowerCase().includes(q) ||
        p.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }
  switch (sort) {
    case 'new':
      list = [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      break;
    case 'price-asc':
      list = [...list].sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      list = [...list].sort((a, b) => b.price - a.price);
      break;
    case 'hot':
    default:
      list = [...list].sort((a, b) => (b.sold || 0) - (a.sold || 0));
  }
  return list;
}

export function getTopBestsellers(n = 3) {
  return [...PRODUCTS].sort((a, b) => (b.sold || 0) - (a.sold || 0)).slice(0, n);
}

export function getProductsByIds(slugs = []) {
  return slugs.map((s) => getProductBySlug(s)).filter(Boolean);
}
