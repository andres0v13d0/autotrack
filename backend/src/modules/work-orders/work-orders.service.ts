import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { WorkOrder } from './work-order.entity';
import { WorkOrderItem } from './work-order-item.entity';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { AddItemDto } from './dto/add-item.dto';

@Injectable()
export class WorkOrdersService {
  constructor(
    @InjectRepository(WorkOrder)
    private workOrdersRepo: Repository<WorkOrder>,
    @InjectRepository(WorkOrderItem)
    private itemsRepo: Repository<WorkOrderItem>,
    private configService: ConfigService,
  ) {}

  async create(dto: CreateWorkOrderDto, userId: string): Promise<WorkOrder> {
    const taxRate = this.configService.get<number>('TAX_RATE', 0.0875);

    const workOrder = this.workOrdersRepo.create({
      vehicle_id: dto.vehicle_id,
      description_needed: dto.description_needed,
      subtotal: 0,
      tax_rate: taxRate,
      tax: 0,
      total: 0,
      created_by_id: userId,
    });

    return this.workOrdersRepo.save(workOrder);
  }

  async findAll(): Promise<WorkOrder[]> {
    return this.workOrdersRepo.find({
      relations: {
        items: true,
        vehicle: true,
      },
      order: { created_at: 'DESC' },
    });
  }

  async findByVehicle(vehicleId: string): Promise<WorkOrder[]> {
    return this.workOrdersRepo.find({
      where: { vehicle_id: vehicleId },
      relations: {
        items: true,
      },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<WorkOrder> {
    const order = await this.workOrdersRepo.findOne({
      where: { id },
      relations: {
        items: true,
        vehicle: true,
        created_by: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Work order ${id} not found`);
    }

    return order;
  }

  async addItem(workOrderId: string, dto: AddItemDto): Promise<WorkOrder> {
    await this.findOne(workOrderId);

    const item = this.itemsRepo.create({
      work_order_id: workOrderId,
      type: dto.type,
      name: dto.name,
      price: dto.price,
      qty: dto.qty,
    });

    await this.itemsRepo.save(item);

    // Recalculate order totals
    return this.recalculateOrder(workOrderId);
  }

  async removeItem(workOrderId: string, itemId: string): Promise<WorkOrder> {
    await this.findOne(workOrderId);

    const item = await this.itemsRepo.findOne({ where: { id: itemId } });
    if (!item) {
      throw new NotFoundException(`Item ${itemId} not found`);
    }

    await this.itemsRepo.remove(item);

    // Recalculate order totals
    return this.recalculateOrder(workOrderId);
  }

  private async recalculateOrder(workOrderId: string): Promise<WorkOrder> {
    const order = await this.workOrdersRepo.findOne({
      where: { id: workOrderId },
      relations: {
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Work order ${workOrderId} not found`);
    }

    const subtotal = parseFloat(
      order.items.reduce((sum, item) => sum + item.price * item.qty, 0).toFixed(2),
    );

    const tax = parseFloat((subtotal * order.tax_rate).toFixed(2));
    const total = parseFloat((subtotal + tax).toFixed(2));

    order.subtotal = subtotal;
    order.tax = tax;
    order.total = total;

    return this.workOrdersRepo.save(order);
  }
}
