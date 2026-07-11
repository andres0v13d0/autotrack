import { IsString, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: '(305) 555-1234' })
  @IsString()
  @Matches(/^\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{4}$/, {
    message: 'phone must be a valid US phone number (e.g. (305) 555-1234)',
  })
  phone: string;
}
