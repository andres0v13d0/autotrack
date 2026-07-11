import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('vehicles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly service: VehiclesService) {}

  @Post()
  @Roles('admin', 'front_desk')
  @ApiOperation({ summary: 'Register a vehicle' })
  create(@Body() dto: CreateVehicleDto) {
    return this.service.create(dto);
  }

  @Get()
  @Roles('admin', 'front_desk', 'technician')
  @ApiOperation({ summary: 'List all vehicles' })
  findAll() {
    return this.service.findAll();
  }

  @Get('by-customer')
  @Roles('admin', 'front_desk', 'technician')
  @ApiOperation({ summary: 'Get vehicles by customer id' })
  @ApiQuery({ name: 'customer_id', required: true })
  findByCustomer(@Query('customer_id') customer_id: string) {
    return this.service.findByCustomer(customer_id);
  }

  @Get(':id')
  @Roles('admin', 'front_desk', 'technician')
  @ApiOperation({ summary: 'Get a vehicle by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'front_desk')
  @ApiOperation({ summary: 'Update a vehicle' })
  update(@Param('id') id: string, @Body() dto: UpdateVehicleDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a vehicle (admin only)' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
