import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { WorkOrdersService } from './work-orders.service';
import { IntakeFormService } from './intake-form.service';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { CreateIntakeFormDto, UpdateIntakeFormDto } from './dto/intake-form.dto';
import { AddItemDto } from './dto/add-item.dto';
import { PdfService } from './pdf.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('work-orders')
@UseGuards(JwtAuthGuard)
export class WorkOrdersController {
  constructor(
    private workOrdersService: WorkOrdersService,
    private intakeFormService: IntakeFormService,
    private pdfService: PdfService,
  ) {}

  @Post()
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
  findAll(@Request() req: any) {
    if (!req.user?.id) {
      throw new BadRequestException('User not authenticated');
    }
    return this.workOrdersService.findAll(req.user.id);
  }

  @Get('vehicle/:vehicleId')
  findByVehicle(@Param('vehicleId') vehicleId: string, @Request() req: any) {
    if (!req.user?.id) {
      throw new BadRequestException('User not authenticated');
    }
    return this.workOrdersService.findByVehicle(vehicleId, req.user.id);
  }

  @Get(':id/pdf-data')
  async getPdfData(@Param('id') id: string, @Request() req: any) {
    const workOrder = await this.workOrdersService.findOne(id, req.user.id);
    const settings = await this.pdfService.getSettings(req.user.id);
    return {
      workOrder,
      settings,
    };
  }

  // ===== INTAKE FORM ENDPOINTS =====

  @Get(':workOrderId/intake-form')
  async getIntakeForm(@Param('workOrderId') workOrderId: string, @Request() req: any) {
    try {
      console.log('🔍 Getting intake form for work order:', workOrderId);
      // Verify ownership first
      await this.workOrdersService.findOne(workOrderId, req.user.id);
      const result = await this.intakeFormService.findByWorkOrderId(workOrderId);
      console.log('✅ Found intake form:', result);
      return result;
    } catch (error) {
      console.error('❌ Error getting intake form:', error);
      throw error;
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.workOrdersService.findOne(id, req.user.id);
  }

  @Post(':id/items')
  addItem(@Param('id') id: string, @Body() dto: AddItemDto, @Request() req: any) {
    if (!req.user?.id) {
      throw new BadRequestException('User not authenticated');
    }
    // Verify ownership
    this.workOrdersService.findOne(id, req.user.id);
    return this.workOrdersService.addItem(id, dto, req.user.id);
  }

  @Delete(':id/items/:itemId')
  async removeItem(@Param('id') workOrderId: string, @Param('itemId') itemId: string, @Request() req: any) {
    if (!req.user?.id) {
      throw new BadRequestException('User not authenticated');
    }
    // Verify ownership
    await this.workOrdersService.findOne(workOrderId, req.user.id);
    return this.workOrdersService.removeItem(workOrderId, itemId, req.user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: { tax_rate?: number; delivery_status?: string }, @Request() req: any) {
    return this.workOrdersService.update(id, dto, req.user.id);
  }

  @Post(':workOrderId/intake-form')
  async createIntakeForm(@Param('workOrderId') workOrderId: string, @Body() dto: CreateIntakeFormDto) {
    return this.intakeFormService.create({ ...dto, work_order_id: workOrderId });
  }

  @Patch('intake-form/:intakeFormId')
  async updateIntakeForm(@Param('intakeFormId') intakeFormId: string, @Body() dto: UpdateIntakeFormDto) {
    return this.intakeFormService.update(intakeFormId, dto);
  }

  @Delete('intake-form/:intakeFormId')
  async deleteIntakeForm(@Param('intakeFormId') intakeFormId: string) {
    await this.intakeFormService.delete(intakeFormId);
    return { message: 'Intake form deleted' };
  }
}
