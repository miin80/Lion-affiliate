import { useRef, useState } from 'react';
import ConfirmModal from './ConfirmModal';
import { authHeader } from '../../services/auth';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function BackupManager() {
  const fileRef = useRef(null);
  const [toast, setToast] = useState({ type: '', msg: '' });
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [report, setReport] = useState(null);

  const flash = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast({ type: '', msg: '' }), 4500);
  };

  const downloadAuth = async (path, fallbackName) => {
    setExporting(true);
    try {
      const res = await fetch(API_BASE + path, { headers: { ...authHeader() } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      // Lấy filename từ Content-Disposition
      const cd = res.headers.get('Content-Disposition') || '';
      const m = cd.match(/filename="?([^"]+)"?/);
      const name = m ? m[1] : fallbackName;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      flash('success', `✅ Đã tải ${name}`);
    } catch (err) {
      flash('error', `Lỗi tải: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  const handleExportJson = () => downloadAuth('/api/backup/export', 'lion-backup.json');
  const handleExportCsv = () => downloadAuth('/api/backup/export-csv', 'lion-products.csv');

  const handleSelectFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.endsWith('.json')) {
      flash('error', 'Chỉ chấp nhận file .json');
      e.target.value = '';
      return;
    }
    setPendingFile(f);
    e.target.value = '';
  };

  const confirmImport = async () => {
    if (!pendingFile) return;
    setImporting(true);
    setReport(null);
    try {
      const text = await pendingFile.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error('File không phải JSON hợp lệ');
      }
      const res = await fetch(API_BASE + '/api/backup/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(json),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setReport(data.report);
      const total =
        data.report.products + data.report.videos + data.report.categories +
        data.report.collections + data.report.blogs;
      flash('success', `✅ Import xong: ${total} item. ${data.report.errors.length} lỗi.`);
    } catch (err) {
      flash('error', `❌ Import fail: ${err.message}`);
    } finally {
      setImporting(false);
      setPendingFile(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold sm:text-3xl">💾 Backup dữ liệu</h1>
        <p className="mt-1 text-sm text-brand-ink-500">
          Export toàn bộ data ra JSON (an toàn) hoặc CSV (Excel). Import lại để khôi phục.
        </p>
      </div>

      {toast.msg && (
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm ring-1 ${
            toast.type === 'success'
              ? 'bg-green-50 text-green-700 ring-green-200'
              : 'bg-red-50 text-red-700 ring-red-200'
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Export */}
      <div className="rounded-3xl bg-white p-5 shadow-card ring-1 ring-brand-ink-100">
        <h3 className="text-base font-extrabold">📤 Export</h3>
        <p className="mt-1 text-xs text-brand-ink-500">
          Lưu file về máy. Khuyến nghị export định kỳ (vd hàng tuần) để có backup an toàn.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={handleExportJson}
            disabled={exporting}
            className="btn-primary text-sm disabled:opacity-50"
          >
            {exporting ? '⏳ Đang tải...' : '📄 Export JSON (toàn bộ)'}
          </button>
          <button
            onClick={handleExportCsv}
            disabled={exporting}
            className="rounded-full bg-brand-ink-900 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            📊 Export CSV (chỉ sản phẩm)
          </button>
        </div>
        <div className="mt-3 text-xs text-brand-ink-500">
          <strong>JSON</strong> chứa: products, videos, collections, categories, blogs,
          siteSettings, googleSheetSettings (không kèm password / token).
          <br />
          <strong>CSV</strong> chỉ chứa danh sách products để mở trong Excel / Google Sheet.
        </div>
      </div>

      {/* Import */}
      <div className="rounded-3xl bg-white p-5 shadow-card ring-1 ring-brand-ink-100">
        <h3 className="text-base font-extrabold">📥 Import (khôi phục)</h3>
        <p className="mt-1 text-xs text-brand-ink-500">
          Chọn file JSON đã export trước đó. Upsert theo `id` → trùng id sẽ ghi đè, item mới sẽ thêm vào.
        </p>
        <div className="mt-4">
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            onChange={handleSelectFile}
            className="block text-sm file:mr-3 file:rounded-full file:border-0 file:bg-brand-orange-500 file:px-5 file:py-2 file:text-sm file:font-bold file:text-white file:hover:bg-brand-orange-600"
          />
        </div>
        <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200">
          ⚠️ Import có thể GHI ĐÈ dữ liệu hiện tại cho items có cùng ID. Khuyến nghị Export
          backup hiện tại TRƯỚC khi import (lỡ có gì sai → restore lại).
        </div>

        {report && (
          <div className="mt-4 rounded-2xl bg-brand-ink-50 p-4 text-sm">
            <div className="font-bold">📊 Báo cáo import:</div>
            <ul className="mt-2 space-y-1 text-xs">
              <li>✅ Products: {report.products}</li>
              <li>✅ Videos: {report.videos}</li>
              <li>✅ Categories: {report.categories}</li>
              <li>✅ Collections: {report.collections}</li>
              <li>✅ Blogs: {report.blogs}</li>
              {report.errors.length > 0 && (
                <li className="text-red-600">
                  ❌ Lỗi: {report.errors.length}
                  <ul className="mt-1 list-disc pl-5 text-[10px]">
                    {report.errors.slice(0, 10).map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!pendingFile}
        title="⚠️ Import backup?"
        message={`File: ${pendingFile?.name}\n\nImport có thể GHI ĐÈ dữ liệu hiện tại cho items trùng ID.\nKhuyến nghị bạn đã Export backup trước.\n\nTiếp tục?`}
        confirmText="📥 Import"
        cancelText="Huỷ"
        danger
        busy={importing}
        onConfirm={confirmImport}
        onCancel={() => setPendingFile(null)}
      />
    </div>
  );
}
