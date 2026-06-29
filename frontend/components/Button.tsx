import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef } from 'react';
import {
  Animated,
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import { Colors, Gradients } from '../constants/Colors';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  loading?: boolean;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  loading = false,
  fullWidth = false,
  size = 'md',
  style,
  disabled,
  onPress,
  ...props
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 50 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();
  };

  const isDisabled = disabled || loading;
  const sizeStyle = size === 'sm' ? styles.sm : size === 'lg' ? styles.lg : styles.md;
  const textSize = size === 'sm' ? styles.textSm : size === 'lg' ? styles.textLg : styles.textMd;

  const isPrimary = variant === 'primary';

  return (
    <Animated.View style={[{ transform: [{ scale }] }, fullWidth && styles.fullWidth, style]}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        disabled={isDisabled}
        style={isDisabled ? { opacity: 0.4 } : undefined}
        {...props}
      >
        {isPrimary ? (
          <LinearGradient
            colors={Gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.base, sizeStyle, styles.primaryShadow]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[styles.text, textSize]}>{title}</Text>
            )}
          </LinearGradient>
        ) : (
          <Animated.View
            style={[
              styles.base,
              sizeStyle,
              variant === 'secondary' && styles.secondary,
              variant === 'outline' && styles.outline,
              variant === 'danger' && styles.danger,
              variant === 'ghost' && styles.ghost,
            ]}
          >
            {loading ? (
              <ActivityIndicator
                color={variant === 'outline' || variant === 'ghost' ? Colors.primary : '#fff'}
              />
            ) : (
              <Text
                style={[
                  styles.text,
                  textSize,
                  (variant === 'outline' || variant === 'ghost') && styles.outlineText,
                  variant === 'danger' && styles.dangerText,
                ]}
              >
                {title}
              </Text>
            )}
          </Animated.View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryShadow: {
    shadowColor: Colors.primaryDark,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  sm: { paddingVertical: 10, paddingHorizontal: 20 },
  md: { paddingVertical: 15, paddingHorizontal: 28 },
  lg: { paddingVertical: 18, paddingHorizontal: 36 },
  secondary: { backgroundColor: Colors.secondary },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  danger: { backgroundColor: Colors.danger },
  ghost: { backgroundColor: Colors.surfaceTinted },
  fullWidth: { width: '100%' },
  text: { color: '#fff', fontWeight: '800', letterSpacing: 0.1 },
  textSm: { fontSize: 14 },
  textMd: { fontSize: 16 },
  textLg: { fontSize: 17 },
  outlineText: { color: Colors.primary },
  dangerText: { color: '#fff' },
});
