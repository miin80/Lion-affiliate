export function formatVND(amount) {
  if (typeof amount !== 'number') return '';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCompact(num) {
  if (typeof num !== 'number') return '';
  return new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(num);
}

export function discountPercent(price, originalPrice) {
  if (!originalPrice || originalPrice <= price) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

/**
 * Hiển thị giá theo kiểu Shopee:
 *  - Có range (min < max): "91.000đ - 238.000đ"
 *  - Range bằng nhau hoặc chỉ có 1 giá: "91.000đ"
 *  - Không có gì: ""
 */
export function formatPriceRange(min, max, fallback) {
  const a = typeof min === 'number' && min > 0 ? min : null;
  const b = typeof max === 'number' && max > 0 ? max : null;
  if (a && b && a !== b) return `${formatVND(a)} - ${formatVND(b)}`;
  const single = a || b || (typeof fallback === 'number' ? fallback : null);
  return single ? formatVND(single) : '';
}

/**
 * Chọn discount % ưu tiên: badge scrape Shopee (raw) > tính từ price/originalPrice.
 */
export function resolveDiscount(product) {
  if (typeof product?.discountPercent === 'number' && product.discountPercent > 0) {
    return Math.round(product.discountPercent);
  }
  return discountPercent(product?.price, product?.originalPrice);
}

export function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}
