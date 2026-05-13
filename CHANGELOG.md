# Changelog

## Batch — Realtime Preview + Drag-drop + Skeleton (CMS polish)

### ✨ Tính năng mới

**1. Realtime preview component (Desktop/Mobile switch)**
- `components/admin/previews/PreviewFrame.jsx` — wrapper với 2 nút switch 📱/🖥
- `components/admin/previews/ProductPreview.jsx` — preview card sản phẩm (dùng lại `ProductCard` public)
- `components/admin/previews/VideoPreview.jsx` — card video TikTok-style
- `components/admin/previews/CollectionPreview.jsx` — card bộ sưu tập
- `components/admin/previews/BlogPreview.jsx` — card bài viết
- Plug vào: `EditProductModal`, `VideoManager` form, `CollectionsManager` form, `BlogsManager` form
- Realtime update khi nhập form. Mobile = 390px (iPhone 14), Desktop = 100% width

**2. Drag & drop reorder (dùng @dnd-kit)**
- Cài: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- `components/admin/DragSortable.jsx` — reusable wrapper + `DragHandle` button
- Apply vào: VideoManager, CollectionsManager, CategoriesManager
- Kéo handle `⋮⋮` để reorder → optimistic UI → call `api.reorder(items)` → rollback nếu fail
- Backend endpoint: `PATCH /api/<resource>/reorder` đã sẵn sàng từ trước

**3. Skeleton loading**
- `components/Skeletons.jsx` exports: `ProductGridSkeleton`, `VideoReelsSkeleton`, `CollectionsSkeleton`, `ManagerCardListSkeleton`, `BlogListSkeleton`
- Apply vào: ProductManager, VideoManager, CollectionsManager, CategoriesManager, BlogsManager, public Home product grid
- Shimmer animation (class `.skeleton` đã có sẵn trong index.css)

### 🔧 File đã tạo

```
frontend/src/components/admin/previews/PreviewFrame.jsx
frontend/src/components/admin/previews/ProductPreview.jsx
frontend/src/components/admin/previews/VideoPreview.jsx
frontend/src/components/admin/previews/CollectionPreview.jsx
frontend/src/components/admin/previews/BlogPreview.jsx
frontend/src/components/admin/DragSortable.jsx
frontend/src/components/Skeletons.jsx
```

### 🔧 File đã sửa

```
frontend/src/components/admin/EditProductModal.jsx    + import ProductPreview, plug realtime preview
frontend/src/components/admin/VideoManager.jsx        + drag-drop, preview, skeleton
frontend/src/components/admin/CollectionsManager.jsx  + drag-drop, preview, skeleton
frontend/src/components/admin/BlogsManager.jsx        + preview, skeleton
frontend/src/components/admin/CategoriesManager.jsx   + drag-drop, skeleton
frontend/src/components/admin/ProductManager.jsx      + skeleton (ManagerCardListSkeleton)
frontend/src/pages/Home.jsx                           + ProductGridSkeleton khi loading
frontend/package.json                                 + @dnd-kit dependencies
```

### 🧪 Cách test

| Feature | Cách test |
|---|---|
| Preview Product | `/admin → Sản phẩm → ✏️ Chỉnh sửa` → cuối form thấy preview switch Desktop/Mobile, sửa title → preview update realtime |
| Preview Video | `/admin → Video → Thêm/Sửa` → cuối form preview |
| Preview Collection | `/admin → Bộ sưu tập → Thêm/Sửa` → preview |
| Preview Blog | `/admin → Blog → Viết bài` → preview |
| Drag-drop Video | `/admin → Video` → kéo icon `⋮⋮` lên/xuống → thứ tự lưu vào backend |
| Drag-drop Collection | tương tự |
| Drag-drop Category | tương tự |
| Skeleton public | Mở trang chủ lần đầu (cache empty) → thấy 8 product card skeleton trong 1 giây |
| Skeleton admin | Vào /admin → mỗi tab Manager khi loading → skeleton card list |

### 📋 API endpoints (đã có sẵn — chỉ kết nối UI)

- `PATCH /api/videos/reorder` — body: `[{id, order}, ...]`
- `PATCH /api/collections/reorder`
- `PATCH /api/categories/reorder`
- `PATCH /api/blogs/reorder`

### 📦 Dependencies mới

```json
{
  "@dnd-kit/core": "^6.x",
  "@dnd-kit/sortable": "^8.x",
  "@dnd-kit/utilities": "^3.x"
}
```

### ✅ Không phá

- KHÔNG sửa giao diện public (vẫn dùng `ProductCard` cũ)
- KHÔNG xoá tính năng nào hiện có
- KHÔNG đổi API cũ
- Compat với data hiện tại (không cần migration)
