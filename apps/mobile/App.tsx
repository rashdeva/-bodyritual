import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppProviders } from './src/providers/AppProviders';
import { BodyRitualHomeScreen } from './src/screens/BodyRitualHomeScreen';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProviders>
          <StatusBar style="dark" />
          <BodyRitualHomeScreen />
        </AppProviders>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
