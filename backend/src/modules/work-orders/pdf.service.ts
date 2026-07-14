import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { Readable } from 'stream';
import { WorkOrder } from './work-order.entity';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class PdfService {
  constructor(private settingsService: SettingsService) {}

  async generateWorkOrderPdf(workOrder: WorkOrder): Promise<Readable> {
    const settings = await this.settingsService.getSettings();

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      let buffers: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => {
        const pdf = Buffer.concat(buffers);
        resolve(Readable.from(pdf));
      });
      doc.on('error', reject);

      // Header
      doc.fontSize(20).font('Helvetica-Bold').text(settings.shop_name, { align: 'center' });
      doc.fontSize(10).font('Helvetica').text(settings.shop_address, { align: 'center' });
      doc.text(settings.shop_phone, { align: 'center' });
      doc.moveDown(0.5);

      // Title
      doc.fontSize(14).font('Helvetica-Bold').text('WORK ORDER', { align: 'center' });
      doc.moveDown(0.5);

      // Order info
      doc.fontSize(9).font('Helvetica');
      doc.text(`Order #: ${workOrder.id.slice(0, 8)}`, { width: 250 });
      doc.text(`Date: ${new Date(workOrder.created_at).toLocaleDateString()}`);
      doc.moveDown(0.3);

      // Vehicle info (if available)
      if (workOrder.vehicle) {
        doc.text(`Vehicle: ${workOrder.vehicle.plate} - ${workOrder.vehicle.model}`);
      }

      if (workOrder.description_needed) {
        doc.text(`Description: ${workOrder.description_needed}`);
      }
      doc.moveDown(0.5);

      // Items table
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Item', 30);
      doc.text('Price', 300, doc.y - 15);
      doc.text('Qty', 380, doc.y);
      doc.text('Total', 450, doc.y);
      doc.moveTo(30, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.3);

      doc.font('Helvetica').fontSize(9);
      workOrder.items.forEach((item) => {
        const itemTotal = item.price * item.qty;
        const startY = doc.y;
        doc.text(item.name.substring(0, 30), 30, startY, { width: 250 });
        doc.text(`$${item.price.toFixed(2)}`, 300, startY);
        doc.text(item.qty.toString(), 380, startY);
        doc.text(`$${itemTotal.toFixed(2)}`, 450, startY);
        doc.moveDown(0.3);
      });

      doc.moveTo(30, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.3);

      // Totals
      doc.font('Helvetica-Bold').fontSize(10);
      doc.text('Subtotal:', 350);
      doc.text(`$${workOrder.subtotal.toFixed(2)}`, 450, doc.y - 15);
      doc.moveDown(0.3);

      doc.text(`Tax (${(workOrder.tax_rate * 100).toFixed(2)}%):`, 350);
      doc.text(`$${workOrder.tax.toFixed(2)}`, 450, doc.y - 15);
      doc.moveDown(0.3);

      doc.fontSize(11).text('TOTAL:', 350);
      doc.text(`$${workOrder.total.toFixed(2)}`, 450, doc.y - 15);

      doc.end();
    });
  }
}
