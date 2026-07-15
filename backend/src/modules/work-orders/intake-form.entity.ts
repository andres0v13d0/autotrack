import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { WorkOrder } from './work-order.entity';

@Entity('intake_forms')
export class IntakeForm {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => WorkOrder, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'work_order_id' })
  workOrder: WorkOrder;

  @Column('uuid')
  work_order_id: string;

  @Column()
  client_name: string;

  @Column()
  client_phone: string;

  @Column()
  vehicle_plate: string;

  @Column()
  vehicle_model: string;

  @Column({ type: 'int', nullable: true })
  mileage_in: number;

  @Column({ type: 'text', nullable: true })
  vehicle_condition: string;

  @Column({ type: 'text' })
  problem_description: string;

  @Column({ type: 'text', nullable: true })
  client_signature: string; // Base64 encoded signature

  @Column({ default: false })
  signed: boolean;

  @CreateDateColumn()
  created_at: Date;

  @Column({ nullable: true })
  signed_at: Date;
}
