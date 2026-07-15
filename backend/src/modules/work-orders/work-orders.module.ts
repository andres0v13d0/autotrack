import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkOrder } from './work-order.entity';
import { WorkOrderItem } from './work-order-item.entity';
import { IntakeForm } from './intake-form.entity';
import { WorkOrdersService } from './work-orders.service';
import { IntakeFormService } from './intake-form.service';
import { WorkOrdersController } from './work-orders.controller';
import { PdfService } from './pdf.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [TypeOrmModule.forFeature([WorkOrder, WorkOrderItem, IntakeForm]), SettingsModule],
  providers: [WorkOrdersService, IntakeFormService, PdfService],
  controllers: [WorkOrdersController],
  exports: [WorkOrdersService, IntakeFormService],
})
export class WorkOrdersModule {}
