import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Card, Badge, SectionTitle } from '../components';
import { colors, spacing, fontSize, borderRadius } from '../theme';

const EventsScreen = () => {
  const filterPills = ['Semua', 'Touring', 'Racing', 'Meet', 'Rally'];
  const [activeFilter, setActiveFilter] = React.useState('Semua');

  const events = [
    { 
      id: 1, 
      title: 'Honda Big Ride 2026', 
      location: 'Jakarta', 
      date: '15 Mei 2026', 
      participants: 234,
      type: 'Touring',
      image: '🏍️',
      price: 'Rp 150.000',
    },
    { 
      id: 2, 
      title: 'Yamaha Sunday Ride', 
      location: 'Bandung', 
      date: '20 Mei 2026', 
      participants: 89,
      type: 'Touring',
      image: '🏍️',
      price: 'Gratis',
    },
    { 
      id: 3, 
      title: 'Kawasaki Track Day', 
      location: 'Sentul', 
      date: '25 Mei 2026', 
      participants: 156,
      type: 'Racing',
      image: '🏁',
      price: 'Rp 500.000',
    },
    { 
      id: 4, 
      title: 'Honda CBR Meet Up', 
      location: 'Surabaya', 
      date: '1 Jun 2026', 
      participants: 312,
      type: 'Meet',
      image: '👥',
      price: 'Rp 75.000',
    },
    { 
      id: 5, 
      title: 'Yamaha NMAX Rally', 
      location: 'Yogyakarta', 
      date: '8 Jun 2026', 
      participants: 178,
      type: 'Rally',
      image: '🗺️',
      price: 'Rp 200.000',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🎉 Event & Touring</Text>
          <Text style={styles.subtitle}>Temukan event menarik di sekitarmu</Text>
        </View>

        {/* Filter Pills */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
        >
          {filterPills.map((pill) => (
            <TouchableOpacity
              key={pill}
              style={[
                styles.filterPill,
                activeFilter === pill && styles.filterPillActive,
              ]}
              onPress={() => setActiveFilter(pill)}
            >
              <Text style={[
                styles.filterText,
                activeFilter === pill && styles.filterTextActive,
              ]}>
                {pill}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Featured Event */}
        <Card style={styles.featuredCard}>
          <View style={styles.featuredBadge}>
            <Badge label="🔥 Featured" variant="warning" />
          </View>
          <Text style={styles.featuredEmoji}>🏆</Text>
          <Text style={styles.featuredTitle}>Indonesia Motor Festival 2026</Text>
          <Text style={styles.featuredLocation}>📍 Jakarta International Expo</Text>
          <Text style={styles.featuredDate}>📅 20-22 Juni 2026</Text>
          <View style={styles.featuredStats}>
            <Text style={styles.featuredParticipants}>👥 1,500+ Peserta</Text>
            <Text style={styles.featuredPrice}>Rp 250.000</Text>
          </View>
          <TouchableOpacity style={styles.registerButton}>
            <Text style={styles.registerText}>Daftar Sekarang</Text>
          </TouchableOpacity>
        </Card>

        {/* Event List */}
        <SectionTitle title="📅 Event Mendatang" />
        {events.map((event) => (
          <Card key={event.id} style={styles.eventCard}>
            <View style={styles.eventRow}>
              <View style={styles.eventIcon}>
                <Text style={styles.eventEmoji}>{event.image}</Text>
              </View>
              <View style={styles.eventInfo}>
                <View style={styles.eventHeader}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Badge label={event.type} variant="info" />
                </View>
                <Text style={styles.eventLocation}>📍 {event.location}</Text>
                <Text style={styles.eventDate}>📅 {event.date}</Text>
                <View style={styles.eventFooter}>
                  <Text style={styles.eventParticipants}>
                    👥 {event.participants} peserta
                  </Text>
                  <Text style={styles.eventPrice}>{event.price}</Text>
                </View>
              </View>
            </View>
          </Card>
        ))}

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
    paddingVertical: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  filterScroll: {
    marginLeft: -spacing.md,
    marginRight: -spacing.md,
    paddingLeft: spacing.md,
    marginBottom: spacing.lg,
  },
  filterPill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: colors.background,
  },
  featuredCard: {
    backgroundColor: colors.surfaceLight,
    marginBottom: spacing.lg,
    alignItems: 'center',
    padding: spacing.lg,
  },
  featuredBadge: {
    marginBottom: spacing.md,
  },
  featuredEmoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  featuredTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  featuredLocation: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  featuredDate: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  featuredStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: spacing.md,
  },
  featuredParticipants: {
    fontSize: fontSize.md,
    color: colors.primary,
  },
  featuredPrice: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.secondary,
  },
  registerButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    width: '100%',
    alignItems: 'center',
  },
  registerText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.background,
  },
  eventCard: {
    marginBottom: spacing.md,
  },
  eventRow: {
    flexDirection: 'row',
  },
  eventIcon: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  eventEmoji: {
    fontSize: 32,
  },
  eventInfo: {
    flex: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  eventTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  eventLocation: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  eventDate: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventParticipants: {
    fontSize: fontSize.sm,
    color: colors.primary,
  },
  eventPrice: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.secondary,
  },
  bottomSpace: {
    height: 100,
  },
});

export default EventsScreen;