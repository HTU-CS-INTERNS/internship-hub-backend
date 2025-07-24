import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Request } from 'express'; // This import is not strictly needed for the strategy itself, but good to keep if used elsewhere.

interface JwtPayload {
  sub: number; // FIX: Change 'sub' to number if your user IDs are numbers
  email: string;
  role: string;
  // If your JWT payload also contains first_name, last_name, etc., include them here
  first_name?: string;
  last_name?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'default_secret',
    });
  }

  // FIX: Ensure the return type 'id' is a number
  validate(payload: JwtPayload): {
    id: number; // FIX: Change 'id' to number
    email: string;
    role: string;
    // Include other properties if your AuthUser interface expects them
    first_name?: string;
    last_name?: string;
  } {
    // FIX: Convert payload.sub to a number.
    // Use parseInt for robustness, especially if 'sub' could theoretically be a string representation of a number.
    const userId = parseInt(String(payload.sub), 10);

    if (isNaN(userId)) {
      // This case should ideally not happen if your JWTs are correctly generated,
      // but it's a good defensive check.
      console.error('Invalid user ID (sub) in JWT payload:', payload.sub);
      // Depending on your error handling, you might throw an UnauthorizedException here
      // throw new UnauthorizedException('Invalid user ID in token');
    }

    return {
      id: userId, // FIX: Assign the parsed number
      email: payload.email,
      role: payload.role,
      // Pass other user details if available in the payload and needed in req.user
      first_name: payload.first_name,
      last_name: payload.last_name,
    };
  }
}