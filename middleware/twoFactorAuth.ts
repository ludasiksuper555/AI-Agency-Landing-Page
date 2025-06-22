import { NextRequest, NextResponse } from 'next/server';
import { AuthRequest } from '../types/global';

export interface TwoFactorAuthRequest extends AuthRequest {
  twoFactorToken?: string;
}

export function twoFactorAuthMiddleware(request: NextRequest): NextResponse {
  // Two-factor authentication logic
  return NextResponse.next();
}

export default twoFactorAuthMiddleware;
