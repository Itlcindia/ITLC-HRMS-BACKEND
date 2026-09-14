const jwt = require('jsonwebtoken');

module.exports = function(roles = []) {
  return (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token, authorization denied' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'superowner_hrms_secret_key_2026');
      req.user = decoded;

      if (roles.length && !roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Access forbidden: unauthorized role' });
      }
      next();
    } catch (err) {
      res.status(401).json({ error: 'Token is invalid' });
    }
  };
};
