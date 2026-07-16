import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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

    // Check if vehicle already has an open work order (new or in_progress)
    const openOrder = await this.workOrdersRepo.findOne({
      where: {
        vehicle_id: dto.vehicle_id,
        delivery_status: 'new',
      },
    });

    if (openOrder) {
      throw new BadRequestException(`Vehicle already has an open work order #${openOrder.order_number}. Add items to the existing order or mark it ready/picked up before creating a new one.`);
    }

    const inProgressOrder = await this.workOrdersRepo.findOne({
      where: {
        vehicle_id: dto.vehicle_id,
        delivery_status: 'in_progress',
      },
    });

    if (inProgressOrder) {
      throw new BadRequestException(`Vehicle already has a work order in progress #${inProgressOrder.order_number}. Add items to the existing order or mark it ready/picked up before creating a new one.`);
    }

    // Generate order_number: find the max order_number for this user and increment
    const maxOrder = await this.workOrdersRepo
      .createQueryBuilder('wo')
      .select('MAX(wo.order_number)', 'max_order')
      .where('wo.created_by_id = :userId', { userId })
      .getRawOne();
    
    const maxOrderNumber = maxOrder?.max_order ? parseInt(maxOrder.max_order) : 1000;
    const orderNumber = maxOrderNumber + 1;

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

  async findAll(userId?: string): Promise<WorkOrder[]> {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    
    return this.workOrdersRepo.createQueryBuilder('wo')
      .leftJoinAndSelect('wo.items', 'items')
      .leftJoinAndSelect('wo.vehicle', 'vehicle')
      .leftJoinAndSelect('vehicle.customer', 'customer')
      .leftJoinAndSelect('wo.intakeForm', 'intakeForm')
      .where('wo.created_by_id = :userId', { userId })
      .orderBy('wo.created_at', 'DESC')
      .getMany();
  }

  async findByVehicle(vehicleId: string, userId?: string): Promise<WorkOrder[]> {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    
    return this.workOrdersRepo.createQueryBuilder('wo')
      .where('wo.vehicle_id = :vehicleId', { vehicleId })
      .andWhere('wo.created_by_id = :userId', { userId })
      .leftJoinAndSelect('wo.items', 'items')
      .leftJoinAndSelect('wo.vehicle', 'vehicle')
      .leftJoinAndSelect('vehicle.customer', 'customer')
      .orderBy('wo.created_at', 'DESC')
      .getMany();
  }

  async findOne(id: string, userId?: string): Promise<WorkOrder> {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    
    const order = await this.workOrdersRepo.createQueryBuilder('wo')
      .where('wo.id = :id', { id })
      .andWhere('wo.created_by_id = :userId', { userId })
      .leftJoinAndSelect('wo.items', 'items')
      .leftJoinAndSelect('wo.vehicle', 'vehicle')
      .leftJoinAndSelect('vehicle.customer', 'customer')
      .leftJoinAndSelect('wo.created_by', 'created_by')
      .getOne();

    if (!order) {
      throw new NotFoundException(`Work order ${id} not found`);
    }

    return order;
  }

  async addItem(workOrderId: string, dto: AddItemDto, userId?: string): Promise<WorkOrder> {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    const order = await this.findOne(workOrderId, userId);

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
    return this.recalculateOrder(workOrderId, userId);
  }

  async removeItem(workOrderId: string, itemId: string, userId?: string): Promise<WorkOrder> {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    await this.findOne(workOrderId, userId);

    const item = await this.itemsRepo.findOne({ where: { id: itemId } });
    if (!item) {
      throw new NotFoundException(`Item ${itemId} not found`);
    }

    await this.itemsRepo.remove(item);

    // Recalculate order totals
    return this.recalculateOrder(workOrderId, userId);
  }

  async update(id: string, dto: { tax_rate?: number; delivery_status?: string; description_needed?: string }, userId?: string): Promise<WorkOrder> {
    const order = await this.findOne(id, userId);

    if (dto.tax_rate !== undefined) {
      order.tax_rate = dto.tax_rate;
      // Recalculate tax and total with new tax rate
      return this.recalculateOrder(id, userId);
    }

    if (dto.delivery_status !== undefined) {
      order.delivery_status = dto.delivery_status as any;
    }

    if (dto.description_needed !== undefined) {
      order.description_needed = dto.description_needed;
    }

    await this.workOrdersRepo.save(order);

    return this.findOne(id, userId);
  }

  private async recalculateOrder(workOrderId: string, userId?: string): Promise<WorkOrder> {
    console.log('🔄 Recalculating order:', workOrderId);
    
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    
    const order = await this.workOrdersRepo.findOne({
      where: { id: workOrderId, created_by_id: userId },
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
    return this.findOne(workOrderId, userId);
  }
}
