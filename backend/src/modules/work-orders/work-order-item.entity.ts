import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { WorkOrder } from './work-order.entity';

export type WorkOrderItemType = 'part' | 'labor';

@Entity('work_order_items')
export class WorkOrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => WorkOrder, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'work_order_id' })
  work_order: WorkOrder;

  work_order_id: string;  // FK creada automáticamente por @ManyToOne/@JoinColumn

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
