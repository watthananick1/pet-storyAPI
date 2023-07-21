import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const secretKey = process.env.JWT_SECRET; // Replace with your own secret key

const validateToken = (req, res, next) => {
  const token = req.headers.authorization;

  if (token) {
    // console.log(`token: ${token}`);
    // Verify the token with a maximum age of 10 minutes
    jwt.verify(token, secretKey, { expiresIn: '1h' }, (err, decodedToken) => {
      if (err) {
        return res.status(401).json({ error: err });
      } else {
        // Store the decoded token in the request object
        req.user = decodedToken;
        next();
      }
    });
  } else {
    return res.status(401).json({ error: 'Token not provided' });
  }
};


export default validateToken;
