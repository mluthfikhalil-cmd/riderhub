import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Card, Badge, SectionTitle } from '../components';
import { colors, spacing, fontSize, borderRadius } from '../theme';

const HomeScreen = () => {
  // Mock data
  const nearbyEvents = [
    { id: 1, title: 'Honda Big Ride 2026', location: 'Jakarta', date: '15 Mei 2026', participants: 234 },
    { id: 2, title: 'Yamaha Sunday Ride', location: 'Bandung', date: '20 Mei 2026', participants: 89 },
    { id: 3, title: 'Kawasaki Track Day', location: 'Sentul', date: '25 Mei 2026', participants: 156 },
  ];

  const quickStats = [
    { label: 'Total Rides', value: '127', unit: 'kali' },
    { label: 'Distance', value: '3,420', unit: 'km' },
    { label: 'Fuel Used', value: '186', unit: 'liter' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good Morning,</Text>
            <Text style={styles.username}>Mas Rider 👋</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Text style={styles.notificationIcon}>🔔</Text>
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>

        {/* Motor Profile Card */}
        <Card style={styles.motorCard}>
          <View style={styles.motorCardContent}>
            <View style={styles.motorIcon}>
              <Text style={styles.motorEmoji}>🏍️</Text>
            </View>
            <View style={styles.motorInfo}>
              <Text style={styles.motorName}>Honda CBR150R</Text>
              <Text style={styles.motorPlate}>B 1234 XYZ</Text>
            </View>
            <Badge label="Aktif" variant="success" />
          </View>
        </Card>

        {/* Quick Stats */}
        <SectionTitle title="📊 Stats Mingguan" />
        <View style={styles.statsContainer}>
          {quickStats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statUnit}>{stat.unit}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Nearby Events */}
        <SectionTitle title="🎉 Event Terdekat" action="Lihat Semua" />
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.eventsScroll}
        >
          {nearbyEvents.map((event) => (
            <Card key={event.id} style={styles.eventCard}>
              <View style={styles.eventBadge}>
                <Badge label={event.location} variant="info" />
              </View>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventDate}>📅 {event.date}</Text>
              <Text style={styles.eventParticipants}>
                👥 {event.participants} peserta
              </Text>
            </Card>
          ))}
        </ScrollView>

        {/* Quick Actions */}
        <SectionTitle title="⚡ Quick Actions" />
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>⛽</Text>
            <Text style={styles.actionLabel}>Isi Bensin</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>🔧</Text>
            <Text style={styles.actionLabel}>Service</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>🛒</Text>
            <Text style={styles.actionLabel}>Cari Parts</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>📍</Text>
            <Text style={styles.actionLabel}>Cari SPBU</Text>
          </TouchableOpacity>
        </View>

        {/* Fuel Tracker */}
        <Card style={styles.fuelCard}>
          <View style={styles.fuelHeader}>
            <Text style={styles.fuelTitle}>⛽ Fuel Efficiency</Text>
            <Badge label="Baik" variant="success" />
          </View>
          <View style={styles.fuelStats}>
            <View style={styles.fuelStat}>
              <Text style={styles.fuelValue}>42.5</Text>
              <Text style={styles.fuelLabel}>km/liter</Text>
            </View>
            <View style={styles.fuelDivider} />
            <View style={styles.fuelStat}>
              <Text style={styles.fuelValue}>Rp 145K</Text>
              <Text style={styles.fuelLabel}>minggu ini</Text>
            </View>
          </View>
        </Card>

        {/* Bottom spacing */}
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
  greeting: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  username: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationIcon: {
    fontSize: 24,
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.secondary,
  },
  motorCard: {
    marginBottom: spacing.lg,
  },
  motorCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  motorIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  motorEmoji: {
    fontSize: 32,
  },
  motorInfo: {
    flex: 1,
  },
  motorName: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  motorPlate: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginHorizontal: spacing.xs,
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.primary,
  },
  statUnit: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.text,
    marginTop: spacing.xs,
  },
  eventsScroll: {
    marginLeft: -spacing.md,
    marginRight: -spacing.md,
    paddingLeft: spacing.md,
    marginBottom: spacing.lg,
  },
  eventCard: {
    width: 200,
    marginRight: spacing.md,
  },
  eventBadge: {
    marginBottom: spacing.sm,
  },
  eventTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  eventDate: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  eventParticipants: {
    fontSize: fontSize.sm,
    color: colors.primary,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  actionButton: {
    width: '23%',
    aspectRatio: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  actionLabel: {
    fontSize: fontSize.xs,
    color: colors.text,
    textAlign: 'center',
  },
  fuelCard: {
    marginBottom: spacing.lg,
  },
  fuelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  fuelTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  fuelStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fuelStat: {
    flex: 1,
    alignItems: 'center',
  },
  fuelValue: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.primary,
  },
  fuelLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  fuelDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  bottomSpace: {
    height: 100,
  },
});

export default HomeScreen;