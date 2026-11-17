import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from 'expo-router';
import { ChevronDown, ChevronUp } from 'lucide-react-native';

import { AnimatedPressable, Icon, SectionHeader, Stack, Typography } from '@/ui/components';

interface FormSectionProps {
  title: string;
  children?: ReactNode;
  /** Short overview of the section contents, shown only while collapsed. */
  collapsedSummary?: string;
  /** Sections stay open by default so their controls remain discoverable. */
  collapsible?: boolean;
  defaultExpanded?: boolean;
  testID?: string;
  toggleTestID?: string;
}

export function FormSection({
  title,
  children,
  collapsedSummary,
  collapsible = false,
  defaultExpanded = true,
  testID,
  toggleTestID,
}: FormSectionProps) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const open = !collapsible || expanded;

  const header = (
    <SectionHeader
      title={title}
      trailing={
        collapsible ? (
          <Icon size={18}>
            {expanded
              ? <ChevronUp color={theme.colors.textTertiary} />
              : <ChevronDown color={theme.colors.textTertiary} />}
          </Icon>
        ) : undefined
      }
    />
  );

  return (
    <View style={styles.section} testID={testID}>
      {collapsible ? (
        <AnimatedPressable
          testID={toggleTestID}
          animated={false}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          accessibilityLabel={!expanded && collapsedSummary ? `${title}. ${collapsedSummary}` : title}
          onPress={() => setExpanded((value) => !value)}
        >
          {header}
          {!expanded && collapsedSummary ? (
            <Typography
              variant="caption"
              color="secondary"
              numberOfLines={2}
              style={styles.summary}
            >
              {collapsedSummary}
            </Typography>
          ) : null}
        </AnimatedPressable>
      ) : (
        header
      )}

      {open ? (
        <Stack gap={16}>
          {children}
        </Stack>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { width: '100%' },
  summary: { paddingHorizontal: 6, marginTop: -6, marginBottom: 4 },
});
