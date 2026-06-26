import { ArrayUnique, IsArray, IsDefined, IsOptional, IsString } from 'class-validator';

export class CustomerDto {
  @IsString()
  @IsDefined()
  name: string;
}

export class UpdateCustomerDto {
  @IsString()
  @IsDefined()
  id: string;

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
