import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const validateToken = (req, res, next) => {
  const token = req.headers.authorization;

  if (token) {
    // Extract the token from the "Bearer <token>" format
    const tokenWithoutBearer = token.split(' ')[1];

    jwt.verify(tokenWithoutBearer, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        // Token verification failed
        return res.status(403).json({ error: 'Invalid token' });
      }

      // Token is valid, attach the decoded token data to the request object
      req.user = user;

      next();
    });
  } else {
    // Token not provided
    return res.status(401).json({ error: 'Token not provided' });
  }
};

export default validateToken;
