import { useEffect, useMemo, useState } from 'react';
import { sheetApi } from '../../services/googleSheet';
import { formatVND } from '../../utils/format';
import PlatformBadge from '../PlatformBadge';

const STATUS_FILTERS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'active', label: 'Active' },
  { key: 'hidden', label: 'Hidden' },
  { key: 'errors', label: 'Có lỗi' },
];

export default function GoogleSheetManager() {
  const [csvUrl, setCsvUrl] = useState('');
  const [lastImportAt, setLastImportAt] = useState(null);
  const [lastImportCount, setLastImportCount] = useState(0);

  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);

  const [loadingSettings, setLoadingSettings] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [importing, setImporting] = useState(false);

  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(new Set());

  useEffect(() => {
    (async () => {
      try {
        const s = await sheetApi.getSettings();
        setCsvUrl(s?.csvUrl || '');
        setLastImportAt(s?.lastImportAt || null);
        setLastImportCount(s?.lastImportCount || 0);
      } catch (err) {
        setError(`Không tải được settings: ${err.message}`);
      } finally {
        setLoadingSettings(false);
      }
    })();
  }, []);

  const flashToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const handleSaveUrl = async () => {
    setError('');
    if (!csvUrl.trim()) {
      setError('Vui lòng dán Google Sheet URL.');
      return;
    }
    setSaving(true);
    try {
      const s = await sheetApi.saveSettings(csvUrl.trim());
      setCsvUrl(s.csvUrl);
      flashToast('✓ Đã lưu Google Sheet URL');
    } catch (err) {
      setError(`Lỗi lưu: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async () => {
    setError('');
    setRows([]);
    setSummary(null);
    setSelected(new Set());
    if (!csvUrl.trim()) {
      setError('Vui lòng lưu URL trước khi đồng bộ.');
      return;
    }
    setPreviewing(true);
    try {
      const result = await sheetApi.preview(csvUrl.trim());
      setRows(result.rows || []);
      setSummary(result.summary);
      const valid = (result.rows || [])
        .filter((r) => !r.errors.length && r.originalStatus === 'active')
        .map((r) => r.rowIndex);
      setSelected(new Set(valid));
      if (!result.rows?.length) {
        flashToast('Sheet không có dòng nào.');
      }
    } catch (err) {
      setError(`Lỗi load Sheet: ${err.message}`);
    } finally {
      setPreviewing(false);
    }
  };

  const handleImport = async (importAll) => {
    setError('');
    if (!rows.length) {
      setError('Chưa có dữ liệu preview. Bấm "Đồng bộ" trước.');
      return;
    }
    const selectedIds = importAll ? null : Array.from(selected);
    if (!importAll && !selectedIds.length) {
      setError('Chưa chọn dòng nào để import.');
      return;
    }
    setImporting(true);
    try {
      const result = await sheetApi.import({
        csvUrl: csvUrl.trim(),
        selectedIds,
      });
      flashToast(
        `✓ Đã import ${result.imported}/${result.total} sản phẩm` +
          (result.errors ? ` (${result.errors} lỗi)` : '')
      );
      setLastImportAt(new Date().toISOString());
      setLastImportCount(result.imported);
    } catch (err) {
      setError(`Lỗi import: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  const visibleRows = useMemo(() => {
    if (!rows.length) return [];
    switch (filter) {
      case 'active':
        return rows.filter((r) => r.originalStatus === 'active' && !r.errors.length);
      case 'hidden':
        return rows.filter((r) => r.originalStatus === 'hidden');
      case 'errors':
        return rows.filter((r) => r.errors.length || r.warnings.length);
      default:
        return rows;
    }
  }, [rows, filter]);

  const toggleRow = (rowIndex) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(rowIndex)) next.delete(rowIndex);
      else next.add(rowIndex);
      return next;
    });
  };

  const toggleAllVisible = () => {
    const allIds = visibleRows.filter((r) => !r.errors.length).map((r) => r.rowIndex);
    const allChecked = allIds.every((id) => selected.has(id));
    setSelected((s) => {
      const next = new Set(s);
      if (allChecked) allIds.forEach((id) => next.delete(id));
      else allIds.forEach((id) => next.add(id));
      return next;
    });
  };

  if (loadingSettings) {
    return (
      <div className="rounded-3xl bg-brand-ink-50 p-10 text-center text-sm text-brand-ink-500">
        Đang tải...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* URL config */}
      <div className="rounded-3xl bg-white p-5 shadow-card ring-1 ring-brand-ink-100 sm:p-6">
        <h3 className="text-base font-extrabold">📊 Google Sheet URL</h3>
        <p className="mt-1 text-xs text-brand-ink-500">
          Dán URL Google Sheet — đường dẫn edit (...spreadsheets/d/...) hoặc CSV publish đều OK.
          Hướng dẫn tạo Sheet tại file <code>GOOGLE_SHEET_SETUP.md</code> trong repo.
        </p>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            type="url"
            value={csvUrl}
            onChange={(e) => setCsvUrl(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/..."
            className="input-base flex-1"
          />
          <button
            onClick={handleSaveUrl}
            disabled={saving}
            className="btn-ghost shrink-0 text-sm disabled:opacity-50"
          >
            {saving ? '⏳ Đang lưu...' : '💾 Lưu link'}
          </button>
          <button
            onClick={handlePreview}
            disabled={previewing}
            className="btn-primary shrink-0 text-sm disabled:opacity-50"
          >
            {previewing ? '⏳ Đang tải...' : '🔄 Đồng bộ từ Sheet'}
          </button>
        </div>

        {lastImportAt && (
          <div className="mt-3 text-[11px] text-brand-ink-500">
            🕐 Lần import cuối: {new Date(lastImportAt).toLocaleString('vi-VN')} ·
            <strong className="text-brand-orange-600">{' '}{lastImportCount} sản phẩm</strong>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 px-4 py-2.5 text-sm text-red-700 ring-1 ring-red-200">
          ⚠️ {error}
        </div>
      )}
      {toast && (
        <div className="rounded-2xl bg-green-50 px-4 py-2.5 text-sm text-green-700 ring-1 ring-green-200">
          {toast}
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatCard label="Tổng dòng" value={summary.total} />
          <StatCard label="Hợp lệ + Active" value={summary.valid - summary.hidden} accent="green" />
          <StatCard label="Bị ẩn" value={summary.hidden} accent="amber" />
          <StatCard label="Lỗi" value={summary.errors} accent="red" />
        </div>
      )}

      {rows.length > 0 && (
        <div className="rounded-3xl bg-white p-4 shadow-card ring-1 ring-brand-ink-100 sm:p-5">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    filter === f.key
                      ? 'border-transparent bg-brand-ink-900 text-white'
                      : 'border-brand-ink-200 bg-white text-brand-ink-700 hover:border-brand-orange-300'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="text-xs text-brand-ink-500">
              Đã chọn: <strong className="text-brand-orange-600">{selected.size}</strong> / {rows.length}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-ink-200 text-left text-[11px] uppercase tracking-wide text-brand-ink-500">
                  <th className="py-2 pr-2">
                    <input
                      type="checkbox"
                      onChange={toggleAllVisible}
                      checked={
                        visibleRows.length > 0 &&
                        visibleRows.filter((r) => !r.errors.length).every((r) => selected.has(r.rowIndex))
                      }
                      className="h-4 w-4 accent-brand-orange-500"
                    />
                  </th>
                  <th className="py-2 pr-2">#</th>
                  <th className="py-2 pr-2">Ảnh</th>
                  <th className="py-2 pr-2">Tên</th>
                  <th className="py-2 pr-2">Giá</th>
                  <th className="py-2 pr-2">Cat</th>
                  <th className="py-2 pr-2">Aff</th>
                  <th className="py-2 pr-2">Status</th>
                  <th className="py-2 pr-2">Issues</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((r) => {
                  const p = r.product;
                  const hasErr = r.errors.length > 0;
                  const isActive = r.originalStatus === 'active';
                  return (
                    <tr key={r.rowIndex} className={`border-b border-brand-ink-100 ${hasErr ? 'bg-red-50/40' : ''}`}>
                      <td className="py-2 pr-2">
                        <input
                          type="checkbox"
                          disabled={hasErr}
                          checked={selected.has(r.rowIndex)}
                          onChange={() => toggleRow(r.rowIndex)}
                          className="h-4 w-4 accent-brand-orange-500 disabled:opacity-30"
                        />
                      </td>
                      <td className="py-2 pr-2 text-[10px] text-brand-ink-400">{r.rowIndex}</td>
                      <td className="py-2 pr-2">
                        {p.images?.[0] ? (
                          <img
                            src={p.images[0]}
                            alt=""
                            className="h-12 w-12 rounded-lg object-cover"
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.src = 'https://placehold.co/100x100/fee2e2/991b1b?text=X';
                            }}
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-ink-100 text-[9px] text-brand-ink-500">
                            No image
                          </div>
                        )}
                      </td>
                      <td className="py-2 pr-2 max-w-[260px]">
                        <div className="line-clamp-2 font-semibold">
                          {p.title || <em className="text-red-500">(thiếu)</em>}
                        </div>
                        {p.id && <div className="text-[10px] text-brand-ink-400">id: {p.id}</div>}
                      </td>
                      <td className="py-2 pr-2 font-bold text-brand-orange-600">
                        {p.price ? formatVND(p.price) : '—'}
                      </td>
                      <td className="py-2 pr-2 text-xs">{p.category || '—'}</td>
                      <td className="py-2 pr-2">
                        {p.affiliateUrl ? (
                          <a
                            href={p.affiliateUrl}
                            target="_blank"
                            rel="noopener nofollow noreferrer"
                            className="text-[11px] text-brand-blue-600 hover:underline"
                            title={p.affiliateUrl}
                          >
                            <PlatformBadge platform={p.platform} className="text-[10px]" />
                          </a>
                        ) : (
                          <span className="text-[10px] font-bold text-red-600">⚠️ thiếu</span>
                        )}
                      </td>
                      <td className="py-2 pr-2">
                        <span
                          className={`badge ${
                            isActive ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          ● {r.originalStatus}
                        </span>
                      </td>
                      <td className="py-2 pr-2">
                        {r.errors.length > 0 && (
                          <div className="text-[10px] font-bold text-red-600">❌ {r.errors.join(', ')}</div>
                        )}
                        {r.warnings.length > 0 && (
                          <div className="text-[10px] text-amber-700">⚠️ {r.warnings.join(', ')}</div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => handleImport(false)}
              disabled={importing || selected.size === 0}
              className="btn-primary text-sm disabled:opacity-50"
            >
              {importing ? '⏳ Đang import...' : `📥 Import đã chọn (${selected.size})`}
            </button>
            <button
              onClick={() => handleImport(true)}
              disabled={importing}
              className="btn-ghost text-sm disabled:opacity-50"
            >
              {importing ? '⏳ Đang import...' : '📤 Import tất cả (active + hợp lệ)'}
            </button>
          </div>
        </div>
      )}

      {!rows.length && !previewing && csvUrl && (
        <div className="rounded-3xl bg-brand-ink-50 p-8 text-center text-sm text-brand-ink-500">
          Bấm <strong>🔄 Đồng bộ từ Sheet</strong> để fetch dữ liệu.
        </div>
      )}
      {!csvUrl && (
        <div className="rounded-3xl bg-brand-orange-50 p-5 text-sm ring-1 ring-brand-orange-200">
          <div className="font-bold text-brand-orange-700">👉 Chưa có Google Sheet URL</div>
          <p className="mt-1 text-brand-ink-700">
            Tạo Sheet với header columns: <code className="text-[11px]">id, title, sourceUrl, affiliateUrl, category, price, oldPrice, description, image, gallery, video, rating, tags, isHot, isBestSeller, status</code>.
            Hướng dẫn chi tiết tại <code>GOOGLE_SHEET_SETUP.md</code>.
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }) {
  const accentCls = {
    green: 'bg-green-50 text-green-700 ring-green-200',
    amber: 'bg-amber-50 text-amber-700 ring-amber-200',
    red: 'bg-red-50 text-red-700 ring-red-200',
  }[accent] || 'bg-white text-brand-ink-700 ring-brand-ink-100';
  return (
    <div className={`rounded-2xl p-3 ring-1 ${accentCls}`}>
      <div className="text-[10px] uppercase tracking-wide opacity-70">{label}</div>
      <div className="mt-0.5 text-xl font-extrabold">{value}</div>
    </div>
  );
}
