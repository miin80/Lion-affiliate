// Blog post tối giản — vẫn giữ để SEO long-tail. Không bắt buộc dùng.
export const BLOG_POSTS = [
  {
    slug: 'top-do-bep-tien-ich-nen-mua',
    title: 'Top đồ bếp tiện ích nên mua 2026 (mình đã test thực tế)',
    excerpt: 'Tổng hợp 5 món bếp tiện lợi, tiết kiệm thời gian, đáng mua nhất.',
    cover: 'https://picsum.photos/seed/blog1/1200/600',
    author: 'Mira',
    publishedAt: '2026-05-08T08:00:00Z',
    readTime: 6,
    tag: 'Top sản phẩm',
    productSlugs: ['noi-chien-khong-dau-8l-smart', 'may-xay-mini-cam-tay', 'ke-bep-thong-minh-da-tang'],
    content: `
## Vì sao bếp nhỏ cần "tối ưu hoá"?

Bếp chung cư thường chật. Đầu tư đúng món sẽ tăng trải nghiệm nấu ăn gấp đôi.

## Các tiêu chí mình cân nhắc

- Tiện vệ sinh
- Bền (dùng lâu)
- Tiết kiệm điện/nước
- Phù hợp gia đình nhỏ

Xem chi tiết các sản phẩm bên dưới.
    `,
  },
  {
    slug: 'review-tai-nghe-anc-duoi-1-trieu',
    title: 'Review tai nghe ANC dưới 1 triệu — đáng tiền không?',
    excerpt: 'Test thực tế 3 môi trường để xem ANC có ổn cho dân văn phòng.',
    cover: 'https://picsum.photos/seed/blog2/1200/600',
    author: 'Mira',
    publishedAt: '2026-05-04T10:00:00Z',
    readTime: 5,
    tag: 'Review',
    productSlugs: ['tai-nghe-bluetooth-anc-pro'],
    content: `
## ANC dưới 1 triệu có thật sự "chống ồn"?

Câu trả lời ngắn: **có**, nhưng tuỳ model. Mình so sánh và chọn ra 1 con đáng tiền nhất.
    `,
  },
];

export function getBlogPost(slug) {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
