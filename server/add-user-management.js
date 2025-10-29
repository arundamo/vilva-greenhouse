const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.join(__dirname, 'vilva-farm.db');
const db = new sqlite3.Database(dbPath);

console.log('Creating user management tables...\n');

db.serialize(() => {
  // Create users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'public')) DEFAULT 'public',
      full_name TEXT,
      email TEXT,
      phone TEXT,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    )
  `, (err) => {
    if (err) {
      console.error('Error creating users table:', err);
      return;
    }
    console.log('✓ Users table created');
  });

  // Create sessions table for managing login sessions
  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      session_token TEXT NOT NULL UNIQUE,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error('Error creating sessions table:', err);
      return;
    }
    console.log('✓ Sessions table created');
  });

  // Create default admin account
  setTimeout(() => {
    db.get('SELECT id FROM users WHERE username = ?', ['admin'], (err, row) => {
      if (err) {
        console.error('Error checking for admin user:', err);
        return;
      }
      
      if (!row) {
        const defaultPassword = 'admin123'; // User should change this immediately
        bcrypt.hash(defaultPassword, 10, (err, hash) => {
          if (err) {
            console.error('Error hashing password:', err);
            return;
          }
          
          db.run(
            `INSERT INTO users (username, password_hash, role, full_name) 
             VALUES (?, ?, 'admin', 'Administrator')`,
            ['admin', hash],
            (err) => {
              if (err) {
                console.error('Error creating admin user:', err);
                return;
              }
              console.log('✓ Default admin user created');
              console.log('  Username: admin');
              console.log('  Password: admin123');
              console.log('  ⚠️  PLEASE CHANGE THIS PASSWORD IMMEDIATELY!');
              db.close();
            }
          );
        });
      } else {
        console.log('✓ Admin user already exists');
        db.close();
      }
    });
  }, 500);
});

console.log('\n✓ Migration completed successfully!');
console.log('User management system is ready.');
