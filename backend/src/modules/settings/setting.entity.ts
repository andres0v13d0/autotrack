import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('settings')
export class Setting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.settings, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column('uuid', { nullable: true })
  user_id: string;

  @Column('decimal', { precision: 5, scale: 4, default: 0.0875 })
  tax_rate: number;

  @Column('varchar', { length: 255, default: 'AutoTrack Shop' })
  shop_name: string;

  @Column('varchar', { length: 500, default: '' })
  shop_address: string;

  @Column('varchar', { length: 20, default: '' })
  shop_phone: string;

  @Column('varchar', { length: 255, default: '', nullable: true })
  shop_email: string;

  @Column('varchar', { length: 500, default: '', nullable: true })
  shop_description: string;

  @Column('varchar', { length: 255, default: '', nullable: true })
  shop_slogan: string;

  @Column('text', { default: '', nullable: true })
  shop_logo_url: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
