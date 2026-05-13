import jwt from 'jsonwebtoken';

const DEFAULT_INSECURE = 'change-me-in-env';
const JWT_SECRET = process.env.JWT_SECRET || DEFAULT_INSECURE;
const IS_PROD = process.env.NODE_ENV === 'production';

if (!process.env.JWT_SECRET || JWT_SECRET === DEFAULT_INSECURE) {
  if (IS_PROD) {
    // Production: fail-fast. Không cho phép token ký bằng secret yếu.
    console.error(
      '[auth] ❌ FATAL: JWT_SECRET chưa set (hoặc dùng default unsafe) trong production.\n' +
        '   Set biến môi trường JWT_SECRET = chuỗi random ≥ 32 ký tự trong Render/Vercel env.\n' +
        '   Vd: openssl rand -hex 32'
    );
    process.exit(1);
  } else {
    console.warn(
      '[auth] WARNING: JWT_SECRET chưa set (dev mode). Đặt JWT_SECRET trong .env trước khi deploy production.'
    );
  }
}

/** Tạo JWT token. Mặc định 7 ngày. */
export function signToken(payload, expiresIn = '7d') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/** Verify token, trả về payload hoặc null. */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

/** Middleware bảo vệ route — yêu cầu Authorization: Bearer <token> */
export function requireAuth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Chưa đăng nhập (thiếu token).' });
  }
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn.' });
  }
  req.user = payload;
  next();
}
