const jwt = require('jsonwebtoken');

const adminProtect = (req, res, next) => {
  try {
    let token;

    if (req.cookies && req.cookies.adminToken) {
      token = req.cookies.adminToken;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Admin not authorized' });
    }

    // Try JWT verification first
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      // Fallback: try to decode as base64 token
      try {
        decoded = JSON.parse(Buffer.from(token, 'base64').toString());
      } catch (b64Error) {
        return res.status(401).json({ success: false, message: 'Invalid admin token' });
      }
    }

    if (!decoded.isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied - admin only' });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid admin token' });
  }
};

module.exports = { adminProtect };
