import { IsBoolean, IsDefined, IsOptional, IsString } from 'class-validator';

export class GhlConnectionDto {
  @IsString()
  @IsDefined()
  locationId: string;

  // GoHighLevel sub-account Private Integration Token (scoped to
  // social-media-posting + users.readonly for auto user detection)
  @IsString()
  @IsDefined()
  token: string;

  // Optional explicit authoring user; auto-detected via the Users API if omitted.
  @IsOptional()
  @IsString()
  userId?: string;
}

export class GhlScheduleDto {
  // ISO 8601 date/time to schedule the post on the GHL calendar.
  // Optional when sending as a draft.
  @IsOptional()
  @IsString()
  date?: string;

  // Send as a GHL draft (no schedule date) instead of scheduling.
  @IsOptional()
  @IsBoolean()
  draft?: boolean;
}
