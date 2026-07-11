import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVehicleDto {
  @ApiProperty({ example: 'uuid-of-customer' })
  @IsUUID()
  customer_id: string;

  @ApiProperty({ example: 'ABC-1234' })
  @IsString()
  @MinLength(2)
  plate: string;

  @ApiProperty({ example: '2018 Toyota Camry' })
  @IsString()
  @MinLength(2)
  model: string;

  @ApiPropertyOptional({ example: 'rear brake replacement' })
  @IsOptional()
  @IsString()
  description?: string;
}
