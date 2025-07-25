import { IsNotEmpty, IsNumber, IsString, IsBoolean, IsOptional } from 'class-validator';

export class CheckInDto {
  @IsOptional()
  @IsString()
  check_in_timestamp?: string;

  @IsNotEmpty()
  @IsNumber()
  latitude: number;

  @IsNotEmpty()
  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsString()
  address_resolved?: string;

  @IsOptional()
  @IsString()
  manual_reason?: string;

  @IsOptional()
  @IsBoolean()
  is_gps_verified?: boolean;

  @IsOptional()
  @IsBoolean()
  is_outside_geofence?: boolean;

  @IsOptional()
  @IsString()
  photo_url?: string;
}
