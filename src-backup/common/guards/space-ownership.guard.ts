import { 
  Injectable, 
  CanActivate, 
  ExecutionContext, 
  ForbiddenException,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Space, SpaceDocument } from '../../spaces/schemas/space.schema';

@Injectable()
export class SpaceOwnershipGuard implements CanActivate {
  constructor(
    @InjectModel(Space.name) private spaceModel: Model<SpaceDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const spaceId = request.params.id || request.params.spaceId;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    if (!spaceId) {
      throw new ForbiddenException('Space ID is required');
    }

    // Staff can access all spaces
    if (user.role === 'staff') {
      return true;
    }

    // Find the space
    const space = await this.spaceModel.findById(spaceId).select('ownerId').exec();
    if (!space) {
      throw new NotFoundException('Space not found');
    }

    // Check if user owns the space
    if (space.ownerId.toString() !== user.id) {
      throw new ForbiddenException('You can only manage your own spaces');
    }

    // Attach space to request for controller use
    request.space = space;

    return true;
  }
}