import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const validateToken = (req, res, next) => {
  const token = req.headers.authorization;

  if (token) {
    // console.log(`token: ${token}`);
    // Verify the token with a maximum age of 10 minutes
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      console.log(err);
  
      if (err) return res.sendStatus(403);
  
      req.user = user;
  
      next();
    });
  } else {
    return res.status(401).json({ error: 'Token not provided' });
  }
};

export default validateToken;
