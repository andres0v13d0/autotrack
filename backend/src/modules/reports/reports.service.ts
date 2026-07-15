import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkOrder } from '../work-orders/work-order.entity';
import { Payment } from '../payments/payment.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(WorkOrder)
    private workOrderRepo: Repository<WorkOrder>,
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
  ) {}

  async getDashboardSummary(userId: string) {
    // Total orders created by this user
    const totalOrders = await this.workOrderRepo
      .createQueryBuilder('workOrder')
      .where('workOrder.created_by_id = :userId', { userId })
      .getCount();

    // Total revenue (sum of all payments for orders created by this user)
    const revenueResult = await this.paymentRepo
      .createQueryBuilder('payment')
      .leftJoin('payment.work_order', 'workOrder')
      .where('workOrder.created_by_id = :userId', { userId })
      .select('SUM(CAST(payment.amount AS FLOAT))', 'total')
      .getRawOne();
    const totalRevenue = parseFloat(revenueResult?.total || 0);

    // Pending orders (new status)
    const pendingOrders = await this.workOrderRepo
      .createQueryBuilder('workOrder')
      .where('workOrder.created_by_id = :userId', { userId })
      .andWhere('workOrder.delivery_status = :status', { status: 'new' })
      .getCount();

    // Total unique customers
    const totalCustomers = await this.workOrderRepo
      .createQueryBuilder('workOrder')
      .leftJoin('workOrder.vehicle', 'vehicle')
      .leftJoin('vehicle.customer', 'customer')
      .where('workOrder.created_by_id = :userId', { userId })
      .select('COUNT(DISTINCT customer.id)', 'count')
      .getRawOne();

    // Orders this month
    const currentMonth = new Date();
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    const ordersThisMonth = await this.workOrderRepo
      .createQueryBuilder('workOrder')
      .where('workOrder.created_by_id = :userId', { userId })
      .andWhere('workOrder.created_at >= :firstDay', { firstDay })
      .andWhere('workOrder.created_at <= :lastDay', { lastDay })
      .getCount();

    return {
      totalOrders,
      totalRevenue: totalRevenue.toFixed(2),
      pendingOrders,
      totalCustomers: parseInt(totalCustomers?.count || 0),
      ordersThisMonth,
    };
  }

  async getMonthlyRevenue(userId: string, year: number) {
    const monthlyData: Array<{ month: string; revenue: number }> = [];

    for (let month = 0; month < 12; month++) {
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      const revenueResult = await this.paymentRepo
        .createQueryBuilder('payment')
        .leftJoin('payment.work_order', 'workOrder')
        .where('workOrder.created_by_id = :userId', { userId })
        .andWhere('payment.created_at >= :firstDay', { firstDay })
        .andWhere('payment.created_at <= :lastDay', { lastDay })
        .select('SUM(CAST(payment.amount AS FLOAT))', 'total')
        .getRawOne();

      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];

      monthlyData.push({
        month: monthNames[month],
        revenue: parseFloat(revenueResult?.total || 0),
      });
    }

    return monthlyData;
  }

  async getDailyRevenue(userId: string, month: string) {
    // Parse month string "2025-01"
    const [year, monthNum] = month.split('-').map(Number);
    const firstDay = new Date(year, monthNum - 1, 1);
    const lastDay = new Date(year, monthNum, 0);

    const dailyData = await this.paymentRepo
      .createQueryBuilder('payment')
      .leftJoin('payment.work_order', 'workOrder')
      .where('workOrder.created_by_id = :userId', { userId })
      .andWhere('payment.created_at >= :firstDay', { firstDay })
      .andWhere('payment.created_at <= :lastDay', { lastDay })
      .select('DATE(payment.created_at)', 'date')
      .addSelect('SUM(CAST(payment.amount AS FLOAT))', 'revenue')
      .addSelect('COUNT(DISTINCT workOrder.id)', 'orders_count')
      .groupBy('DATE(payment.created_at)')
      .orderBy('DATE(payment.created_at)', 'ASC')
      .getRawMany();

    return dailyData.map((d) => ({
      date: d.date,
      revenue: parseFloat(d.revenue || 0),
      orders_count: parseInt(d.orders_count || 0),
    }));
  }

  async getWorkOrdersStatus(userId: string) {
    const statuses = ['new', 'in_progress', 'ready', 'delivered'];
    const statusData: Array<{ status: string; count: number }> = [];

    for (const status of statuses) {
      const count = await this.workOrderRepo
        .createQueryBuilder('workOrder')
        .where('workOrder.created_by_id = :userId', { userId })
        .andWhere('workOrder.delivery_status = :status', { status })
        .getCount();

      const statusLabels: Record<string, string> = {
        new: 'New',
        in_progress: 'In Progress',
        ready: 'Ready',
        delivered: 'Delivered',
      };

      statusData.push({
        status: statusLabels[status],
        count,
      });
    }

    return statusData;
  }

  async getTopCustomers(userId: string, limit: number = 5) {
    const topCustomers = await this.paymentRepo
      .createQueryBuilder('payment')
      .leftJoin('payment.work_order', 'workOrder')
      .leftJoin('workOrder.vehicle', 'vehicle')
      .leftJoin('vehicle.customer', 'customer')
      .where('workOrder.created_by_id = :userId', { userId })
      .select('customer.name', 'name')
      .addSelect('COUNT(DISTINCT workOrder.id)', 'order_count')
      .addSelect('SUM(CAST(payment.amount AS FLOAT))', 'total_spent')
      .groupBy('customer.id')
      .orderBy('total_spent', 'DESC')
      .limit(limit)
      .getRawMany();

    return topCustomers.map((c) => ({
      name: c.name,
      orderCount: parseInt(c.order_count || 0),
      totalSpent: parseFloat(c.total_spent || 0),
    }));
  }

  async getPaymentMethodsBreakdown(userId: string) {
    const methods = ['cash', 'card', 'zelle', 'check'];
    const methodData: Array<{ method: string; amount: number }> = [];

    for (const method of methods) {
      const result = await this.paymentRepo
        .createQueryBuilder('payment')
        .leftJoin('payment.work_order', 'workOrder')
        .where('workOrder.created_by_id = :userId', { userId })
        .andWhere('payment.method = :method', { method })
        .select('SUM(CAST(payment.amount AS FLOAT))', 'total')
        .getRawOne();

      const methodLabels: Record<string, string> = {
        cash: 'Cash',
        card: 'Card',
        zelle: 'Zelle',
        check: 'Check',
      };

      methodData.push({
        method: methodLabels[method],
        amount: parseFloat(result?.total || 0),
      });
    }

    return methodData;
  }
}
