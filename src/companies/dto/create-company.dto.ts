import {
  IsString,
  IsOptional,
  IsEmail,
  IsDecimal,
  IsInt,
} from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  name: string;

  @IsString()
  address: string;

  @IsString()
  city: string;

  @IsString()
  region: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsEmail()
  contact_email?: string;

  @IsOptional()
  @IsString()
  contact_phone?: string;

  @IsOptional()
  @IsDecimal()
  geofence_latitude?: number;

  @IsOptional()
  @IsDecimal()
  geofence_longitude?: number;

  @IsOptional()
  @IsInt()
  geofence_radius_meters?: number;
}
