// ============================================================================
//  PROFILE / SITE CONFIG
//  Thay đổi mọi thông tin KOL tại đây (tên, ảnh, bio, social, follow link...)
// ============================================================================

export const SITE = {
  // Tên thương hiệu / KOL
  name: 'Mira Reviews',
  // Hiển thị trong title tab + SEO
  fullName: 'Mira — Review & Recommend',
  tagline: 'Mình tổng hợp các sản phẩm mình đã review tại đây',
  shortBio:
    'Reviewer đời sống · Mỗi tuần 1 sản phẩm đáng mua. Tap ⬇️ để xem deal tốt nhất.',
  description:
    'Tổng hợp sản phẩm Mira đã review trên TikTok / Facebook. Deal hot, đồ đáng mua, sản phẩm nội địa cao cấp.',
  url: 'https://mira-reviews.example.com',
  // Avatar (có thể dùng URL Cloudinary hoặc /avatar.jpg trong public/)
  avatar: 'https://i.pravatar.cc/300?img=47',
  cover: 'https://picsum.photos/seed/mira-cover/1200/600',
  // Số lượng người theo dõi hiển thị (đổi tuỳ ý)
  stats: {
    followers: '128K',
    reviewed: '320+',
    happy: '98%',
  },
  // Mạng xã hội - icon hiển thị ở header. Để chuỗi rỗng để ẩn icon đó.
  socials: {
    tiktok: 'https://tiktok.com/@mira_reviews',
    facebook: 'https://facebook.com/mira.reviews',
    instagram: 'https://instagram.com/mira.reviews',
    youtube: '',
    shopee: 'https://shopee.vn/mira_reviews',
  },
  // Nút "Theo dõi" mặc định mở TikTok. Đổi tuỳ ý.
  followUrl: 'https://tiktok.com/@mira_reviews',
  email: 'contact@mira-reviews.example.com',
  // Hiển thị ở footer (theo yêu cầu pháp lý của các nền tảng affiliate)
  disclosure:
    'Một số liên kết trên website là liên kết tiếp thị. Khi bạn mua hàng qua các liên kết này, mình có thể nhận được một khoản hoa hồng nhỏ — bạn KHÔNG phải trả thêm bất kỳ chi phí nào.',
};
