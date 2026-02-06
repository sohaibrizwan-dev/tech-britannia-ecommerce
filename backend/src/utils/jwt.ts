import jwt, { SignOptions } from 'jsonwebtoken';
import config from '../config';
import { JwtPayload } from '../types';

export const generateToken = (userId: string, role: string): string => {
  return jwt.sign({ userId, role }, config.jwtSecret, {
    expiresIn: config.jwtExpire,
  } as SignOptions);
};

export const generateRefreshToken = (userId: string, role: string): string => {
  return jwt.sign({ userId, role }, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpire,
  } as SignOptions);
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.jwtSecret) as JwtPayload;
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.jwtRefreshSecret) as JwtPayload;
};

export const decodeToken = (token: string): JwtPayload | null => {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
};
