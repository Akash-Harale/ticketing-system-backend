import jwt from 'jsonwebtoken';

export const generateAccessToken = (
  userId,
  role,
) =>
  jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    {
      expiresIn: '15m',
    },
  );