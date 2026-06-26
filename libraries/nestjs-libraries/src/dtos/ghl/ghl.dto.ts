import { IsDefined, IsString } from 'class-validator';

export class GhlConnectionDto {
  @IsString()
  @IsDefined()
  locationId: string;

  // GoHighLevel sub-account Private Integration Token (scoped to social-media-posting)
  @IsString()
  @IsDefined()
  token: string;
}

export class GhlScheduleDto {
  // ISO 8601 date/time to schedule the post on the GHL calendar
  @IsString()
  @IsDefined()
  date: string;
}
