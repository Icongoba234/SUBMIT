const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

// Cache JWT secret and provide a clearer error when it's missing
const JWT_SECRET = process.env.JWT_SECRET;

// Register new user
const register = async (req, res) => {
  try {
    const { fullname, email, password, role = 'citizen' } = req.body;

    // Validation
    if (!fullname || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Fullname, email, and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check if user already exists
    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Ensure JWT secret is configured to avoid partial registration with a token error
    if (!JWT_SECRET) {
      console.error('Register error: JWT_SECRET environment variable is not set');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error: authentication is temporarily unavailable'
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert user
    const [result] = await db.execute(
      'INSERT INTO users (fullname, email, password, role) VALUES (?, ?, ?, ?)',
      [fullname, email, hashedPassword, role]
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: result.insertId, email, role },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: result.insertId,
          fullname,
          email,
          role
        },
        token
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Ensure JWT secret is configured
    if (!JWT_SECRET) {
      console.error('Login error: JWT_SECRET environment variable is not set');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error: authentication is temporarily unavailable'
      });
    }

    // Find user with agency_id and profile_picture
    const [users] = await db.execute(
      'SELECT id, fullname, email, password, role, agency_id, profile_picture FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = users[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Get agency information if user is an agency user
    let agency = null;
    if (user.role === 'agency' && user.agency_id) {
      const [agencies] = await db.execute(
        'SELECT id, name, email FROM agencies WHERE id = ?',
        [user.agency_id]
      );
      if (agencies.length > 0) {
        agency = agencies[0];
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          fullname: user.fullname,
          email: user.email,
          role: user.role,
          agency_id: user.agency_id,
          profile_picture: user.profile_picture,
          agency: agency
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

// Get user profile
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const [users] = await db.execute(
      `SELECT u.id, u.fullname, u.email, u.role, u.profile_picture, u.agency_id, u.created_at,
       a.name as agency_name, a.email as agency_email
       FROM users u
       LEFT JOIN agencies a ON u.agency_id = a.id
       WHERE u.id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = users[0];
    const userData = {
      id: user.id,
      fullname: user.fullname,
      email: user.email,
      role: user.role,
      profile_picture: user.profile_picture,
      created_at: user.created_at
    };

    // Add agency info if user is an agency user
    if (user.role === 'agency' && user.agency_id) {
      userData.agency_id = user.agency_id;
      userData.agency = {
        id: user.agency_id,
        name: user.agency_name,
        email: user.agency_email
      };
    }

    res.json({
      success: true,
      data: {
        user: userData
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fullname } = req.body;

    // Validation
    if (!fullname || fullname.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Fullname must be at least 2 characters'
      });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];

    if (fullname) {
      updates.push('fullname = ?');
      values.push(fullname.trim());
    }

    // Handle profile picture: file upload takes priority
    if (req.file) {
      // File was uploaded - save the file path
      const filePath = `/uploads/profiles/${req.file.filename}`;
      updates.push('profile_picture = ?');
      values.push(filePath);
      
      // Delete old profile picture if it exists and is a file (not URL/data URL)
      const [oldUsers] = await db.execute(
        'SELECT profile_picture FROM users WHERE id = ?',
        [userId]
      );
      if (oldUsers[0] && oldUsers[0].profile_picture) {
        const oldPic = oldUsers[0].profile_picture;
        // Only delete if it's a file path (starts with /uploads/)
        if (oldPic.startsWith('/uploads/')) {
          const fs = require('fs');
          const path = require('path');
          const oldFilePath = path.join(__dirname, '..', oldPic);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    values.push(userId);

    // Update user
    await db.execute(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Fetch updated user
    const [users] = await db.execute(
      `SELECT u.id, u.fullname, u.email, u.role, u.profile_picture, u.agency_id, u.created_at,
       a.name as agency_name, a.email as agency_email
       FROM users u
       LEFT JOIN agencies a ON u.agency_id = a.id
       WHERE u.id = ?`,
      [userId]
    );

    const user = users[0];
    const userData = {
      id: user.id,
      fullname: user.fullname,
      email: user.email,
      role: user.role,
      profile_picture: user.profile_picture,
      created_at: user.created_at
    };

    if (user.role === 'agency' && user.agency_id) {
      userData.agency_id = user.agency_id;
      userData.agency = {
        id: user.agency_id,
        name: user.agency_name,
        email: user.agency_email
      };
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: userData
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile
};

