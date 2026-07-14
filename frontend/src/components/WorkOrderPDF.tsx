import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import type { WorkOrder } from '../types/workOrder';

interface WorkOrderPDFProps {
  workOrder: WorkOrder;
  settings: {
    shop_name: string;
    shop_address: string;
    shop_phone: string;
  };
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
  },
  shopName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  shopInfo: {
    fontSize: 10,
    color: '#666',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 10,
    textAlign: 'center',
  },
  orderInfo: {
    fontSize: 9,
    marginBottom: 15,
    lineHeight: 1.5,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 5,
  },
  table: {
    width: '100%',
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 5,
    marginBottom: 5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingBottom: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  tableCell: {
    fontSize: 9,
    flex: 1,
  },
  tableCellName: {
    flex: 2,
  },
  tableCellNumber: {
    textAlign: 'right',
  },
  totalsSection: {
    width: '100%',
    marginTop: 20,
  },
  totalRow: {
    flexDirection: 'row',
    marginBottom: 5,
    justifyContent: 'flex-end',
    paddingRight: 40,
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    width: 80,
  },
  totalValue: {
    fontSize: 10,
    fontWeight: 'bold',
    width: 50,
    textAlign: 'right',
  },
  grandTotal: {
    flexDirection: 'row',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: '#000',
    justifyContent: 'flex-end',
    paddingRight: 40,
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    width: 80,
  },
  grandTotalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    width: 50,
    textAlign: 'right',
  },
});

const WorkOrderPDFDocument: React.FC<WorkOrderPDFProps> = ({ workOrder, settings }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.shopName}>{settings.shop_name}</Text>
          <Text style={styles.shopInfo}>{settings.shop_address}</Text>
          <Text style={styles.shopInfo}>{settings.shop_phone}</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>WORK ORDER</Text>

        {/* Order Info */}
        <View style={styles.orderInfo}>
          <Text>Order #: {workOrder.order_number || workOrder.id.slice(0, 8)}</Text>
          <Text>Date: {new Date(workOrder.created_at).toLocaleDateString()}</Text>
          {workOrder.vehicle && (
            <Text>
              Vehicle: {workOrder.vehicle.plate} - {workOrder.vehicle.model}
            </Text>
          )}
          {workOrder.vehicle?.customer && (
            <Text>Customer: {workOrder.vehicle.customer.name}</Text>
          )}
          {workOrder.description_needed && (
            <Text>Description: {workOrder.description_needed}</Text>
          )}
        </View>

        {/* Items Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, styles.tableCellName]}>Description</Text>
              <Text style={[styles.tableCell, styles.tableCellNumber]}>Price</Text>
              <Text style={[styles.tableCell, styles.tableCellNumber]}>Qty</Text>
              <Text style={[styles.tableCell, styles.tableCellNumber]}>Total</Text>
            </View>
            {workOrder.items.map((item, idx) => {
              const itemTotal = item.price * item.qty;
              return (
                <View key={idx} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.tableCellName]}>
                    {item.name.substring(0, 40)}
                  </Text>
                  <Text style={[styles.tableCell, styles.tableCellNumber]}>
                    ${(typeof item.price === 'string' ? parseFloat(item.price) : item.price).toFixed(2)}
                  </Text>
                  <Text style={[styles.tableCell, styles.tableCellNumber]}>{item.qty}</Text>
                  <Text style={[styles.tableCell, styles.tableCellNumber]}>
                    ${itemTotal.toFixed(2)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>
              ${(typeof workOrder.subtotal === 'string' ? parseFloat(workOrder.subtotal) : workOrder.subtotal).toFixed(2)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              Tax ({(Number(workOrder.tax_rate) * 100).toFixed(2)}%):
            </Text>
            <Text style={styles.totalValue}>
              ${(typeof workOrder.tax === 'string' ? parseFloat(workOrder.tax) : workOrder.tax).toFixed(2)}
            </Text>
          </View>
          <View style={styles.grandTotal}>
            <Text style={styles.grandTotalLabel}>TOTAL:</Text>
            <Text style={styles.grandTotalValue}>
              ${(typeof workOrder.total === 'string' ? parseFloat(workOrder.total) : workOrder.total).toFixed(2)}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export const generateAndDownloadPdf = async (
  workOrder: WorkOrder,
  settings: { shop_name: string; shop_address: string; shop_phone: string }
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
