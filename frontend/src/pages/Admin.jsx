import { Routes, Route, Navigate } from 'react-router-dom';
import Seo from '../components/Seo';
import AdminLayout from '../components/admin/AdminLayout';
import Dashboard from '../components/admin/Dashboard';
import ProductManager from '../components/admin/ProductManager';
import VideoManager from '../components/admin/VideoManager';
import CategoriesManager from '../components/admin/CategoriesManager';
import CollectionsManager from '../components/admin/CollectionsManager';
import BlogsManager from '../components/admin/BlogsManager';
import GoogleSheetManager from '../components/admin/GoogleSheetManager';
import SettingsManager from '../components/admin/SettingsManager';
import TrashManager from '../components/admin/TrashManager';
import VideoTrash from '../components/admin/VideoTrash';
import CollectionTrash from '../components/admin/CollectionTrash';
import BlogTrash from '../components/admin/BlogTrash';
import CategoryTrash from '../components/admin/CategoryTrash';
import ImportPanel from '../components/admin/ImportPanel';

/**
 * Admin — route-based navigation. Mỗi tab có URL riêng.
 * Reload giữ đúng page, sidebar tự highlight active theo pathname.
 *
 * Cấu trúc URL:
 *   /admin                        → redirect /admin/dashboard
 *   /admin/dashboard
 *   /admin/import-san-pham
 *   /admin/san-pham
 *   /admin/video-review
 *   /admin/bo-suu-tap
 *   /admin/danh-muc
 *   /admin/blog
 *   /admin/google-sheet
 *   /admin/cai-dat-website
 *   /admin/trash/san-pham
 *   /admin/trash/video
 *   /admin/trash/bo-suu-tap
 *   /admin/trash/blog
 *   /admin/trash/danh-muc
 */
export default function Admin() {
  return (
    <>
      <Seo title="Quản trị" />
      <AdminLayout>
        <Routes>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="import-san-pham" element={<ImportPanel />} />
          <Route path="san-pham" element={<ProductManager />} />
          <Route path="video-review" element={<VideoManager />} />
          <Route path="bo-suu-tap" element={<CollectionsManager />} />
          <Route path="danh-muc" element={<CategoriesManager />} />
          <Route path="blog" element={<BlogsManager />} />
          <Route path="google-sheet" element={<GoogleSheetManager />} />
          <Route path="cai-dat-website" element={<SettingsManager />} />
          <Route path="trash/san-pham" element={<TrashManager />} />
          <Route path="trash/video" element={<VideoTrash />} />
          <Route path="trash/bo-suu-tap" element={<CollectionTrash />} />
          <Route path="trash/blog" element={<BlogTrash />} />
          <Route path="trash/danh-muc" element={<CategoryTrash />} />
          {/* Bất kỳ URL nào không match → về dashboard */}
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Routes>
      </AdminLayout>
    </>
  );
}
