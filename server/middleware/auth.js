const db = require('../database');

// Middleware to verify authentication
const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Verify session
  db.get(
    `SELECT u.* FROM users u 
     JOIN sessions s ON u.id = s.user_id 
     WHERE s.session_token = ? AND s.expires_at > datetime("now") AND u.active = 1`,
    [token],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!user) {
        return res.status(401).json({ error: 'Invalid or expired session' });
      }
      
      req.user = user;
      next();
    }
  );
};

// Middleware to require admin role
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  next();
};

// Middleware to require admin or self (for user management)
const requireAdminOrSelf = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const targetUserId = parseInt(req.params.id || req.params.userId);
  
  if (req.user.role === 'admin' || req.user.id === targetUserId) {
    next();
  } else {
    res.status(403).json({ error: 'Access denied' });
  }
};

module.exports = {
  requireAuth,
  requireAdmin,
  requireAdminOrSelf
};
