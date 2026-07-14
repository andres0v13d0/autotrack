import { Injectable } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class PdfService {
  constructor(private settingsService: SettingsService) {}

  async getSettings() {
    return this.settingsService.getSettings();
  }
}
