import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { WorkOrder } from './work-order.entity';

export type WorkOrderItemType = 'part' | 'labor';

@Entity('work_order_items')
export class WorkOrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => WorkOrder, (order) => order.items, { onDelete: 'CASCADE' })
  work_order: WorkOrder;

  @Column('uuid')
  work_order_id: string;

  @Column('enum', { enum: ['part', 'labor'] })
  type: WorkOrderItemType;

  @Column()
  name: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column('int', { default: 1 })
  qty: number;

  @CreateDateColumn()
  created_at: Date;
}
