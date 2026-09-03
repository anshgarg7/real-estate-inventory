import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { env } from "../config/env";

export interface TokenPayload {
  id: string;
  role: Role;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn } as jwt.SignOptions);
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, env.jwtSecret) as TokenPayload;
}
