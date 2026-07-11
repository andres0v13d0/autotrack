import { IsOptional, IsString, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateVehicleDto {
  @ApiPropertyOptional({ example: 'ABC-1234' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  plate?: string;

  @ApiPropertyOptional({ example: '2018 Toyota Camry' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  model?: string;

  @ApiPropertyOptional({ example: 'oil change' })
  @IsOptional()
  @IsString()
  description?: string;
}
