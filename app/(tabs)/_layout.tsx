import { StyleSheet, View } from 'react-native';
import { Tabs, useTheme } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Calendar, Settings as SettingsIcon, type LucideIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { SFSymbol } from 'sf-symbols-typescript';
import type { AndroidSymbol } from 'expo-symbols';
import { nativeTabsEnabled } from '@/utils/nativeTabs';

type IconState<T> = { default: T; selected: T };

type TabItem = {
  name: string;
  labelKey: string;
  sf: IconState<SFSymbol>;
  md: IconState<AndroidSymbol>;
  Icon: LucideIcon;
};

const TAB_ITEMS: TabItem[] = [
  {
    name: 'calendar/index',
    labelKey: 'tabs.calendar',
    sf: { default: 'calendar', selected: 'calendar' },
    md: { default: 'calendar_month', selected: 'calendar_month' },
    Icon: Calendar,
  },
  {
    name: 'settings',
    labelKey: 'tabs.settings',
    sf: { default: 'gearshape', selected: 'gearshape.fill' },
    md: { default: 'settings', selected: 'settings' },
    Icon: SettingsIcon,
  },
];

function NativeTabsLayout() {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
      <NativeTabs
        tintColor={theme.colors.primary}
        labelStyle={{ color: theme.colors.tabBarInactive, fontSize: 11, fontWeight: '500' }}
      >
        {TAB_ITEMS.map((tab) => (
            <NativeTabs.Trigger key={tab.name} name={tab.name}>
              <NativeTabs.Trigger.Label>{t(tab.labelKey)}</NativeTabs.Trigger.Label>
              <NativeTabs.Trigger.Icon sf={tab.sf} md={tab.md} />
            </NativeTabs.Trigger>
        ))}
      </NativeTabs>
  );
}

function JsTabsLayout() {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
      <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: theme.colors.primary,
            tabBarInactiveTintColor: theme.colors.tabBarInactive,
            tabBarStyle: {
              backgroundColor: theme.colors.tabBar,
              borderTopColor: theme.colors.tabBarBorder,
              borderTopWidth: StyleSheet.hairlineWidth,
              elevation: 0,
            },
            tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
          }}
      >
        {TAB_ITEMS.map(({ name, labelKey, Icon }) => (
            <Tabs.Screen
                key={name}
                name={name}
                options={{
                  title: t(labelKey),
                  tabBarLabel: t(labelKey),
                  tabBarButtonTestID: `tab-${name.split('/')[0]}`,
                  tabBarIcon: ({ color, focused }) => (
                      <View
                          testID={`tab-icon-${name.split('/')[0]}`}
                          style={[
                            styles.tabIcon,
                            focused && { backgroundColor: theme.colors.primarySoft, borderRadius: theme.radius.pill },
                          ]}
                      >
                        <Icon size={22} color={color} strokeWidth={2} />
                      </View>
                  ),
                }}
            />
        ))}
      </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    width: 40,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default function TabsLayout() {
  return nativeTabsEnabled() ? <NativeTabsLayout /> : <JsTabsLayout />;
}