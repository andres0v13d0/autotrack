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

    // Generate order_number: find the max and increment
    const lastOrder = await this.workOrdersRepo
      .createQueryBuilder('wo')
      .orderBy('wo.order_number', 'DESC')
      .limit(1)
      .getOne();
    
    const orderNumber = (lastOrder?.order_number || 1000) + 1;

    const workOrder = this.workOrdersRepo.create({
      vehicle_id: dto.vehicle_id,
      description_needed: dto.description_needed,
      subtotal: 0,
      tax_rate: taxRate,
      tax: 0,
      total: 0,
      delivery_status: 'new',
      order_number: orderNumber,
      created_by_id: userId,
    });

    const saved = await this.workOrdersRepo.save(workOrder);
    
    // Reload with relations
    const reloaded = await this.workOrdersRepo.findOne({
      where: { id: saved.id },
      relations: {
        items: true,
        vehicle: {
          customer: true,
        },
      },
    });
    
    if (!reloaded) {
      throw new NotFoundException(`Work order ${saved.id} not found after creation`);
    }
    
    return reloaded;
  }

  async findAll(): Promise<WorkOrder[]> {
    return this.workOrdersRepo.find({
      relations: {
        items: true,
        vehicle: {
          customer: true,
        },
      },
      order: { created_at: 'DESC' },
    });
  }

  async findByVehicle(vehicleId: string): Promise<WorkOrder[]> {
    return this.workOrdersRepo.find({
      where: { vehicle_id: vehicleId },
      relations: {
        items: true,
        vehicle: {
          customer: true,
        },
      },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<WorkOrder> {
    const order = await this.workOrdersRepo.findOne({
      where: { id },
      relations: {
        items: true,
        vehicle: {
          customer: true,
        },
        created_by: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Work order ${id} not found`);
    }

    return order;
  }

  async addItem(workOrderId: string, dto: AddItemDto): Promise<WorkOrder> {
    const order = await this.findOne(workOrderId);

    const item = this.itemsRepo.create({
      work_order_id: workOrderId,
      name: dto.name,
      price: dto.price,
      qty: dto.qty,
    });

    const savedItem = await this.itemsRepo.save(item);
    console.log('✅ Item saved:', savedItem);
    
    // Verify the item was saved with correct work_order_id
    const verifyItem = await this.itemsRepo.findOne({
      where: { id: savedItem.id }
    });
    console.log('🔍 Verified item:', verifyItem);

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
    console.log('🔄 Recalculating order:', workOrderId);
    
    const order = await this.workOrdersRepo.findOne({
      where: { id: workOrderId },
      relations: {
        items: true,
      },
    });

    console.log('📦 Order items loaded:', order?.items?.length || 0, 'items');

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

    await this.workOrdersRepo.save(order);
    
    // Return with relations
    const reloaded = await this.workOrdersRepo.findOne({
      where: { id: workOrderId },
      relations: {
        items: true,
        vehicle: {
          customer: true,
        },
      },
    });

    console.log('✅ Final order returned with', reloaded?.items?.length || 0, 'items');
    
    if (!reloaded) {
      throw new NotFoundException(`Work order ${workOrderId} not found after recalculation`);
    }
    
    return reloaded;
  }
}
