import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsDefined,
  IsOptional,
  IsString,
} from 'class-validator';

export class CustomerDto {
  @IsString()
  @IsDefined()
  name: string;

  // Every client must be created with at least one pillar (content theme).
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  pillars: string[];
}

export class UpdateCustomerDto {
  @IsString()
  @IsDefined()
  id: string;

  @IsString()
  @IsDefined()
  name: string;
}

export class PillarDto {
  @IsString()
  @IsDefined()
  name: string;
}

export class AssignChannelsDto {
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @IsOptional()
  integrationIds?: string[];
}
