// Root Layout

import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import 'react-native-reanimated';
import '../i18n'; // Initialize i18n
import { useLanguageStore } from '../store';
import { ToastManager, useToastManagerRef } from '../components/ui/ToastManager';

// Import expo-navigation-bar for Android
let NavigationBar: any = null;
try {
  NavigationBar = require('expo-navigation-bar');
  console.log('✅ Navigation bar control available');
} catch (error) {
  console.log('ℹ️ Navigation bar control not available');
}

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: 'welcome',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { language, setLanguage } = useLanguageStore();
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Initialize language on app start
  useEffect(() => {
    setLanguage(language);
  }, []);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const toastManagerRef = useToastManagerRef();

  // Hide system navigation bar on Android
  useEffect(() => {
    if (Platform.OS === 'android' && NavigationBar) {
      // Hide the navigation bar (immersive mode)
      NavigationBar.setVisibilityAsync('hidden').then(() => {
        console.log('✅ System navigation bar hidden');
      }).catch((error: any) => {
        console.log('ℹ️ Could not hide navigation bar:', error.message);
      });

      // Set navigation bar to dark background color
      NavigationBar.setBackgroundColorAsync('#000000').catch(() => {});
    }
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack initialRouteName="welcome">
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="link-device" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <ToastManager ref={toastManagerRef} />
    </>
  );
}
