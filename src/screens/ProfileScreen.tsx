import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Modal, TextInput, Alert, Platform } from 'react-native';
import { Card, Badge, Button } from '../components';
import { colors, spacing, fontSize, borderRadius } from '../theme';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const ProfileScreen = () => {
  const { user, signOut } = useAuth();
  
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(user?.user_metadata?.name || user?.email?.split('@')[0] || '');
  const [editMotor, setEditMotor] = useState(user?.user_metadata?.motor || 'Honda CBR250RR');
  const [updating, setUpdating] = useState(false);

  // Get user display name
  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Rider';
  const displayEmail = user?.email || '';
  const displayMotor = user?.user_metadata?.motor || 'Honda CBR250RR';
  
  const handleEdit = () => {
    setIsEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    setUpdating(true);
    try {
      // 1. Update Supabase
      const { data, error } = await supabase.auth.updateUser({
        data: { name: editName, motor: editMotor }
      });
      if (error) throw error;

      Alert.alert('Sukses', 'Profil berhasil diperbarui!');
      setIsEditModalVisible(false);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (err: any) {
      Alert.alert('Error', 'Gagal logout: ' + err.message);
    }
  };

  const menuItems = [
    { icon: '🏍️', label: 'Motor Saya', value: displayMotor, action: () => navigation.navigate('Garage') },
    { icon: '🗺️', label: 'Ride History', value: '127 rides', action: () => navigation.navigate('RideHistory') },
    { icon: '🛡️', label: 'Asuransi & Dokumen', value: '3 Aktif', action: () => navigation.navigate('Insurance') },
    { icon: '📍', label: 'Total Jarak', value: '3,420 km', action: () => Alert.alert('Jarak', 'Fitur tracking jarak segera hadir!') },
  ];

  const settingsMenu = [
    { icon: '⚙️', label: 'Pengaturan', arrow: '>', action: () => handleEdit() },
    { icon: '🛡️', label: 'Insurance & Docs', arrow: '>', action: () => navigation.navigate('Insurance') },
    { icon: '🔔', label: 'Notifikasi', arrow: '>', action: () => Alert.alert('Notifikasi', 'Belum ada notifikasi baru.') },
    { icon: '❓', label: 'Bantuan', arrow: '>', action: () => Alert.alert('Bantuan', 'Silakan hubungi support@riderhub.id') },
  ];

  const stats = [
    { label: 'Rides', value: '127' },
    { label: 'Distance', value: '3,420 km' },
    { label: 'Fuel', value: '186 L' },
    { label: 'Events', value: '12' },
  ];

  if (!user) return null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>👤 Profil</Text>
          <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{displayName[0].toUpperCase()}</Text>
              </View>
              <TouchableOpacity style={styles.cameraButton} onPress={handleEdit}>
                <Text style={styles.cameraIcon}>📷</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{displayName}</Text>
              <Text style={styles.userEmail}>{displayEmail}</Text>
              <View style={styles.profileBadges}>
                <Badge label="🏆 Pro Member" variant="success" />
                <Badge label="Verified" variant="info" />
              </View>
            </View>
          </View>
          <View style={styles.profileStats}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statItem}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Motor Info */}
        <Card style={styles.motorCard} onPress={() => navigation.navigate('Garage')}>
          <View style={styles.motorHeader}>
            <View style={styles.motorIcon}>
              <Text style={styles.motorEmoji}>🏍️</Text>
            </View>
            <View style={styles.motorDetails}>
              <Text style={styles.motorName}>{displayMotor}</Text>
              <Text style={styles.motorPlate}>B 1234 XYZ</Text>
              <Text style={styles.motorYear}>2022 • Sport</Text>
            </View>
            <TouchableOpacity style={styles.changeButton} onPress={() => navigation.navigate('Garage')}>
              <Text style={styles.changeButtonText}>Ganti</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Quick Info */}
        <View style={styles.quickInfo}>
          {menuItems.map((item, index) => (
            <TouchableOpacity key={index} style={styles.quickItem} onPress={item.action}>
              <Text style={styles.quickIcon}>{item.icon}</Text>
              <View style={styles.quickContent}>
                <Text style={styles.quickLabel}>{item.label}</Text>
                <Text style={styles.quickValue}>{item.value}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Earnings Card */}
        <Card style={styles.earningsCard}>
          <View style={styles.earningsHeader}>
            <Text style={styles.earningsTitle}>💰 Pendapatan Bulan Ini</Text>
            <Badge label="+15%" variant="success" />
          </View>
          <Text style={styles.earningsAmount}>Rp 2.450.000</Text>
          <View style={styles.earningsStats}>
            <View style={styles.earningsStat}>
              <Text style={styles.earningsStatValue}>45</Text>
              <Text style={styles.earningsStatLabel}>Delivery</Text>
            </View>
            <View style={styles.earningsStat}>
              <Text style={styles.earningsStatValue}>12</Text>
              <Text style={styles.earningsStatLabel}>Touring</Text>
            </View>
            <View style={styles.earningsStat}>
              <Text style={styles.earningsStatValue}>8</Text>
              <Text style={styles.earningsStatLabel}>Event</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.withdrawButton} onPress={() => Alert.alert('Tarik Dana', 'Fungsi penarikan dana sedang dalam pengembangan.')}>
            <Text style={styles.withdrawText}>Tarik Dana</Text>
          </TouchableOpacity>
        </Card>

        {/* Settings Menu */}
        <View style={styles.settingsSection}>
          <Text style={styles.settingsTitle}>⚙️ Pengaturan</Text>
          {settingsMenu.map((item, index) => (
            <TouchableOpacity key={index} style={styles.settingsItem} onPress={item.action}>
              <Text style={styles.settingsIcon}>{item.icon}</Text>
              <Text style={styles.settingsLabel}>{item.label}</Text>
              <Text style={styles.settingsArrow}>{item.arrow}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <Button 
          title="Keluar" 
          onPress={handleLogout} 
          variant="secondary"
          icon={<Text style={styles.logoutIcon}>🚪</Text>}
          style={styles.logoutButtonModular}
        />

        {/* App Version */}
        <Text style={styles.version}>RiderHub v1.0.0</Text>

        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={isEditModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profil</Text>
            
            <Text style={styles.inputLabel}>Nama Lengkap</Text>
            <TextInput 
              style={styles.modalInput} 
              value={editName} 
              onChangeText={setEditName} 
              placeholder="Masukkan nama..."
              placeholderTextColor={colors.textMuted}
            />
            
            <Text style={styles.inputLabel}>Motor Utama</Text>
            <TextInput 
              style={styles.modalInput} 
              value={editMotor} 
              onChangeText={setEditMotor} 
              placeholder="Contoh: Honda CBR250RR"
              placeholderTextColor={colors.textMuted}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsEditModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} disabled={updating}>
                <Text style={styles.saveBtnText}>{updating ? 'Menyimpan...' : 'Simpan'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
  },
  editButton: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  editButtonText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  profileCard: {
    marginBottom: spacing.md,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  cameraIcon: {
    fontSize: 14,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  userEmail: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  profileBadges: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.primary,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  motorCard: {
    marginBottom: spacing.md,
  },
  motorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  motorIcon: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  motorEmoji: {
    fontSize: 32,
  },
  motorDetails: {
    flex: 1,
  },
  motorName: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  motorPlate: {
    fontSize: fontSize.md,
    color: colors.primary,
    marginTop: 2,
  },
  motorYear: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  changeButton: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  changeButtonText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '500',
  },
  quickInfo: {
    marginBottom: spacing.md,
  },
  quickItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  quickIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  quickContent: {
    flex: 1,
  },
  quickLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  quickValue: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginTop: 2,
  },
  earningsCard: {
    backgroundColor: colors.surfaceLight,
    marginBottom: spacing.md,
  },
  earningsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  earningsTitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  earningsAmount: {
    fontSize: fontSize.xxxl,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.md,
  },
  earningsStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.divider,
    marginBottom: spacing.md,
  },
  earningsStat: {
    alignItems: 'center',
  },
  earningsStatValue: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  earningsStatLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  withdrawButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  withdrawText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.background,
  },
  settingsSection: {
    marginBottom: spacing.lg,
  },
  settingsTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  settingsIcon: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  settingsLabel: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
  },
  settingsArrow: {
    fontSize: fontSize.lg,
    color: colors.textMuted,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.error,
  },
  logoutButtonModular: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
    backgroundColor: colors.surface,
    borderColor: colors.error,
    borderWidth: 1,
  },
  logoutIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  logoutText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.error,
  },
  version: {
    textAlign: 'center',
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  bottomSpace: {
    height: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalContent: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  modalInput: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: fontSize.md,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  cancelBtn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
  },
  cancelBtnText: {
    color: colors.text,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 2,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  saveBtnText: {
    color: colors.background,
    fontWeight: '700',
  },
});

export default ProfileScreen;