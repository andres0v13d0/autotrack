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
    return this.service.create(dto, req.user.id);
  }

  @Get()
  @Roles('admin', 'front_desk', 'technician')
  @ApiOperation({ summary: 'List all customers' })
  findAll() {
    return this.service.findAll();
  }

  @Get('search')
  @Roles('admin', 'front_desk', 'technician')
  @ApiOperation({ summary: 'Search customer by phone' })
  @ApiQuery({ name: 'phone', required: true })
  findByPhone(@Query('phone') phone: string) {
    return this.service.findByPhone(phone);
  }

  @Get(':id')
  @Roles('admin', 'front_desk', 'technician')
  @ApiOperation({ summary: 'Get a customer by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'front_desk')
  @ApiOperation({ summary: 'Update a customer' })
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a customer (admin only)' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Get(':id/balance')
  @Roles('admin', 'front_desk')
  @ApiOperation({ summary: 'Get customer total debt (accounts receivable)' })
  getBalance(@Param('id') id: string) {
    return this.paymentsService.getCustomerDebt(id);
  }
}
