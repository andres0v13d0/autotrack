import { IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';

export class UpdateSettingDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  tax_rate?: number;

  @IsOptional()
  @IsString()
  shop_name?: string;

  @IsOptional()
  @IsString()
  shop_address?: string;

  @IsOptional()
  @IsString()
  shop_phone?: string;
}
