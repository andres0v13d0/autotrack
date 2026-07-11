import { Controller, Post, Body } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from '../users/users.service';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class SeedAdminDto {
  @ApiProperty({ example: 'Admin User' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'admin@shop.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'SEED_SECRET' })
  @IsString()
  seed_key: string;
}

@ApiTags('seed')
@Controller('seed')
export class SeedAdminController {
  constructor(private readonly usersService: UsersService) {}

  @Post('admin')
  @ApiOperation({
    summary:
      'Create the first admin user. Requires SEED_KEY env var. Remove in production.',
  })
  async seedAdmin(@Body() dto: SeedAdminDto) {
    const seedKey = process.env.SEED_KEY;
    if (!seedKey || dto.seed_key !== seedKey) {
      return { message: 'Forbidden: invalid seed key' };
    }
    return this.usersService.create({
      name: dto.name,
      email: dto.email,
      password: dto.password,
      role: 'admin' as any,
    });
  }
}
