import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post()
  @Roles('admin', 'front_desk')
  create(@Body() dto: CreatePaymentDto, @Request() req) {
    return this.paymentsService.create(dto, req.user.id);
  }

  @Get('work-order/:workOrderId')
  @Roles('admin', 'front_desk', 'technician')
  getByWorkOrder(@Param('workOrderId') workOrderId: string) {
    return this.paymentsService.getByWorkOrder(workOrderId);
  }

  @Get('work-order/:workOrderId/balance')
  @Roles('admin', 'front_desk', 'technician')
  getOrderBalance(@Param('workOrderId') workOrderId: string) {
    return this.paymentsService.getOrderBalance(workOrderId);
  }

  @Delete(':id')
  @Roles('admin', 'front_desk')
  delete(@Param('id') id: string) {
    return this.paymentsService.deletePayment(id);
  }
}
