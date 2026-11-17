import React, { memo, type ReactElement } from 'react';
import { View, ViewProps } from 'react-native';
import { useTheme } from 'expo-router';
import { pickInk } from '@/utils/color';

interface IconProps extends ViewProps {
  children?: React.ReactNode;
  color?: string;
  size?: number;
  opacity?: number;
}

interface IconChildProps {
  color?: string;
  size?: number;
}

function injectProps(children: React.ReactNode, color: string, size: number): React.ReactNode {
  const inject = (child: ReactElement<unknown>) => {
    const props = child.props as IconChildProps;
    const next: Record<string, unknown> = {};
    if (props.color === undefined) next.color = color;
    if (props.size === undefined) next.size = size;
    return Object.keys(next).length ? React.cloneElement(child, next) : child;
  };

  if (React.isValidElement(children)) return inject(children);
  return React.Children.map(children, (child) =>
    React.isValidElement(child) ? inject(child) : child
  );
}

function Icon({ children, color, size = 24, opacity, style, ...rest }: IconProps) {
  const { colors } = useTheme();
  const chip = Boolean(color);
  const semanticInk =
    color === colors.primary || color === colors.chipActive ? colors.onPrimary
    : color === colors.danger ? colors.onDanger
    : color === colors.warning ? colors.onWarning
    : color === colors.talk ? colors.onTalk
    : null;
  const glyphColor = chip ? semanticInk ?? pickInk(color as string) : colors.text;

  return (
    <View
      {...rest}
      style={[
        { alignItems: 'center', justifyContent: 'center', width: size, height: size },
        chip && {
          padding: 4,
          borderRadius: 8,
          marginRight: -4,
          width: undefined,
          height: undefined,
          backgroundColor: color,
        },
        opacity !== undefined && { opacity },
        style,
      ]}
    >
      {injectProps(children, glyphColor, size)}
    </View>
  );
}

export default memo(Icon);
