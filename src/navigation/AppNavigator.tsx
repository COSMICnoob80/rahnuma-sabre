import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import DashboardScreen from '../screens/DashboardScreen';
import BriefingScreen from '../screens/BriefingScreen';
import PortfolioScreen from '../screens/PortfolioScreen';
import BudgetScreen from '../screens/BudgetScreen';
import CalculatorsScreen from '../screens/CalculatorsScreen';
import AdvisoryScreen from '../screens/AdvisoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { View, StyleSheet, StatusBar } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TAB_BAR_CONTENT_HEIGHT = 60;

/** Simple vector icon set — no emoji, no external icon library needed. */
function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const color = focused ? colors.accent : colors.textMuted;
  const size = 22;

  const icons: Record<string, React.ReactNode> = {
    Dashboard: (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Rect x="3" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="2" />
        <Rect x="14" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="2" />
        <Rect x="3" y="14" width="7" height="7" rx="1" stroke={color} strokeWidth="2" />
        <Rect x="14" y="14" width="7" height="7" rx="1" stroke={color} strokeWidth="2" />
      </Svg>
    ),
    Portfolio: (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M3 17l6-6 4 4 8-8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M14 7h7v7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    ),
    Budget: (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
        <Path d="M12 7v10M15 9.5c0-1.5-1.3-2.5-3-2.5s-3 .8-3 2.2c0 3 6 1.6 6 4.6 0 1.4-1.3 2.2-3 2.2s-3-1-3-2.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </Svg>
    ),
    Calculators: (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Rect x="4" y="2" width="16" height="20" rx="2" stroke={color} strokeWidth="2" />
        <Path d="M8 6h8" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <Path d="M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h.01M16 19h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </Svg>
    ),
    Advisory: (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M21 12a8 8 0 01-8 8H4l2-3a8 8 0 1115-5z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M8.5 11h.01M12 11h.01M15.5 11h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </Svg>
    ),
    Settings: (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
        <Path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9c.14.31.22.65.22 1z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    ),
  };

  return (
    <View style={styles.tabIcon}>
      {icons[label] || <View style={{ width: size, height: size }} />}
    </View>
  );
}

function TabsNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: [
          styles.tabBar,
          {
            height: TAB_BAR_CONTENT_HEIGHT + insets.bottom,
            paddingBottom: insets.bottom + spacing.xs,
          },
        ],
        tabBarLabelStyle: styles.tabLabel,
        headerStyle: { backgroundColor: colors.surfaceAlt },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontWeight: '600' },
        headerShadowVisible: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Portfolio" component={PortfolioScreen} />
      <Tab.Screen name="Budget" component={BudgetScreen} />
      <Tab.Screen name="Calculators" component={CalculatorsScreen} />
      <Tab.Screen name="Advisory" component={AdvisoryScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: colors.surfaceAlt },
            headerTintColor: colors.textPrimary,
            headerTitleStyle: { fontWeight: '600' },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="Tabs" component={TabsNavigator} options={{ headerShown: false }} />
          <Stack.Screen
            name="Briefing"
            component={BriefingScreen}
            options={{ title: 'Morning briefing' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surfaceAlt,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingTop: spacing.sm,
  },
  tabLabel: { fontSize: 10, fontWeight: '600', marginBottom: 4 },
  tabIcon: { alignItems: 'center', justifyContent: 'center' },
});
