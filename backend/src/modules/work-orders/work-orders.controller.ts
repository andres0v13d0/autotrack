import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  BadRequestException,
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
  async create(@Body() dto: CreateWorkOrderDto, @Request() req) {
    if (!dto.vehicle_id || !dto.description_needed) {
      throw new BadRequestException('vehicle_id and description_needed are required');
    }
    try {
      return await this.workOrdersService.create(dto, req.user.id);
    } catch (error) {
      console.error('Error creating work order:', error);
      throw error;
    }
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

  @Get(':id/pdf-data')
  @Roles('admin', 'front_desk', 'technician')
  async getPdfData(@Param('id') id: string, @Request() req: any) {
    const workOrder = await this.workOrdersService.findOne(id);
    const settings = await this.pdfService.getSettings(req.user.id);
    return {
      workOrder,
      settings,
    };
  }
}
