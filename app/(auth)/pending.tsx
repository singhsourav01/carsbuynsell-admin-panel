import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from "react-native-reanimated";
import { Colors } from "@/constants/colors";

export default function PendingScreen() {
  const insets = useSafeAreaInsets();
  const [status] = useState<"PENDING_APPROVAL" | "ACCEPTED">("ACCEPTED");
  const topPad = insets.top + (insets.top < 20 ? 67 : 0);

  const pulseScale = useSharedValue(1);
  useEffect(() => {
    pulseScale.value = withRepeat(withTiming(1.1, { duration: 1200, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, []);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulseScale.value }] }));

  return (
    <View style={[styles.container, { paddingTop: topPad, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.content}>
        <Animated.View style={[styles.iconCircle, pulseStyle]}>
          <Ionicons name="checkmark-circle" size={56} color={Colors.success} />
        </Animated.View>
        <Text style={styles.title}>Account Approved!</Text>
        <Text style={styles.message}>Your account is ready. You can now sign in and start exploring vehicle auctions.</Text>
        <Pressable style={styles.btn} onPress={() => router.replace("/(auth)/login")}>
          <Text style={styles.btnText}>SIGN IN NOW</Text>
        </Pressable>
      </View>
      <Text style={styles.footer}>Powered by <Text style={styles.footerBold}>Raj Motors</Text></Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: 24 },
  content: { flex: 1, alignItems: "center", justifyContent: "center", gap: 20 },
  iconCircle: { width: 100, height: 100, borderRadius: 30, backgroundColor: "#D1FAE5", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  title: { fontSize: 28, fontFamily: "Urbanist_700Bold", color: Colors.text, textAlign: "center" },
  message: { fontSize: 15, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary, textAlign: "center", lineHeight: 24, paddingHorizontal: 16 },
  btn: { height: 54, borderRadius: 14, backgroundColor: Colors.actionBtn, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 },
  btnText: { fontSize: 14, fontFamily: "Urbanist_700Bold", color: "#fff", letterSpacing: 1.5 },
  footer: { textAlign: "center", fontSize: 13, fontFamily: "Urbanist_400Regular", color: Colors.textMuted },
  footerBold: { fontFamily: "Urbanist_700Bold", color: Colors.text },
});
