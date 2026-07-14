import { IsNumber, IsString, IsOptional, Min, Max, IsEmail } from 'class-validator';

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

  @IsOptional()
  @IsString()
  shop_email?: string;

  @IsOptional()
  @IsString()
  shop_description?: string;

  @IsOptional()
  @IsString()
  shop_slogan?: string;

  @IsOptional()
  @IsString()
  shop_logo_url?: string;
}
