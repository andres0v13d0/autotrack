import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './setting.entity';
import { UpdateSettingDto } from './dto/update-setting.dto';

@Injectable()
export class SettingsService {
  private readonly SINGLETON_ID = '00000000-0000-0000-0000-000000000000';

  constructor(
    @InjectRepository(Setting)
    private settingsRepo: Repository<Setting>,
  ) {}

  async getSettings(): Promise<Setting> {
    let setting = await this.settingsRepo.findOne({
      where: { id: this.SINGLETON_ID },
    });

    if (!setting) {
      setting = this.settingsRepo.create({
        id: this.SINGLETON_ID,
        tax_rate: 0.0875,
        shop_name: 'AutoTrack Shop',
        shop_address: '',
        shop_phone: '',
      });
      await this.settingsRepo.save(setting);
    }

    return setting;
  }

  async updateSettings(dto: UpdateSettingDto): Promise<Setting> {
    let setting = await this.getSettings();
    
    if (dto.tax_rate !== undefined) setting.tax_rate = dto.tax_rate;
    if (dto.shop_name !== undefined) setting.shop_name = dto.shop_name;
    if (dto.shop_address !== undefined) setting.shop_address = dto.shop_address;
    if (dto.shop_phone !== undefined) setting.shop_phone = dto.shop_phone;

    return this.settingsRepo.save(setting);
  }
}
