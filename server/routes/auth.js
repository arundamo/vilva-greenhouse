const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('../database');

// Helper function to generate session token
const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Helper function to clean expired sessions
const cleanExpiredSessions = () => {
  db.run('DELETE FROM sessions WHERE expires_at < datetime("now")', (err) => {
    if (err) console.error('Error cleaning expired sessions:', err);
  });
};

// Login endpoint
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  
  // Find user
  db.get(
    'SELECT * FROM users WHERE username = ? AND active = 1',
    [username],
    (err, user) => {
      if (err) {
        console.error('Login DB error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!user) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }
      
      // Compare password
      bcrypt.compare(password, user.password_hash, (err, match) => {
        if (err) {
          console.error('Password compare error:', err);
          return res.status(500).json({ error: 'Authentication error' });
        }
        
        if (!match) {
          return res.status(401).json({ error: 'Invalid username or password' });
        }
        
        // Create session
        const token = generateToken();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
        
        db.run(
          'INSERT INTO sessions (user_id, session_token, expires_at) VALUES (?, ?, ?)',
          [user.id, token, expiresAt.toISOString()],
          function(err) {
            if (err) {
              console.error('Create session error:', err);
              return res.status(500).json({ error: 'Failed to create session' });
            }
            
            // Update last login
            db.run(
              'UPDATE users SET last_login = datetime("now") WHERE id = ?',
              [user.id]
            );
            
            // Clean expired sessions
            cleanExpiredSessions();
            
            // Return user info and token
            res.json({
              token,
              user: {
                id: user.id,
                username: user.username,
                role: user.role,
                full_name: user.full_name,
                email: user.email
              }
            });
          }
        );
      });
    }
  );
});

// Logout endpoint
router.post('/logout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(400).json({ error: 'No token provided' });
  }
  
  db.run('DELETE FROM sessions WHERE session_token = ?', [token], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

// Get current user endpoint
router.get('/me', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  // Find valid session
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
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
      
      res.json({
        id: user.id,
        username: user.username,
        role: user.role,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone
      });
    }
  );
});

// Get all users (admin only)
router.get('/users', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  // Verify admin user
  db.get(
    `SELECT u.* FROM users u 
     JOIN sessions s ON u.id = s.user_id 
     WHERE s.session_token = ? AND s.expires_at > datetime("now") AND u.active = 1`,
    [token],
    (err, user) => {
      if (err || !user) {
        return res.status(401).json({ error: 'Invalid session' });
      }
      
      if (user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      // Get all users (exclude password hash)
      db.all(
        'SELECT id, username, role, full_name, email, phone, active, created_at, last_login FROM users ORDER BY created_at DESC',
        (err, rows) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          res.json(rows);
        }
      );
    }
  );
});

// Register endpoint (for creating users - admin can create any role)
router.post('/register', (req, res) => {
  const { username, password, role, full_name, email, phone } = req.body;
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  // If creating admin user, check if requester is admin
  if (role === 'admin' && token) {
    db.get(
      `SELECT u.* FROM users u 
       JOIN sessions s ON u.id = s.user_id 
       WHERE s.session_token = ? AND s.expires_at > datetime("now") AND u.active = 1`,
      [token],
      (err, user) => {
        if (err || !user || user.role !== 'admin') {
          return res.status(403).json({ error: 'Only admins can create admin users' });
        }
        createUser();
      }
    );
  } else {
    createUser();
  }
  
  function createUser() {
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    // Check if username exists
    db.get('SELECT id FROM users WHERE username = ?', [username], (err, existing) => {
      if (err) {
        console.error('❌ User check error:', err);
        return res.status(500).json({ error: 'Database error', details: err.message });
      }
      
      if (existing) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      
      // Hash password
      bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
          console.error('❌ Password hash error:', err);
          return res.status(500).json({ error: 'Failed to hash password', details: err.message });
        }
        
        // Create user with specified or default role
        const userRole = role || 'public';
        
        db.run(
          `INSERT INTO users (username, password_hash, role, full_name, email, phone) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [username, hash, userRole, full_name, email, phone],
          function(err) {
            if (err) {
              console.error('❌ User creation error:', err);
              return res.status(500).json({ error: 'Failed to create user', details: err.message });
            }
            
            console.log(`✓ User created: ${username} (${userRole})`);
            res.status(201).json({
              message: 'User registered successfully',
              user: {
                id: this.lastID,
                username,
                role: userRole
              }
            });
          }
        );
      });
    });
  }
});

// Change password endpoint
router.post('/change-password', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const { current_password, new_password } = req.body;
  
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  if (!current_password || !new_password) {
    return res.status(400).json({ error: 'Current and new password are required' });
  }
  
  if (new_password.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }
  
  // Find user from session
  db.get(
    `SELECT u.* FROM users u 
     JOIN sessions s ON u.id = s.user_id 
     WHERE s.session_token = ? AND s.expires_at > datetime("now")`,
    [token],
    (err, user) => {
      if (err || !user) {
        return res.status(401).json({ error: 'Invalid session' });
      }
      
      // Verify current password
      bcrypt.compare(current_password, user.password_hash, (err, match) => {
        if (err) {
          console.error('❌ Password compare error:', err);
          return res.status(500).json({ error: 'Authentication error', details: err.message });
        }
        
        if (!match) {
          return res.status(401).json({ error: 'Current password is incorrect' });
        }
        
        // Hash new password
        bcrypt.hash(new_password, 10, (err, hash) => {
          if (err) {
            console.error('❌ Password hash error:', err);
            return res.status(500).json({ error: 'Failed to hash password', details: err.message });
          }
          
          // Update password
          db.run(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [hash, user.id],
            (err) => {
              if (err) {
                console.error('❌ Password update error:', err);
                return res.status(500).json({ error: 'Failed to update password', details: err.message });
              }
              
              console.log(`✓ Password changed for user: ${user.username}`);
              res.json({ message: 'Password changed successfully' });
            }
          );
        });
      });
    }
  );
});

module.exports = router;
