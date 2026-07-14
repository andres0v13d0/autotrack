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
import { WorkOrdersService } from './work-orders.service';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { AddItemDto } from './dto/add-item.dto';
import { PdfService } from './pdf.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('work-orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WorkOrdersController {
  constructor(
    private workOrdersService: WorkOrdersService,
    private pdfService: PdfService,
  ) {}

  @Post()
  @Roles('admin', 'front_desk')
  create(@Body() dto: CreateWorkOrderDto, @Request() req) {
    return this.workOrdersService.create(dto, req.user.id);
  }

  @Get()
  @Roles('admin', 'front_desk', 'technician')
  findAll() {
    return this.workOrdersService.findAll();
  }

  @Get(':id')
  @Roles('admin', 'front_desk', 'technician')
  findOne(@Param('id') id: string) {
    return this.workOrdersService.findOne(id);
  }

  @Get('vehicle/:vehicleId')
  @Roles('admin', 'front_desk', 'technician')
  findByVehicle(@Param('vehicleId') vehicleId: string) {
    return this.workOrdersService.findByVehicle(vehicleId);
  }

  @Post(':id/items')
  @Roles('admin', 'front_desk', 'technician')
  addItem(@Param('id') id: string, @Body() dto: AddItemDto) {
    return this.workOrdersService.addItem(id, dto);
  }

  @Delete(':id/items/:itemId')
  @Roles('admin', 'front_desk', 'technician')
  removeItem(@Param('id') workOrderId: string, @Param('itemId') itemId: string) {
    return this.workOrdersService.removeItem(workOrderId, itemId);
  }

  @Get(':id/pdf')
  @Roles('admin', 'front_desk', 'technician')
  async getPdf(@Param('id') id: string) {
    const workOrder = await this.workOrdersService.findOne(id);
    return this.pdfService.generateWorkOrderPdf(workOrder);
  }
}
