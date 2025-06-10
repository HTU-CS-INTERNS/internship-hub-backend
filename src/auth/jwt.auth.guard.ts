import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * This guard uses Passport's JWT strategy to protect routes.
 * It ensures only authenticated users with a valid JWT can access them.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
