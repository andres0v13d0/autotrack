import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf, Image } from '@react-pdf/renderer';
import type { WorkOrder } from '../types/workOrder';

interface WorkOrderPDFProps {
  workOrder: WorkOrder;
  settings: {
    shop_name: string;
    shop_address: string;
    shop_phone: string;
    shop_email?: string;
    shop_description?: string;
    shop_slogan?: string;
    shop_logo_url?: string;
  };
}

// Formatear teléfono en formato US: (XXX) XXX-XXXX
const formatPhoneUS = (phone: string): string => {
  // Remover caracteres no numéricos
  const cleaned = phone.replace(/\D/g, '');
  
  // Tomar últimos 10 dígitos
  const last10 = cleaned.slice(-10);
  
  if (last10.length === 10) {
    return `(${last10.slice(0, 3)}) ${last10.slice(3, 6)}-${last10.slice(6)}`;
  }
  
  return phone;
};

const colors = {
  primary: '#0f1f3d',
  secondary: '#f97316',
  accent: '#6366f1',
  success: '#10b981',
  border: '#e5e7eb',
  lightBg: '#f9fafb',
  text: '#1f2937',
  lightText: '#6b7280',
};

const styles = StyleSheet.create({
  page: {
    padding: 20,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 15,
  },
  logoBox: {
    alignItems: 'center',
    minWidth: 40,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 4,
  },
  shopInfoBox: {
    flex: 1,
    flexDirection: 'column',
  },
  shopName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 3,
  },
  shopSlogan: {
    fontSize: 7,
    color: colors.secondary,
    fontStyle: 'italic',
    marginBottom: 4,
    fontWeight: '500',
  },
  infoRow: {
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 7,
    color: colors.text,
    fontWeight: '500',
    marginTop: 0,
  },
  orderNumberBadge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    textAlign: 'center',
    minWidth: 80,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  orderNumberLabel: {
    fontSize: 7,
    color: '#ffffff',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 12,
  },
  section: {
    marginBottom: 15,
  },
  sectionGrid: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 15,
  },
  gridCol: {
    flex: 1,
  },
  gridColLabel: {
    fontSize: 7,
    fontWeight: 'bold',
    color: colors.primary,
    textTransform: 'uppercase',
    marginBottom: 3,
    letterSpacing: 0.5,
  },
  gridColValue: {
    fontSize: 9,
    color: colors.text,
    lineHeight: 1.4,
  },
  vehicleInfo: {
    backgroundColor: colors.lightBg,
    padding: 10,
    borderRadius: 4,
    marginBottom: 12,
  },
  vehicleItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  vehicleLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: colors.primary,
    width: 50,
  },
  vehicleValue: {
    fontSize: 8,
    color: colors.text,
  },
  table: {
    width: '100%',
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: 3,
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginBottom: 1,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  tableHeaderCellName: {
    flex: 2,
  },
  tableHeaderCellNumber: {
    textAlign: 'right',
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableRowEven: {
    backgroundColor: colors.lightBg,
  },
  tableCell: {
    fontSize: 8,
    color: colors.text,
    flex: 1,
  },
  tableCellName: {
    flex: 2,
  },
  tableCellNumber: {
    textAlign: 'right',
    fontWeight: '500',
  },
  summarySection: {
    backgroundColor: colors.lightBg,
    padding: 12,
    borderRadius: 4,
    marginTop: 12,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 8,
    color: colors.lightText,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 8,
    color: colors.text,
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: colors.secondary,
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.primary,
  },
  totalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.secondary,
  },
  footer: {
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    textAlign: 'center',
    fontSize: 7,
    color: colors.lightText,
  },
  descriptionBox: {
    backgroundColor: colors.lightBg,
    padding: 10,
    borderRadius: 4,
    borderLeftWidth: 2,
    borderLeftColor: colors.accent,
    marginBottom: 12,
  },
  descriptionLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 8,
    color: colors.text,
    lineHeight: 1.4,
  },
});

