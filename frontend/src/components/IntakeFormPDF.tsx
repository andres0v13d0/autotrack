import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf, Image } from '@react-pdf/renderer';
import type { IntakeForm } from '../services/intakeForm.service';
import type { WorkOrder } from '../types/workOrder';

interface IntakeFormPDFProps {
  intakeForm: IntakeForm;
  shopInfo: {
    shop_name: string;
    shop_address?: string;
    shop_phone?: string;
    shop_email?: string;
    shop_slogan?: string;
    shop_logo_url?: string;
  };
  workOrder?: WorkOrder;
}

const formatPhoneUS = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  const last10 = cleaned.slice(-10);
  if (last10.length === 10) {
    return `(${last10.slice(0, 3)}) ${last10.slice(3, 6)}-${last10.slice(6)}`;
  }
  return phone;
};

const colors = {
  primary: '#0f1f3d',
  secondary: '#f97316',
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
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  twoColGrid: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
  },
  twoColItem: {
    flex: 1,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#ffffff',
    backgroundColor: colors.secondary,
    padding: 5,
    marginBottom: 8,
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 5,
    gap: 8,
  },
  label: {
    fontSize: 8,
    fontWeight: 'bold',
    color: colors.primary,
    width: 80,
  },
  value: {
    fontSize: 9,
    color: colors.text,
    flex: 1,
  },
  signatureSection: {
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  signatureBox: {
    marginTop: 8,
    marginBottom: 12,
    height: 40,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 3,
    backgroundColor: colors.lightBg,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signatureImage: {
    maxWidth: 150,
    maxHeight: 35,
  },
  signaturePlaceholder: {
    fontSize: 8,
    color: colors.lightText,
  },
  signatureLineRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  signatureLineSide: {
    flex: 1,
  },
  signatureLine: {
    fontSize: 8,
    color: colors.text,
    borderTopWidth: 1,
    borderTopColor: colors.text,
    paddingTop: 2,
    textAlign: 'center',
  },
  signatureLabel: {
    fontSize: 7,
    color: colors.lightText,
    marginTop: 2,
    textAlign: 'center',
  },
  footer: {
    marginTop: 15,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    textAlign: 'center',
    fontSize: 7,
    color: colors.lightText,
  },
});

const IntakeFormPDFDocument: React.FC<IntakeFormPDFProps> = ({ intakeForm, shopInfo, workOrder }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {/* Logo Box - Left */}
          <View style={styles.logoBox}>
            {shopInfo.shop_logo_url ? (
              <Image
                src={shopInfo.shop_logo_url}
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
            <Text style={styles.shopName}>{shopInfo.shop_name || 'AutoTrack Shop'}</Text>
            {shopInfo.shop_slogan && (
              <Text style={styles.shopSlogan}>{shopInfo.shop_slogan}</Text>
            )}
            {shopInfo.shop_address && (
              <View style={styles.infoRow}>
                <Text style={styles.infoValue}>{shopInfo.shop_address}</Text>
              </View>
            )}
            {shopInfo.shop_phone && (
              <View style={styles.infoRow}>
                <Text style={styles.infoValue}>{formatPhoneUS(shopInfo.shop_phone)}</Text>
              </View>
            )}
            {shopInfo.shop_email && (
              <View style={styles.infoRow}>
                <Text style={styles.infoValue}>{shopInfo.shop_email}</Text>
              </View>
            )}
          </View>

          {/* Right: Order Number Badge */}
          <View style={styles.orderNumberBadge}>
            <Text style={styles.orderNumber}>
              #{workOrder?.order_number || workOrder?.id?.slice(0, 8) || 'N/A'}
            </Text>
            <Text style={styles.orderNumberLabel}>INTAKE FORM</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>VEHICLE INTAKE FORM</Text>

        {/* Customer & Vehicle Info - 2 Columns */}
        <View style={styles.twoColGrid}>
          <View style={styles.twoColItem}>
            <Text style={styles.sectionTitle}>CUSTOMER</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Name:</Text>
              <Text style={styles.value}>{intakeForm.client_name}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Phone:</Text>
              <Text style={styles.value}>{intakeForm.client_phone}</Text>
            </View>
          </View>

          <View style={styles.twoColItem}>
            <Text style={styles.sectionTitle}>VEHICLE</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Plate:</Text>
              <Text style={styles.value}>{intakeForm.vehicle_plate}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Model:</Text>
              <Text style={styles.value}>{intakeForm.vehicle_model}</Text>
            </View>
            {intakeForm.mileage_in && (
              <View style={styles.row}>
                <Text style={styles.label}>Mileage:</Text>
                <Text style={styles.value}>{intakeForm.mileage_in} km</Text>
              </View>
            )}
          </View>
        </View>

        {/* Vehicle Condition */}
        {intakeForm.vehicle_condition && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>VEHICLE CONDITION</Text>
            <Text style={styles.value}>{intakeForm.vehicle_condition}</Text>
          </View>
        )}

        {/* Problem Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PROBLEM DESCRIPTION</Text>
          <Text style={styles.value}>{intakeForm.problem_description}</Text>
        </View>

        {/* Signature */}
        <View style={styles.signatureSection}>
          <Text style={styles.sectionTitle}>CUSTOMER AUTHORIZATION</Text>
          <View style={styles.signatureBox}>
            {intakeForm.client_signature ? (
              <Image
                src={intakeForm.client_signature}
                style={styles.signatureImage}
              />
            ) : (
              <Text style={styles.signaturePlaceholder}>Digital signature not available</Text>
            )}
          </View>
          
          <View style={styles.signatureLineRow}>
            <View style={styles.signatureLineSide}>
              <Text style={styles.signatureLine}>_________________</Text>
              <Text style={styles.signatureLabel}>Signature</Text>
            </View>
            <View style={styles.signatureLineSide}>
              <Text style={styles.signatureLine}>
                {new Date(intakeForm.signed_at || intakeForm.created_at).toLocaleDateString('en-US')}
              </Text>
              <Text style={styles.signatureLabel}>Date</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Generated on {new Date().toLocaleDateString('en-US')} | AutoTrack Management System</Text>
        </View>
      </Page>
    </Document>
  );
};

export const generateAndDownloadIntakeFormPdf = async (
  intakeForm: IntakeForm,
  shopInfo: any,
  workOrder?: any
) => {
  try {
    const fileName = `Intake_Form_${intakeForm.vehicle_plate}_${new Date().getTime()}.pdf`;

    const doc = (
      <IntakeFormPDFDocument intakeForm={intakeForm} shopInfo={shopInfo} workOrder={workOrder} />
    );

    const pdfBlob = await pdf(doc).toBlob();
    
    // Create blob URL and download
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the object URL after a delay
    setTimeout(() => URL.revokeObjectURL(url), 100);
  } catch (error) {
    console.error('Error generating intake form PDF:', error);
    throw error;
  }
};

export default IntakeFormPDFDocument;
