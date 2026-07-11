import { IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCustomerDto {
  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ example: '(305) 555-1234' })
  @IsOptional()
  @IsString()
  @Matches(/^\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{4}$/, {
    message: 'phone must be a valid US phone number',
  })
  phone?: string;
}
