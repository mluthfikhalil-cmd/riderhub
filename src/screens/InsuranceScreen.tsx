import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { Card, Badge, SectionTitle, Button } from '../components';
import { colors, spacing, fontSize, borderRadius } from '../theme';

const InsuranceScreen = ({ navigation }: any) => {
  const [documents, setDocuments] = useState([
    { id: '1', type: 'STNK', expiry: '12 Jan 2027', status: 'Active' },
    { id: '2', type: 'Asuransi Jiwa', expiry: '05 Mei 2026', status: 'Active' },
    { id: '3', type: 'SIM C', expiry: '20 Okt 2029', status: 'Active' },
  ]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🛡️ Insurance & Docs</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <SectionTitle title="Dokumen Kendaraan" />
        
        {documents.map((doc) => (
          <Card key={doc.id} style={styles.docCard}>
            <View style={styles.docHeader}>
              <View style={styles.docIconContainer}>
                <Text style={styles.docIcon}>📄</Text>
              </View>
              <View style={styles.docInfo}>
                <Text style={styles.docType}>{doc.type}</Text>
                <Text style={styles.docExpiry}>Berlaku hingga: {doc.expiry}</Text>
              </View>
              <Badge label={doc.status} variant="success" />
            </View>
            <View style={styles.docActions}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('View', 'Membuka dokumen...')}>
                <Text style={styles.actionBtnText}>Lihat Foto</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('Edit', 'Fitur edit dokumen segera hadir!')}>
                <Text style={styles.actionBtnText}>Edit Data</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ))}

        <Card style={styles.uploadCard}>
          <Text style={styles.uploadTitle}>Tambah Dokumen Baru</Text>
          <Text style={styles.uploadDesc}>Upload foto STNK atau Asuransi kamu agar selalu aman di RiderHub.</Text>
          <Button 
            title="Upload Sekarang" 
            onPress={() => Alert.alert('Upload', 'Fitur upload dokumen segera hadir!')} 
          />
        </Card>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  backButton: {
    padding: spacing.sm,
  },
  backIcon: {
    fontSize: 24,
    color: colors.text,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  scrollView: {
    flex: 1,
    padding: spacing.md,
  },
  docCard: {
    marginBottom: spacing.md,
  },
  docHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  docIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  docIcon: {
    fontSize: 24,
  },
  docInfo: {
    flex: 1,
  },
  docType: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  docExpiry: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  docActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
  },
  actionBtnText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: fontSize.sm,
  },
  uploadCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.surfaceLight,
    padding: spacing.xl,
    alignItems: 'center',
  },
  uploadTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  uploadDesc: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  bottomSpace: {
    height: 100,
  },
});

export default InsuranceScreen;
