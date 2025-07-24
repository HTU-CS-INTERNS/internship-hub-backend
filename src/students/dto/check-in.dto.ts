import { IsNotEmpty, IsNumber } from 'class-validator';

export class CheckInDto {
  @IsNotEmpty()
  @IsNumber()
  latitude: number;

  @IsNotEmpty()
  @IsNumber()
  longitude: number;
}
