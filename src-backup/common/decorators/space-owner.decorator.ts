import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { SpaceOwnershipGuard } from '../guards/space-ownership.guard';
import { Roles } from './roles.decorator';
import { Role } from '../guards/roles.guard';

/**
 * Decorator to protect space management endpoints
 * Only allows space owners and staff to access
 */
export function RequireSpaceOwnership() {
  return applyDecorators(
    UseGuards(JwtAuthGuard, RolesGuard, SpaceOwnershipGuard),
    Roles(Role.BRAND_OWNER, Role.STAFF),
    ApiBearerAuth('JWT-auth'),
    ApiUnauthorizedResponse({ description: 'Unauthorized - invalid or missing token' }),
    ApiForbiddenResponse({ description: 'Forbidden - insufficient permissions or not space owner' }),
  );
}