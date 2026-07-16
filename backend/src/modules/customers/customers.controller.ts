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
  Inject,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { PaymentsService } from '../payments/payments.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customers')
export class CustomersController {
  constructor(
    private readonly service: CustomersService,
    private readonly paymentsService: PaymentsService,
  ) {}

  @Post()
  @Roles('admin', 'front_desk')
  @ApiOperation({ summary: 'Create a customer' })
  create(@Body() dto: CreateCustomerDto, @Request() req: any) {
    if (!req.user?.id) {
      throw new BadRequestException('User not authenticated');
    }
    return this.service.create(dto, req.user.id);
  }

  @Get()
  @Roles('admin', 'front_desk', 'technician')
  @ApiOperation({ summary: 'List all customers' })
  findAll(@Request() req: any) {
    if (!req.user?.id) {
      throw new BadRequestException('User not authenticated');
    }
    return this.service.findAll(req.user.id);
  }

  @Get('search')
  @Roles('admin', 'front_desk', 'technician')
  @ApiOperation({ summary: 'Search customer by phone' })
  @ApiQuery({ name: 'phone', required: true })
  findByPhone(@Query('phone') phone: string, @Request() req: any) {
    if (!req.user?.id) {
      throw new BadRequestException('User not authenticated');
    }
    return this.service.findByPhone(phone, req.user.id);
  }

  @Get(':id')
  @Roles('admin', 'front_desk', 'technician')
  @ApiOperation({ summary: 'Get a customer by id' })
  findOne(@Param('id') id: string, @Request() req: any) {
    if (!req.user?.id) {
      throw new BadRequestException('User not authenticated');
    }
    return this.service.findOne(id, req.user.id);
  }

  @Patch(':id')
  @Roles('admin', 'front_desk')
  @ApiOperation({ summary: 'Update a customer' })
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto, @Request() req: any) {
    if (!req.user?.id) {
      throw new BadRequestException('User not authenticated');
    }
    return this.service.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @Roles('admin', 'front_desk')
  @ApiOperation({ summary: 'Delete a customer' })
  remove(@Param('id') id: string, @Request() req: any) {
    if (!req.user?.id) {
      throw new BadRequestException('User not authenticated');
    }
    return this.service.remove(id, req.user.id);
  }

  @Get(':id/balance')
  @Roles('admin', 'front_desk')
  @ApiOperation({ summary: 'Get customer total debt (accounts receivable)' })
  getBalance(@Param('id') id: string) {
    return this.paymentsService.getCustomerDebt(id);
  }
}
