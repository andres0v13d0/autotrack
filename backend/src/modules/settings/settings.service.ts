import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './setting.entity';
import { UpdateSettingDto } from './dto/update-setting.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private settingsRepo: Repository<Setting>,
  ) {}

  async getSettings(userId: string): Promise<Setting> {
    let setting = await this.settingsRepo.findOne({
      where: { user_id: userId },
    });

    if (!setting) {
      setting = this.settingsRepo.create({
        user_id: userId,
        tax_rate: 0.0875,
        shop_name: 'AutoTrack Shop',
        shop_address: '',
        shop_phone: '',
        shop_email: '',
        shop_description: '',
        shop_slogan: '',
        shop_logo_url: '',
      });
      await this.settingsRepo.save(setting);
    }

    return setting;
  }

  async updateSettings(userId: string, dto: UpdateSettingDto): Promise<Setting> {
    let setting = await this.getSettings(userId);
    
    if (dto.tax_rate !== undefined) setting.tax_rate = dto.tax_rate;
    if (dto.shop_name !== undefined) setting.shop_name = dto.shop_name;
    if (dto.shop_address !== undefined) setting.shop_address = dto.shop_address;
    if (dto.shop_phone !== undefined) setting.shop_phone = dto.shop_phone;
    if (dto.shop_email !== undefined) setting.shop_email = dto.shop_email;
    if (dto.shop_description !== undefined) setting.shop_description = dto.shop_description;
    if (dto.shop_slogan !== undefined) setting.shop_slogan = dto.shop_slogan;
    if (dto.shop_logo_url !== undefined) setting.shop_logo_url = dto.shop_logo_url;

    return this.settingsRepo.save(setting);
  }
}
