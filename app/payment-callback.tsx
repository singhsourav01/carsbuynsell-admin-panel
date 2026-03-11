import { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

// This is a special handling route strictly required for Expo WebBrowser
// to successfully close the browser popup and return control to the main app window.
export default function PaymentCallbackPage() {
  useEffect(() => {
    // Attempt to complete the auth session and close this window immediately.
    // This sends a postMessage back to the original tab that opened openAuthSessionAsync.
    WebBrowser.maybeCompleteAuthSession();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#6C63FF" />
      <Text style={styles.text}>Completing secure payment...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0D0D18',
  },
  text: {
    marginTop: 16,
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});
