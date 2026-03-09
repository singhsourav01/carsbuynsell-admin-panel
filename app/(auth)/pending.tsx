import React, { useEffect } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withTiming, Easing,
} from "react-native-reanimated";
import { Colors } from "@/constants/colors";

const CHECKLIST = [
  { icon: "checkmark-circle", label: "Details submitted", done: true },
  { icon: "checkmark-circle", label: "Mobile number verified", done: true },
  { icon: "checkmark-circle", label: "Email address verified", done: true },
  { icon: "time-outline", label: "Admin approval — pending", done: false },
];

export default function PendingScreen() {
  const insets = useSafeAreaInsets();
  const topPad = insets.top + (insets.top < 20 ? 67 : 0);

  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1.12, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  return (
    <View style={[styles.root, { paddingTop: topPad, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.inner}>

        {/* Logo */}
        <View style={styles.logoBox}><Ionicons name="car" size={34} color="#fff" /></View>
        <Text style={styles.brand}>Cars Buy and Sell</Text>

        {/* Pulse icon */}
        <Animated.View style={[styles.iconCircle, pulseStyle]}>
          <Ionicons name="hourglass-outline" size={44} color={Colors.warning} />
        </Animated.View>

        <Text style={styles.title}>Awaiting Admin Approval</Text>
        <Text style={styles.message}>
          Your account has been submitted successfully. Our team will review and approve your request within{" "}
          <Text style={styles.highlight}>24 hours</Text>.
        </Text>

        {/* Checklist */}
        <View style={styles.checklist}>
          {CHECKLIST.map((item) => (
            <View key={item.label} style={styles.checkItem}>
              <Ionicons
                name={item.icon as any}
                size={18}
                color={item.done ? Colors.success : Colors.warning}
              />
              <Text style={[styles.checkLabel, !item.done && { color: Colors.warning, fontFamily: "Urbanist_600SemiBold" as const }]}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Info box */}
        <View style={styles.infoBox}>
          <Ionicons name="mail-outline" size={15} color={Colors.info} />
          <Text style={styles.infoText}>
            You'll receive an email notification once your account is approved.
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.85 : 1 }]}
          onPress={() => router.replace("/(auth)/login")}
          testID="back-to-signin"
        >
          <Ionicons name="arrow-back-outline" size={16} color={Colors.actionBtn} pointerEvents="none" />
          <Text style={styles.backBtnText} pointerEvents="none">BACK TO SIGN IN</Text>
        </Pressable>
      </View>

      <Text style={styles.footer}>Powered by <Text style={styles.footerBold}>Raj Motors</Text></Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: 24 },
  inner: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  logoBox: { width: 72, height: 72, borderRadius: 20, backgroundColor: Colors.navy, alignItems: "center", justifyContent: "center", marginBottom: 4, shadowColor: Colors.navy, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.22, shadowRadius: 14, elevation: 7 },
  brand: { fontSize: 18, fontFamily: "Urbanist_700Bold", color: Colors.text, marginBottom: 8 },
  iconCircle: { width: 96, height: 96, borderRadius: 28, backgroundColor: "#FFF8E1", borderWidth: 2, borderColor: Colors.warning + "55", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  title: { fontSize: 24, fontFamily: "Urbanist_700Bold", color: Colors.text, textAlign: "center" },
  message: { fontSize: 14, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary, textAlign: "center", lineHeight: 22, paddingHorizontal: 8 },
  highlight: { fontFamily: "Urbanist_700Bold", color: Colors.primary },
  checklist: { width: "100%", backgroundColor: Colors.card, borderRadius: 16, padding: 16, gap: 12, borderWidth: 1, borderColor: Colors.cardBorder, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  checkItem: { flexDirection: "row", alignItems: "center", gap: 12 },
  checkLabel: { fontSize: 14, fontFamily: "Urbanist_500Medium", color: Colors.text },
  infoBox: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: "#EFF6FF", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#BFDBFE", width: "100%" },
  infoText: { flex: 1, fontSize: 13, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary, lineHeight: 20 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.actionBtn, marginTop: 4 },
  backBtnText: { fontSize: 13, fontFamily: "Urbanist_700Bold", color: Colors.actionBtn, letterSpacing: 1 },
  footer: { textAlign: "center", fontSize: 13, fontFamily: "Urbanist_400Regular", color: Colors.textMuted },
  footerBold: { fontFamily: "Urbanist_700Bold", color: Colors.text },
});
