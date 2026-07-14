import { Injectable } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class PdfService {
  constructor(private settingsService: SettingsService) {}

  async getSettings(userId: string) {
    return this.settingsService.getSettings(userId);
  }
}
