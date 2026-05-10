import React from 'react';
import { TouchableOpacity, StyleSheet, StyleProp, ViewStyle, AccessibilityRole, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius } from '../theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface HeaderIconButtonProps {
  icon: IconName;
  onPress: () => void;
  color?: string;
  size?: number;
  variant?: 'default' | 'accent' | 'ghost';
  label?: string; // accessibility label, defaults to icon-derived name
  style?: StyleProp<ViewStyle>;
  testID?: string;
  disabled?: boolean;
}

/**
 * Base 40×40 circular icon button used in screen headers & modal headers.
 * Variants:
 *   default — dark surface, subtle (used for most back / close)
 *   accent  — neon accent bg, dark icon (used for primary actions like Add)
 *   ghost   — transparent, for secondary actions
 */
export const HeaderIconButton: React.FC<HeaderIconButtonProps> = ({
  icon, onPress, color, size = 22, variant = 'default',
  label, style, testID, disabled,
}) => {
  const iconColor = color ?? (variant === 'accent' ? '#000' : colors.text);
  const containerStyle = [
    styles.base,
    variant === 'default' && styles.default,
    variant === 'accent' && styles.accent,
    variant === 'ghost' && styles.ghost,
    disabled && styles.disabled,
    style,
  ];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={containerStyle}
      accessibilityRole={'button' as AccessibilityRole}
      accessibilityLabel={label || icon.replace('-', ' ')}
      testID={testID}
      disabled={disabled}
      hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
    >
      <Ionicons name={icon} size={size} color={iconColor} />
    </TouchableOpacity>
  );
};

/** Back button — always chevron-back, default variant. */
export const BackButton: React.FC<Omit<HeaderIconButtonProps, 'icon' | 'variant'> & { variant?: HeaderIconButtonProps['variant'] }> = (props) => (
  <HeaderIconButton
    icon={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'}
    label="Kembali"
    size={22}
    {...props}
  />
);

/** Close button (for modals) — always close icon. */
export const CloseButton: React.FC<Omit<HeaderIconButtonProps, 'icon' | 'variant'> & { variant?: HeaderIconButtonProps['variant'] }> = (props) => (
  <HeaderIconButton
    icon="close"
    label="Tutup"
    size={24}
    {...props}
  />
);

/** Create/Add button — primary action in accent color. */
export const CreateButton: React.FC<Omit<HeaderIconButtonProps, 'icon' | 'variant'> & { icon?: IconName }> = ({ icon = 'add', label = 'Tambah', ...props }) => (
  <HeaderIconButton
    icon={icon}
    variant="accent"
    size={24}
    label={label}
    {...props}
  />
);

const styles = StyleSheet.create({
  base: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  default: {
    backgroundColor: '#111',
  },
  accent: {
    backgroundColor: colors.accent,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.4,
  },
});
