import { IsUUID, IsString, IsNotEmpty } from 'class-validator';

export class CreateWorkOrderDto {
  @IsUUID()
  @IsNotEmpty()
  customer_id: string;

  @IsUUID()
  @IsNotEmpty()
  vehicle_id: string;

  @IsString()
  @IsNotEmpty()
  description_needed: string;
}