const WorkOrderPDFDocument: React.FC<WorkOrderPDFProps> = ({ workOrder, settings }) => {
  const subtotal = typeof workOrder.subtotal === 'string' ? parseFloat(workOrder.subtotal) : workOrder.subtotal;
  const taxRate = Number(workOrder.tax_rate);
  const calculatedTax = subtotal * taxRate;
  const total = subtotal + calculatedTax;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {/* Logo Box - Left */}
          <View style={styles.logoBox}>
            {settings.shop_logo_url ? (
              <Image
                src={settings.shop_logo_url}
                style={styles.logo}
              />
            ) : (
              <View style={{ ...styles.logo, backgroundColor: colors.lightBg, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, color: colors.lightText }}>□</Text>
              </View>
            )}
          </View>

          {/* Info Box - Center */}
          <View style={styles.shopInfoBox}>
            <Text style={styles.shopName}>{settings.shop_name || 'AutoTrack Shop'}</Text>
            {settings.shop_slogan && (
              <Text style={styles.shopSlogan}>{settings.shop_slogan}</Text>
            )}
            
            {settings.shop_address && (
              <View style={styles.infoRow}>
                <Text style={styles.infoValue}>{settings.shop_address}</Text>
              </View>
            )}
            
            {settings.shop_phone && (
              <View style={styles.infoRow}>
                <Text style={styles.infoValue}>
                  {formatPhoneUS(settings.shop_phone)}
                </Text>
              </View>
            )}
            
            {settings.shop_email && (
              <View style={styles.infoRow}>
                <Text style={styles.infoValue}>{settings.shop_email}</Text>
              </View>
            )}
          </View>

          {/* Right: Order Number Badge */}
          <View style={styles.orderNumberBadge}>
            <Text style={styles.orderNumber}>
              #{workOrder.order_number || workOrder.id.slice(0, 8)}
            </Text>
            <Text style={styles.orderNumberLabel}>WORK ORDER</Text>
          </View>
        </View>

        {/* Order Details Grid */}
        <View style={styles.sectionGrid}>
          <View style={styles.gridCol}>
            <Text style={styles.gridColLabel}>Order Date</Text>
            <Text style={styles.gridColValue}>
              {new Date(workOrder.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
          <View style={styles.gridCol}>
            <Text style={styles.gridColLabel}>Status</Text>
            <Text style={styles.gridColValue}>
              {workOrder.delivery_status.replace(/_/g, ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Vehicle Information */}
        {workOrder.vehicle && (
          <View style={styles.vehicleInfo}>
            <View style={styles.vehicleItem}>
              <Text style={styles.vehicleLabel}>Plate:</Text>
              <Text style={styles.vehicleValue}>{workOrder.vehicle.plate}</Text>
            </View>
            <View style={styles.vehicleItem}>
              <Text style={styles.vehicleLabel}>Model:</Text>
              <Text style={styles.vehicleValue}>{workOrder.vehicle.model}</Text>
            </View>
            {workOrder.vehicle.customer && (
              <View style={styles.vehicleItem}>
                <Text style={styles.vehicleLabel}>Customer:</Text>
                <Text style={styles.vehicleValue}>{workOrder.vehicle.customer.name}</Text>
              </View>
            )}
          </View>
        )}

        {/* Description */}
        {workOrder.description_needed && (
          <View style={styles.descriptionBox}>
            <Text style={styles.descriptionLabel}>Work Description</Text>
            <Text style={styles.descriptionText}>{workOrder.description_needed}</Text>
          </View>
        )}

        {/* Items Table */}
        <Text style={styles.title}>Line Items</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.tableHeaderCellName]}>Description</Text>
            <Text style={[styles.tableHeaderCell, styles.tableHeaderCellNumber]}>Unit Price</Text>
            <Text style={[styles.tableHeaderCell, styles.tableHeaderCellNumber]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, styles.tableHeaderCellNumber]}>Total</Text>
          </View>
          {workOrder.items.map((item, idx) => {
            const itemPrice = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
            const itemTotal = itemPrice * item.qty;
            const rowStyle = idx % 2 === 0 ? [styles.tableRow, styles.tableRowEven] : styles.tableRow;
            return (
              <View key={idx} style={rowStyle}>
                <Text style={[styles.tableCell, styles.tableCellName]}>
                  {item.name}
                </Text>
                <Text style={[styles.tableCell, styles.tableCellNumber]}>
                  ${itemPrice.toFixed(2)}
                </Text>
                <Text style={[styles.tableCell, styles.tableCellNumber]}>{item.qty}</Text>
                <Text style={[styles.tableCell, styles.tableCellNumber]}>
                  ${itemTotal.toFixed(2)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Summary Section */}
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax</Text>
            <Text style={styles.summaryValue}>${calculatedTax.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL DUE</Text>
            <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Thank you for your business | Generated on {new Date().toLocaleDateString()}</Text>
        </View>
      </Page>
    </Document>
  );
};

export const generateAndDownloadPdf = async (
  workOrder: WorkOrder,
  settings: any
) => {
  try {
    const fileName = `order-${workOrder.order_number || workOrder.id.slice(0, 8)}.pdf`;

    const doc = (
      <WorkOrderPDFDocument workOrder={workOrder} settings={settings} />
    );

    const blob = await pdf(doc).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

export default WorkOrderPDFDocument;
