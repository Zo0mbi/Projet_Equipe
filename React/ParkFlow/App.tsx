import React from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { SettingsProvider } from './src/context/SettingsContext';

export default function App() {
  return (
    <SettingsProvider>
      <View style={styles.container}>
        <AppNavigator />
      </View>
    </SettingsProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    ...Platform.select({
      web: {
        // Empêche l'application web de se réduire en dessous de 360px 
        minWidth: 360,
        overflowX: 'auto', // Permet le défilement horizontal si l'écran est plus petit que 360px
      } as any,
    }),
  },
});
