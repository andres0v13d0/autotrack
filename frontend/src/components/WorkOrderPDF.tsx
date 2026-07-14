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
    padding: 50,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 3,
    borderBottomColor: colors.secondary,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  shopInfo: {
    flex: 1,
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 12,
    borderRadius: 6,
  },
  shopName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  shopSlogan: {
    fontSize: 11,
    color: colors.secondary,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  shopAddress: {
    fontSize: 10,
    color: colors.lightText,
    marginBottom: 4,
    lineHeight: 1.4,
  },
  shopPhone: {
    fontSize: 10,
    color: colors.lightText,
    marginBottom: 4,
  },
  orderNumberBadge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    textAlign: 'center',
  },
  orderNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  orderNumberLabel: {
    fontSize: 9,
    color: '#ffffff',
    marginTop: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionGrid: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 25,
  },
  gridCol: {
    flex: 1,
  },
  gridColLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.primary,
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 1,
  },
  gridColValue: {
    fontSize: 11,
    color: colors.text,
    lineHeight: 1.5,
  },
  vehicleInfo: {
    backgroundColor: colors.lightBg,
    padding: 15,
    borderRadius: 6,
    marginBottom: 20,
  },
  vehicleItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  vehicleLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.primary,
    width: 70,
  },
  vehicleValue: {
    fontSize: 10,
    color: colors.text,
  },
  table: {
    width: '100%',
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 1,
  },
  tableHeaderCell: {
    fontSize: 10,
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableRowEven: {
    backgroundColor: colors.lightBg,
  },
  tableCell: {
    fontSize: 9,
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
    padding: 20,
    borderRadius: 6,
    marginTop: 20,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 10,
    color: colors.lightText,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 10,
    color: colors.text,
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 2,
    borderTopColor: colors.secondary,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.secondary,
  },
  footer: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    textAlign: 'center',
    fontSize: 8,
    color: colors.lightText,
  },
  descriptionBox: {
    backgroundColor: colors.lightBg,
    padding: 12,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    marginBottom: 20,
  },
  descriptionLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 6,
  },
  descriptionText: {
    fontSize: 9,
    color: colors.text,
    lineHeight: 1.5,
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
          <View style={styles.headerContent}>
            <View style={styles.shopInfo}>
              {settings.shop_logo_url && (
                <Image
                  src={settings.shop_logo_url}
                  style={styles.logo}
                />
              )}
              <Text style={styles.shopName}>{settings.shop_name || 'AutoTrack Shop'}</Text>
              {settings.shop_slogan && (
                <Text style={styles.shopSlogan}>{settings.shop_slogan}</Text>
              )}
              {settings.shop_address && (
                <Text style={styles.shopAddress}>{settings.shop_address}</Text>
              )}
              {settings.shop_phone && (
                <Text style={styles.shopPhone}>{settings.shop_phone}</Text>
              )}
              {settings.shop_email && (
                <Text style={styles.shopPhone}>{settings.shop_email}</Text>
              )}
            </View>
            <View style={styles.orderNumberBadge}>
              <Text style={styles.orderNumber}>
                #{workOrder.order_number || workOrder.id.slice(0, 8)}
              </Text>
              <Text style={styles.orderNumberLabel}>WORK ORDER</Text>
            </View>
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
          <View style={styles.gridCol}>
            <Text style={styles.gridColLabel}>Tax Rate</Text>
            <Text style={styles.gridColValue}>{(taxRate * 100).toFixed(2)}%</Text>
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
            <Text style={styles.summaryLabel}>
              Tax ({(taxRate * 100).toFixed(2)}%)
            </Text>
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
