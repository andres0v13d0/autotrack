import { IsUUID, IsNumber, IsPositive, IsEnum, IsDateString } from 'class-validator';
import type { PaymentMethod } from '../payment.entity';

export class CreatePaymentDto {
  @IsUUID()
  work_order_id: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsEnum(['cash', 'card', 'check', 'other'])
  method: PaymentMethod;

  @IsDateString()
  date: string;
}
