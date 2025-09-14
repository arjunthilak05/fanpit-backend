import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateSpaceDto } from './create-space.dto';

export class UpdateSpaceDto extends PartialType(
  OmitType(CreateSpaceDto, [] as const)
) {
  // All fields from CreateSpaceDto are optional in UpdateSpaceDto
  // This allows partial updates of any field
}