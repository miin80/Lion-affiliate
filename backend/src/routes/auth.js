import { signToken, verifyToken } from '../middleware/auth.js';

/**
 * POST /api/auth/login
 * Body: { username, password }
 * So sánh với env ADMIN_USERNAME / ADMIN_PASSWORD.
 */
export function loginRoute(req, res) {
  const { username, password } = req.body || {};
  const U = process.env.ADMIN_USERNAME;
  const P = process.env.ADMIN_PASSWORD;

  if (!U || !P) {
    return res.status(500).json({
      error:
        'Backend chưa cấu hình ADMIN_USERNAME / ADMIN_PASSWORD. Liên hệ quản trị viên.',
    });
  }

  if (!username || !password) {
    return res.status(400).json({ error: 'Vui lòng nhập tên đăng nhập và mật khẩu.' });
  }

  if (username !== U || password !== P) {
    // Delay nhẹ để chống brute-force đơn giản
    return setTimeout(
      () => res.status(401).json({ error: 'Sai tên đăng nhập hoặc mật khẩu.' }),
      500
    );
  }

  const token = signToken({ sub: username, role: 'admin' }, '7d');
  res.json({
    token,
    user: { username, role: 'admin' },
    expiresIn: '7d',
  });
}

/**
 * GET /api/auth/me
 * Kiểm tra token còn hợp lệ — trả về user info nếu có.
 */
export function meRoute(req, res) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No token' });
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Token expired' });
  res.json({ user: { username: payload.sub, role: payload.role } });
}
