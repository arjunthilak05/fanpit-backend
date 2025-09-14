import { ThrottlerGuard } from '@nestjs/throttler';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthThrottlerGuard extends ThrottlerGuard {
  protected errorMessage = 'Too many authentication attempts. Please try again later.';

  protected getTracker(req: Record<string, any>): Promise<string> {
    // Use IP address for tracking
    const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    return Promise.resolve(ip);
  }
}