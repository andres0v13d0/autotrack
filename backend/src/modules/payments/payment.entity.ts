import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { WorkOrder } from '../work-orders/work-order.entity';
import { User } from '../users/user.entity';

export type PaymentMethod = 'cash' | 'card' | 'zelle' | 'check' | 'other';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => WorkOrder, (order) => order.payments, { onDelete: 'CASCADE' })
  work_order: WorkOrder;

  @Column('uuid')
  work_order_id: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column('enum', { enum: ['cash', 'card', 'zelle', 'check', 'other'] })
  method: PaymentMethod;

  @Column('date')
  date: Date;

  @ManyToOne(() => User)
  created_by: User;

  @Column('uuid')
  created_by_id: string;

  @CreateDateColumn()
  created_at: Date;
}
