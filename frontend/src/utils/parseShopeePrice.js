/**
 * Parse khối text giá copy từ Shopee (F12 hoặc UI thường) thành các field structured.
 *
 * Input ví dụ:
 *   "91.000đ - 238.000đ"
 *   "91.000đ"
 *   "91.000đ - 238.000đ\n105.000đ - 276.000đ\n-13%"
 *   "91.000đ - 238.000đ 105.000đ - 276.000đ -13%"
 *
 * Output: { priceMin, priceMax, oldPriceMin, oldPriceMax, discountPercent }
 *
 * Heuristic:
 *  - Tách input theo newline/tab. Nếu input 1 dòng → tách theo nhóm số dạng "XX.XXXđ".
 *  - Dòng đầu tiên có số = giá hiện tại (priceMin, priceMax).
 *  - Dòng có số tiếp theo = giá gốc (oldPriceMin, oldPriceMax).
 *  - Phần "-XX%" bất kỳ vị trí = discountPercent.
 */
const NUM_RX = /(\d{1,3}(?:[.,]\d{3})+|\d{4,})/g;
const PERCENT_RX = /-?\s*(\d{1,3})\s*%/;

function extractNumbers(line) {
  const matches = line.match(NUM_RX) || [];
  return matches
    .map((m) => Number(m.replace(/[^\d]/g, '')))
    .filter((n) => n >= 100);
}

export function parseShopeePriceText(text) {
  if (!text || typeof text !== 'string') return null;
  const result = {
    priceMin: null,
    priceMax: null,
    oldPriceMin: null,
    oldPriceMax: null,
    discountPercent: null,
  };

  // Bóc % bất kỳ vị trí
  const pctMatch = text.match(PERCENT_RX);
  if (pctMatch) {
    const v = Number(pctMatch[1]);
    if (v > 0 && v <= 100) result.discountPercent = v;
  }

  // Tách thành "dòng" theo newline. Nếu chỉ 1 dòng nhưng có > 2 số → tách thành nhóm 2.
  const lines = text
    .split(/[\n\r]+/)
    .map((l) => l.trim())
    .filter(Boolean);

  // Mảng dòng dạng "có ít nhất 1 số tiền"
  const numericLines = lines
    .map((l) => ({ line: l, nums: extractNumbers(l) }))
    .filter((x) => x.nums.length);

  let priceNums = [];
  let oldNums = [];

  if (numericLines.length >= 2) {
    // 2 dòng riêng — dòng 1 hiện tại, dòng 2 cũ
    priceNums = numericLines[0].nums;
    oldNums = numericLines[1].nums;
  } else if (numericLines.length === 1) {
    // 1 dòng — có thể có 2 hoặc 4 số (current 1 hoặc 2 + old 1 hoặc 2)
    const all = numericLines[0].nums;
    if (all.length >= 4) {
      // current range + old range
      priceNums = [all[0], all[1]];
      oldNums = [all[2], all[3]];
    } else if (all.length === 3) {
      // current range + old single
      priceNums = [all[0], all[1]];
      oldNums = [all[2]];
    } else if (all.length === 2) {
      // current range (nếu khác xa) hoặc current single + old single (nếu gần nhau)
      // Heuristic: nếu số sau lớn hơn số trước → current range. Nếu sau lớn hơn nhiều và là old → old.
      // An toàn nhất: assume current range trừ khi khoảng cách > 2x.
      if (all[1] > all[0] * 1.8 && all[1] < all[0] * 4) {
        // Có vẻ range giá (2x-3x lệch nhau)
        priceNums = all;
      } else if (all[1] > all[0]) {
        // Có thể là current + old hoặc range nhỏ — chọn current+old vì discount style
        priceNums = [all[0]];
        oldNums = [all[1]];
      } else {
        priceNums = [all[0]];
        oldNums = [all[1]];
      }
    } else if (all.length === 1) {
      priceNums = all;
    }
  }

  if (priceNums[0]) result.priceMin = priceNums[0];
  if (priceNums[1]) result.priceMax = priceNums[1];
  if (oldNums[0]) result.oldPriceMin = oldNums[0];
  if (oldNums[1]) result.oldPriceMax = oldNums[1];

  // Nếu chỉ có priceMin → discountPercent có thể tính lại nếu có oldPriceMin
  if (
    result.discountPercent == null &&
    result.oldPriceMin &&
    result.priceMin &&
    result.oldPriceMin > result.priceMin
  ) {
    result.discountPercent = Math.round(
      ((result.oldPriceMin - result.priceMin) / result.oldPriceMin) * 100
    );
  }

  const hasAny =
    result.priceMin || result.priceMax || result.oldPriceMin || result.oldPriceMax || result.discountPercent;
  return hasAny ? result : null;
}
