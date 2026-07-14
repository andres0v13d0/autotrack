import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('settings')
export class Setting {
  @PrimaryColumn('uuid')
  id: string = '00000000-0000-0000-0000-000000000000'; // singleton

  @Column('decimal', { precision: 5, scale: 4, default: 0.0875 })
  tax_rate: number;

  @Column('varchar', { length: 255, default: 'AutoTrack Shop' })
  shop_name: string;

  @Column('varchar', { length: 500, default: '' })
  shop_address: string;

  @Column('varchar', { length: 20, default: '' })
  shop_phone: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
