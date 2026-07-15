import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('dashboard-summary')
  async getDashboardSummary(@Request() req: any) {
    return this.reportsService.getDashboardSummary(req.user.id);
  }

  @Get('monthly-revenue')
  async getMonthlyRevenue(
    @Query('year') year: number = new Date().getFullYear(),
    @Request() req: any,
  ) {
    return this.reportsService.getMonthlyRevenue(req.user.id, year);
  }

  @Get('daily-revenue')
  async getDailyRevenue(
    @Query('month') month: string,
    @Request() req: any,
  ) {
    return this.reportsService.getDailyRevenue(req.user.id, month);
  }

  @Get('work-orders-status')
  async getWorkOrdersStatus(@Request() req: any) {
    return this.reportsService.getWorkOrdersStatus(req.user.id);
  }

  @Get('top-customers')
  async getTopCustomers(@Request() req: any) {
    return this.reportsService.getTopCustomers(req.user.id);
  }

  @Get('payment-methods')
  async getPaymentMethodsBreakdown(@Request() req: any) {
    return this.reportsService.getPaymentMethodsBreakdown(req.user.id);
  }
}
