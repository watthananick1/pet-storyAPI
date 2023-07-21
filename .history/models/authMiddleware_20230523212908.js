import jwt from 'jsonwebtoken';

const validateToken = (req, res, next) => {
  const token = req.headers.authorization;
  const expiresIn = '10m';
    const secretKey = crypto.randomBytes(32).toString('hex');

  if (token) {
    // Verify the token
    jwt.verify(token, 'secretKey', (err, decodedToken) => {
      if (err) {
        return res.status(401).json({ error: 'Invalid token' });
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
