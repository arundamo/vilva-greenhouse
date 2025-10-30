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

// Register endpoint (for creating public users)
router.post('/register', (req, res) => {
  const { username, password, full_name, email, phone } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  
  // Check if username exists
  db.get('SELECT id FROM users WHERE username = ?', [username], (err, existing) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (existing) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    // Hash password
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to hash password' });
      }
      
      // Create user
      db.run(
        `INSERT INTO users (username, password_hash, role, full_name, email, phone) 
         VALUES (?, ?, 'public', ?, ?, ?)`,
        [username, hash, full_name, email, phone],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to create user' });
          }
          
          res.status(201).json({
            message: 'User registered successfully',
            user: {
              id: this.lastID,
              username,
              role: 'public'
            }
          });
        }
      );
    });
  });
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
        if (err || !match) {
          return res.status(401).json({ error: 'Current password is incorrect' });
        }
        
        // Hash new password
        bcrypt.hash(new_password, 10, (err, hash) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to hash password' });
          }
          
          // Update password
          db.run(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [hash, user.id],
            (err) => {
              if (err) {
                return res.status(500).json({ error: 'Failed to update password' });
              }
              
              res.json({ message: 'Password changed successfully' });
            }
          );
        });
      });
    }
  );
});

module.exports = router;
