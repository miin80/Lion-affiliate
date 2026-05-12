// "Bộ sưu tập của mình" — các bundle theo chủ đề, do KOL tự curate.
export const COLLECTIONS = [
  {
    slug: 'goc-bep-tien-ich',
    title: 'Góc bếp tiện ích',
    emoji: '🍳',
    cover: 'https://picsum.photos/seed/coll-kitchen/800/600',
    desc: 'Những món biến bếp nhỏ thành studio nấu ăn ngon mỗi ngày.',
    productSlugs: [
      'noi-chien-khong-dau-8l-smart',
      'may-xay-mini-cam-tay',
      'ke-bep-thong-minh-da-tang',
      'hop-dung-thuc-pham-thuy-tinh',
    ],
  },
  {
    slug: 'skincare-yeu-thich',
    title: 'Đồ skincare yêu thích',
    emoji: '💖',
    cover: 'https://picsum.photos/seed/coll-skincare/800/600',
    desc: 'Top sản phẩm dưỡng da mình dùng đều mỗi ngày — đã test 3 tháng+.',
    productSlugs: ['kem-chong-nang-spf50'],
  },
  {
    slug: 'setup-phong-ngu',
    title: 'Setup phòng ngủ aesthetic',
    emoji: '🛏️',
    cover: 'https://picsum.photos/seed/coll-bedroom/800/600',
    desc: 'Phòng ngủ gọn, ấm áp, ánh sáng dễ chịu cho giấc ngủ ngon.',
    productSlugs: ['den-ngu-cam-ung-3-mau', 'may-massage-co-vai-pin-sac', 'camera-wifi-trong-nha-2k'],
  },
  {
    slug: 'an-vat-dang-thu',
    title: 'Đồ ăn vặt đáng thử',
    emoji: '🍿',
    cover: 'https://picsum.photos/seed/coll-snack/800/600',
    desc: 'Snack nội địa Việt — vị quen mà ngon bất ngờ.',
    productSlugs: ['do-an-vat-noi-dia-tong-hop'],
  },
  {
    slug: 'do-hot-tiktok',
    title: 'Đồ hot trên TikTok',
    emoji: '🎵',
    cover: 'https://picsum.photos/seed/coll-tiktok/800/600',
    desc: 'Những món gây bão TikTok gần đây — mình đã test, review thật.',
    productSlugs: [
      'noi-chien-khong-dau-8l-smart',
      'den-ngu-cam-ung-3-mau',
      'kem-chong-nang-spf50',
      'do-an-vat-noi-dia-tong-hop',
      'may-xay-mini-cam-tay',
    ],
  },
];

export function getCollection(slug) {
  return COLLECTIONS.find((c) => c.slug === slug);
}
