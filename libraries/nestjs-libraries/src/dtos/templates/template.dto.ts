import {
  IsArray,
  IsDefined,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TemplateTagDto {
  // The tag id (matches the value used by the existing tags component)
  @IsString()
  @IsDefined()
  value: string;

  @IsOptional()
  @IsString()
  label?: string;
}

export class TemplateDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @IsDefined()
  name: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  postType?: string;

  // The composer payload (CreatePostDto.posts shape: per-channel content,
  // media and settings). Stored as JSON so a template can be re-hydrated
  // straight into the existing post composer.
  @IsDefined()
  payload: any;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateTagDto)
  tags?: TemplateTagDto[];
}
