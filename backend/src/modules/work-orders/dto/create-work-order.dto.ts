import { IsUUID, IsString, IsNotEmpty } from 'class-validator';

export class CreateWorkOrderDto {
  @IsUUID()
  @IsNotEmpty()
  vehicle_id: string;

  @IsString()
  @IsNotEmpty()
  description_needed: string;
}
