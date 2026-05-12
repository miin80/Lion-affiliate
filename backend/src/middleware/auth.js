import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-env';

if (process.env.JWT_SECRET === undefined) {
  console.warn(
    '[auth] WARNING: JWT_SECRET not set in env. Đặt biến môi trường JWT_SECRET (chuỗi random, dài) trong .env hoặc Render/Railway.'
  );
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
