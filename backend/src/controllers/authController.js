const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const { User } = require('../models');

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn
  });

  const refreshToken = jwt.sign({ userId, type: 'refresh' }, jwtConfig.secret, {
    expiresIn: jwtConfig.refreshExpiresIn
  });

  return { accessToken, refreshToken };
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const tokens = generateTokens(user.id);

    res.json({
      message: 'Login successful',
      user: user.toJSON(),
      ...tokens
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.register = async (req, res) => {
  try {
    const { email, password, name, role, phone } = req.body;

    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const user = await User.create({
      email,
      password,
      name,
      role: role || 'staff',
      phone
    });

    const tokens = generateTokens(user.id);

    res.status(201).json({
      message: 'User registered successfully',
      user: user.toJSON(),
      ...tokens
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, jwtConfig.secret);

    if (decoded.type !== 'refresh') {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const tokens = generateTokens(user.id);

    res.json({
      message: 'Tokens refreshed',
      ...tokens
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Refresh token expired' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

exports.me = async (req, res) => {
  res.json({ user: req.user.toJSON() });
};
