import { Controller, Get, Patch, Body, UseGuards, Post, UseInterceptors, UploadedFile, Request } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SettingsService } from './settings.service';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get()
  @Roles('admin', 'front_desk', 'technician')
  getSettings(@Request() req: any) {
    return this.settingsService.getSettings(req.user.id);
  }

  @Patch()
  @Roles('admin', 'front_desk', 'technician')
  updateSettings(@Request() req: any, @Body() dto: UpdateSettingDto) {
    return this.settingsService.updateSettings(req.user.id, dto);
  }

  @Post('upload-logo')
  @UseInterceptors(FileInterceptor('file'))
  async uploadLogo(@Request() req: any, @UploadedFile() file: any) {
    if (!file) {
      return { error: 'No file provided' };
    }
    
    // Convert file to base64
    const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    
    // Update settings with logo
    const updated = await this.settingsService.updateSettings(req.user.id, {
      shop_logo_url: base64,
    });
    
    return { url: updated.shop_logo_url };
  }
}
