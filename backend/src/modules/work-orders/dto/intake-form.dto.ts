import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class CreateIntakeFormDto {
  @IsString()
  @IsOptional()
  work_order_id?: string;

  @IsString()
  @IsNotEmpty()
  client_name: string;

  @IsString()
  @IsNotEmpty()
  client_phone: string;

  @IsString()
  @IsNotEmpty()
  vehicle_plate: string;

  @IsString()
  @IsNotEmpty()
  vehicle_model: string;

  @IsNumber()
  @IsOptional()
  mileage_in?: number;

  @IsString()
  @IsOptional()
  vehicle_condition?: string;

  @IsString()
  @IsNotEmpty()
  problem_description: string;

  @IsString()
  @IsOptional()
  client_signature?: string;

  @IsBoolean()
  @IsOptional()
  signed?: boolean;
}

export class UpdateIntakeFormDto {
  @IsString()
  @IsOptional()
  client_name?: string;

  @IsString()
  @IsOptional()
  client_phone?: string;

  @IsNumber()
  @IsOptional()
  mileage_in?: number;

  @IsString()
  @IsOptional()
  vehicle_condition?: string;

  @IsString()
  @IsOptional()
  problem_description?: string;

  @IsString()
  @IsOptional()
  client_signature?: string;

  @IsBoolean()
  @IsOptional()
  signed?: boolean;
}
