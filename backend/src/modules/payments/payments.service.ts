import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './payment.entity';
import { WorkOrder } from '../work-orders/work-order.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';

export interface OrderBalance {
  workOrderId: string;
  total: number;
  amountPaid: number;
  balanceDue: number;
  paymentStatus: 'pending' | 'partial' | 'paid';
}

export interface CustomerDebt {
  customerId: string;
  totalDebt: number;
  totalPaid: number;
  workOrdersWithDebt: OrderBalance[];
}

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentsRepo: Repository<Payment>,
    @InjectRepository(WorkOrder)
    private workOrdersRepo: Repository<WorkOrder>,
  ) {}

  async create(dto: CreatePaymentDto, userId: string): Promise<Payment> {
    // Verify work order exists
    const workOrder = await this.workOrdersRepo.findOne({
      where: { id: dto.work_order_id },
    });

    if (!workOrder) {
      throw new NotFoundException(`Work order ${dto.work_order_id} not found`);
    }

    const payment = this.paymentsRepo.create({
      work_order_id: dto.work_order_id,
      amount: dto.amount,
      method: dto.method,
      date: new Date(dto.date),
      created_by_id: userId,
    });

    return this.paymentsRepo.save(payment);
  }

  async getByWorkOrder(workOrderId: string): Promise<Payment[]> {
    return this.paymentsRepo.find({
      where: { work_order_id: workOrderId },
      order: { date: 'DESC' },
    });
  }

  async getOrderBalance(workOrderId: string): Promise<OrderBalance> {
    const workOrder = await this.workOrdersRepo.findOne({
      where: { id: workOrderId },
    });

    if (!workOrder) {
      throw new NotFoundException(`Work order ${workOrderId} not found`);
    }

    const payments = await this.getByWorkOrder(workOrderId);
    const amountPaid = parseFloat(
      payments.reduce((sum, p) => sum + Number(p.amount), 0).toFixed(2),
    );

    const balanceDue = parseFloat((workOrder.total - amountPaid).toFixed(2));

    let paymentStatus: 'pending' | 'partial' | 'paid' = 'pending';
    if (amountPaid > 0 && balanceDue > 0) paymentStatus = 'partial';
    else if (balanceDue <= 0) paymentStatus = 'paid';

    return {
      workOrderId,
      total: Number(workOrder.total),
      amountPaid,
      balanceDue,
      paymentStatus,
    };
  }

  async getCustomerDebt(customerId: string): Promise<CustomerDebt> {
    // Get all work orders for customer's vehicles
    const workOrders = await this.workOrdersRepo
      .createQueryBuilder('wo')
      .innerJoin('wo.vehicle', 'v')
      .where('v.customer_id = :customerId', { customerId })
      .getMany();

    let totalDebt = 0;
    let totalPaid = 0;
    const workOrdersWithDebt: OrderBalance[] = [];

    for (const order of workOrders) {
      const balance = await this.getOrderBalance(order.id);
      totalDebt += balance.balanceDue;
      totalPaid += balance.amountPaid;

      if (balance.balanceDue > 0) {
        workOrdersWithDebt.push(balance);
      }
    }

    return {
      customerId,
      totalDebt: parseFloat(totalDebt.toFixed(2)),
      totalPaid: parseFloat(totalPaid.toFixed(2)),
      workOrdersWithDebt,
    };
  }

  async deletePayment(paymentId: string): Promise<void> {
    const result = await this.paymentsRepo.delete(paymentId);
    if (result.affected === 0) {
      throw new NotFoundException(`Payment ${paymentId} not found`);
    }
  }
}
