// ============================================================================
//  PROFILE / SITE CONFIG (default fallback)
//  Khi backend chạy, settings thật được lấy từ /api/site-settings.
//  Đây chỉ là fallback dùng khi backend chưa kết nối được.
// ============================================================================
import { DEFAULT_AVATAR_DATA_URL } from './defaultAvatar';

export const SITE = {
  name: 'Minh Quang Reviews',
  fullName: 'Minh Quang Reviews — Affiliate Store',
  tagline: 'Đồ tốt mình dùng mỗi ngày',
  shortBio:
    'Reviewer đời sống · Mỗi tuần 1 sản phẩm đáng mua. Tap ⬇️ để xem deal tốt nhất.',
  description:
    'Tổng hợp sản phẩm Minh Quang đã review trên TikTok / Facebook. Deal hot, đồ đáng mua, sản phẩm nội địa cao cấp.',
  url: 'https://lion-affiliate.vercel.app',
  avatar: DEFAULT_AVATAR_DATA_URL,
  // Stats để rỗng — admin tự điền số thật trong /admin → Cài đặt.
  // ProfileHeader đã có guard {profile.stats.X && ...} nên không render
  // dòng nào khi chưa điền → tránh hiển thị số fake cho khách.
  stats: {
    followers: '',
    reviewed: '',
    happy: '',
  },
  socials: {
    tiktok: '',
    facebook: 'https://www.facebook.com/Lion9826/',
    instagram: '',
    youtube: '',
    shopee: '',
  },
  followUrl: 'https://www.facebook.com/Lion9826/',
  email: '',
  disclosure:
    'Một số liên kết trên website là liên kết tiếp thị. Khi bạn mua hàng qua các liên kết này, mình có thể nhận được một khoản hoa hồng nhỏ — bạn KHÔNG phải trả thêm bất kỳ chi phí nào.',
};
