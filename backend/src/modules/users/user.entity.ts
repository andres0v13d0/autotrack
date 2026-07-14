import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Setting } from '../settings/setting.entity';

export enum UserRole {
  ADMIN = 'admin',
  FRONT_DESK = 'front_desk',
  TECHNICIAN = 'technician',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password_hash: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.FRONT_DESK })
  role: UserRole;

  @OneToOne(() => Setting, (setting) => setting.user)
  settings: Setting;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
