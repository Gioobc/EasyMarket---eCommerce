import React, { useRef } from 'react';
import { Animated, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { Colors } from '../constants/Colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, style, onFocus, onBlur, ...props }) => {
  const borderAnim = useRef(new Animated.Value(0)).current;
  const bgAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = (e: Parameters<NonNullable<TextInputProps['onFocus']>>[0]) => {
    Animated.parallel([
      Animated.timing(borderAnim, { toValue: 1, duration: 200, useNativeDriver: false }),
      Animated.timing(bgAnim, { toValue: 1, duration: 200, useNativeDriver: false }),
    ]).start();
    onFocus?.(e);
  };

  const handleBlur = (e: Parameters<NonNullable<TextInputProps['onBlur']>>[0]) => {
    Animated.parallel([
      Animated.timing(borderAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
      Animated.timing(bgAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
    ]).start();
    onBlur?.(e);
  };

  const borderColor = error
    ? Colors.danger
    : borderAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [Colors.border, Colors.primary],
      });

  const backgroundColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.surface, Colors.surfaceTinted],
  });

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Animated.View style={[styles.inputWrapper, { borderColor, backgroundColor }]}>
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={Colors.textMuted}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
      </Animated.View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textSecondary,
    marginBottom: 7,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    borderWidth: 1.5,
    borderRadius: 14,
    overflow: 'hidden',
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  error: { color: Colors.danger, fontSize: 12, marginTop: 5, fontWeight: '600' },
});
