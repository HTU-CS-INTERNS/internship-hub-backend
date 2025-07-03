import { IsString, IsNotEmpty } from 'class-validator';

export class FeedbackDto {
  @IsString()
  @IsNotEmpty()
  feedback: string;
}
