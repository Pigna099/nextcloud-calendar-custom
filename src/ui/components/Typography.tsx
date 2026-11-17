import React from 'react';
import { StyleSheet, Text, TextProps, TextStyle, StyleProp } from 'react-native';
import { useTheme } from 'expo-router';

export const VARIANTS = StyleSheet.create({
  body1: { fontSize: 16, fontWeight: '500', lineHeight: 20 },
  body2: { fontSize: 15, fontWeight: '600', lineHeight: 19 },
  caption: { fontSize: 14, fontWeight: '400', lineHeight: 19, letterSpacing: 0.1 },
  button: { fontSize: 16, fontWeight: '700', lineHeight: 24 },
  title: { fontSize: 17, fontWeight: '600', lineHeight: 22 },
  navigation: { fontSize: 18, fontWeight: '600', lineHeight: 24 },
  header: { fontSize: 19, fontWeight: '700', lineHeight: 22, letterSpacing: 0.08 },
  h1: { fontSize: 32, fontWeight: '700', lineHeight: 40 },
  h2: { fontSize: 28, fontWeight: '700', lineHeight: 34 },
  h3: { fontSize: 24, fontWeight: '700', lineHeight: 30 },
  h4: { fontSize: 20, fontWeight: '700', lineHeight: 26 },
});

const ALIGN = StyleSheet.create({
  left: { textAlign: 'left' },
  center: { textAlign: 'center' },
  right: { textAlign: 'right' },
});

export type Variant = keyof typeof VARIANTS;
type Color =
  | 'primary'
  | 'onPrimary'
  | 'primarySoft'
  | 'primarySoftText'
  | 'text'
  | 'secondary'
  | 'tertiary'
  | 'light'
  | 'danger'
  | 'onDanger'
  | 'dangerSoftText'
  | 'warning'
  | 'onWarning'
  | 'warningSoftText'
  | 'talk'
  | 'onTalk'
  | 'talkSoftText';
type Alignment = keyof typeof ALIGN;

export interface TypographyProps extends TextProps {
  variant?: Variant;
  color?: Color | string;
  align?: Alignment;
  inline?: boolean;
  nowrap?: boolean;
  weight?: TextStyle['fontWeight'];
  italic?: boolean;
  style?: StyleProp<TextStyle>;
}

function Typography({
  variant = 'body1',
  color = 'text',
  align = 'left',
  nowrap = false,
  weight,
  italic = false,
  style,
  children,
  ...rest
}: TypographyProps) {
  const { colors } = useTheme();

  const textColor =
    color === 'primary' ? colors.primary
    : color === 'onPrimary' ? colors.onPrimary
    : color === 'primarySoft' ? colors.primarySoft
    : color === 'primarySoftText' ? colors.primarySoftText
    : color === 'text' ? colors.text
    : color === 'secondary' ? colors.textSecondary
    : color === 'tertiary' ? colors.textTertiary
    // "light" is the historical name for ink on a filled/coloured surface.
    : color === 'light' ? colors.onPrimary
    : color === 'danger' ? colors.danger
    : color === 'onDanger' ? colors.onDanger
    : color === 'dangerSoftText' ? colors.dangerSoftText
    : color === 'warning' ? colors.warning
    : color === 'onWarning' ? colors.onWarning
    : color === 'warningSoftText' ? colors.warningSoftText
    : color === 'talk' ? colors.talk
    : color === 'onTalk' ? colors.onTalk
    : color === 'talkSoftText' ? colors.talkSoftText
    : color;

  return (
    <Text
      {...rest}
      numberOfLines={nowrap ? 1 : rest.numberOfLines}
      style={[
        VARIANTS[variant],
        ALIGN[align],
        { color: textColor },
        weight ? { fontWeight: weight } : null,
        italic && styles.italic,
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  italic: { transform: [{ skewX: '-13deg' }] },
});

export default React.memo(Typography);
