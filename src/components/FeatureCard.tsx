import React from 'react';
import { View, Text, StyleSheet, Pressable, StyleProp, ViewStyle, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize } from '../theme';

type IonIcon = React.ComponentProps<typeof Ionicons>['name'];
type MCIcon = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

type IconSpec =
  | { lib: 'ion'; name: IonIcon }
  | { lib: 'mci'; name: MCIcon };

export type FeatureCardVariant = 'hero' | 'standard' | 'compact';

export interface FeatureCardProps {
  title: string;
  subtitle?: string;
  icon: IconSpec;
  /** CSS-style gradient accent (web only) or solid fallback (native). */
  accentColor?: string;
  /** Optional right-side pill text (e.g. "3 DUE", "NEW", "12K") */
  badge?: string | null;
  badgeTone?: 'accent' | 'warning' | 'error' | 'neutral';
  variant?: FeatureCardVariant;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

const TONE_COLOR: Record<NonNullable<FeatureCardProps['badgeTone']>, string> = {
  accent: colors.accent,
  warning: colors.warning,
  error: colors.error,
  neutral: colors.textSecondary,
};

const IconRenderer = ({ icon, size, color }: { icon: IconSpec; size: number; color: string }) => {
  if (icon.lib === 'ion') return <Ionicons name={icon.name} size={size} color={color} />;
  return <MaterialCommunityIcons name={icon.name} size={size} color={color} />;
};

/**
 * FeatureCard — consistent menu/navigation card used across the app.
 *
 * Variants:
 *   hero     — 2-line card with big icon + gradient overlay, for primary CTAs
 *   standard — single-line card with medium icon + chevron + optional badge
 *   compact  — small square tile for grids (2x2 / 3x3)
 */
export const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  subtitle,
  icon,
  accentColor = colors.accent,
  badge,
  badgeTone = 'accent',
  variant = 'standard',
  onPress,
  style,
  disabled,
}) => {
  const badgeColor = TONE_COLOR[badgeTone];

  if (variant === 'compact') {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          ts.compactCard,
          pressed && ts.pressed,
          disabled && ts.disabled,
          style,
        ]}
      >
        <View style={[ts.compactIconBox, { backgroundColor: `${accentColor}18`, borderColor: `${accentColor}44` }]}>
          <IconRenderer icon={icon} size={22} color={accentColor} />
        </View>
        <Text style={ts.compactTitle} numberOfLines={2}>{title}</Text>
        {subtitle ? <Text style={ts.compactSubtitle} numberOfLines={1}>{subtitle}</Text> : null}
        {badge ? (
          <View style={[ts.compactBadge, { backgroundColor: `${badgeColor}22`, borderColor: badgeColor }]}>
            <Text style={[ts.compactBadgeText, { color: badgeColor }]}>{badge.toUpperCase()}</Text>
          </View>
        ) : null}
      </Pressable>
    );
  }

  if (variant === 'hero') {
    const webGradient = Platform.OS === 'web'
      ? ({ background: `linear-gradient(135deg, ${accentColor}22, transparent 70%), #0A0A0A` } as unknown as ViewStyle)
      : null;
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          ts.heroCard,
          webGradient,
          pressed && ts.pressed,
          disabled && ts.disabled,
          style,
        ]}
      >
        <View style={ts.heroContent}>
          <View style={[ts.heroIconBox, { backgroundColor: `${accentColor}1A`, borderColor: `${accentColor}55` }]}>
            <IconRenderer icon={icon} size={26} color={accentColor} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={ts.heroTitleRow}>
              <Text style={ts.heroTitle}>{title}</Text>
              {badge ? (
                <View style={[ts.badge, { backgroundColor: `${badgeColor}22`, borderColor: badgeColor }]}>
                  <Text style={[ts.badgeText, { color: badgeColor }]}>{badge.toUpperCase()}</Text>
                </View>
              ) : null}
            </View>
            {subtitle ? <Text style={ts.heroSubtitle}>{subtitle}</Text> : null}
          </View>
          <View style={ts.chevronBox}>
            <Ionicons name="chevron-forward" size={18} color={accentColor} />
          </View>
        </View>
        <View style={[ts.heroAccentLine, { backgroundColor: accentColor }]} />
      </Pressable>
    );
  }

  // standard
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        ts.standardCard,
        pressed && ts.pressed,
        disabled && ts.disabled,
        style,
      ]}
    >
      <View style={[ts.standardIconBox, { backgroundColor: `${accentColor}14`, borderColor: `${accentColor}33` }]}>
        <IconRenderer icon={icon} size={22} color={accentColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={ts.standardTitle}>{title}</Text>
        {subtitle ? <Text style={ts.standardSubtitle} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      {badge ? (
        <View style={[ts.badge, { backgroundColor: `${badgeColor}22`, borderColor: badgeColor, marginRight: 8 }]}>
          <Text style={[ts.badgeText, { color: badgeColor }]}>{badge.toUpperCase()}</Text>
        </View>
      ) : null}
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </Pressable>
  );
};

const ts = StyleSheet.create({
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.4 },

  // Standard — single-line menu row
  standardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#0C0C0C',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  standardIconBox: {
    width: 44, height: 44,
    borderRadius: borderRadius.md,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1,
  },
  standardTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  standardSubtitle: { color: colors.textSecondary, fontSize: fontSize.xs, marginTop: 2 },

  // Hero — big card with gradient accent + bottom line
  heroCard: {
    backgroundColor: '#0A0A0A',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: '#181818',
    overflow: 'hidden',
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  heroIconBox: {
    width: 52, height: 52,
    borderRadius: borderRadius.md,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1,
  },
  heroTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700', flex: 1 },
  heroSubtitle: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: 4, lineHeight: 18 },
  chevronBox: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center', alignItems: 'center',
  },
  heroAccentLine: { height: 2 },

  // Compact — square tile for 2-col / 3-col grid
  compactCard: {
    backgroundColor: '#0C0C0C',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    minHeight: 110,
  },
  compactIconBox: {
    width: 40, height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  compactTitle: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700' },
  compactSubtitle: { color: colors.textSecondary, fontSize: fontSize.xs, marginTop: 2 },
  compactBadge: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  compactBadgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },

  // Shared badge
  badge: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
  },
  badgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
});
