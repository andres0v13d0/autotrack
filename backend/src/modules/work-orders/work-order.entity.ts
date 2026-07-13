import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  ForeignKey,
} from 'typeorm';
import { Vehicle } from '../vehicles/vehicle.entity';
import { User } from '../users/user.entity';
import { WorkOrderItem } from './work-order-item.entity';
import { Payment } from '../payments/payment.entity';

@Entity('work_orders')
export class WorkOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.workOrders)
  vehicle: Vehicle;

  @Column('uuid')
  vehicle_id: string;

  @Column()
  description_needed: string;

  @Column('decimal', { precision: 10, scale: 2 })
  subtotal: number;

  @Column('decimal', { precision: 5, scale: 4 })
  tax_rate: number;

  @Column('decimal', { precision: 10, scale: 2 })
  tax: number;

  @Column('decimal', { precision: 10, scale: 2 })
  total: number;

  @ManyToOne(() => User)
  created_by: User;

  @Column('uuid')
  created_by_id: string;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => WorkOrderItem, (item) => item.work_order, { eager: true })
  items: WorkOrderItem[];

  @OneToMany(() => Payment, (payment) => payment.work_order)
  payments: Payment[];
}
