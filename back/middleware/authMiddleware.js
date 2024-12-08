const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.header('x-auth-token'); 

  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
const jwtMiddleware = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    console.error('No token provided.');
    return res.status(401).json({ msg: 'Unauthorized. Token is missing.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; 
    console.log('JWT Middleware - Decoded user:', decoded); 
    next(); 
  } catch (err) {
    console.error('JWT Verification Failed:', err.message);
    return res.status(401).json({ msg: 'Unauthorized. Token is invalid or expired.' });
  }
};
module.exports = authMiddleware;
