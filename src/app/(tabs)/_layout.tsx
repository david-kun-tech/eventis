import { Ionicons } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { View, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStore } from '@/lib/store';
import { C, F } from '@/lib/theme';

type IconName = keyof typeof Ionicons.glyphMap;

const tab = (title: string, icon: IconName, iconOn: IconName) => ({
  title,
  tabBarIcon: ({ color, focused }: { color: ColorValue; focused: boolean; size: number }) => (
    <View
      style={{
        width: 44,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: focused ? C.goldSoft : 'transparent',
      }}>
      <Ionicons name={focused ? iconOn : icon} size={21} color={color as string} />
    </View>
  ),
});

export default function TabsLayout() {
  const { bookings, ready, onboarded } = useStore();
  const insets = useSafeAreaInsets();
  // Wait for saved state so returning users never see the welcome slides flash.
  if (!ready) return <View style={{ flex: 1, backgroundColor: C.bg }} />;
  if (!onboarded) return <Redirect href="/welcome" />;
  const active = bookings.filter((b) => !['completed', 'cancelled', 'vendor_no_show'].includes(b.status)).length;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.brand,
        tabBarInactiveTintColor: C.faint,
        tabBarLabelStyle: { fontSize: 11, fontFamily: F.medium, marginTop: 2 },
        tabBarStyle: {
          backgroundColor: C.card,
          borderTopWidth: 0,
          paddingTop: 8,
          paddingBottom: insets.bottom + 8,
          height: 76 + insets.bottom,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          position: 'absolute',
          boxShadow: '0px -4px 24px rgba(20, 22, 40, 0.08)',
        },
        sceneStyle: { backgroundColor: C.bg },
      }}>
      <Tabs.Screen name="index" options={tab('Home', 'home-outline', 'home')} />
      <Tabs.Screen name="explore" options={tab('Explore', 'compass-outline', 'compass')} />
      <Tabs.Screen name="plan" options={tab('Planning', 'clipboard-outline', 'clipboard')} />
      <Tabs.Screen
        name="bookings"
        options={{
          ...tab('Bookings', 'calendar-outline', 'calendar'),
          tabBarBadge: active || undefined,
          tabBarBadgeStyle: { backgroundColor: C.gold, color: C.ink, fontSize: 10, fontFamily: F.semibold },
        }}
      />
    </Tabs>
  );
}
