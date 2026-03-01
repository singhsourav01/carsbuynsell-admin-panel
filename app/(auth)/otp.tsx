import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/auth";

const OTP_LENGTH = 6;

export default function OTPScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const { userId, phone } = useLocalSearchParams<{ userId: string; phone: string }>();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const topPad = insets.top + (insets.top < 20 ? 67 : 0);

  const handleOtpChange = (value: string, idx: number) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[idx] = value.slice(-1);
    setOtp(newOtp);
    if (value && idx < OTP_LENGTH - 1) {
      inputRefs.current[idx + 1]?.focus();
    }
    if (!value && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, idx: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpValue = otp.join("");
    if (otpValue.length < OTP_LENGTH) {
      setError("Please enter the complete OTP");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/verify-phone-otp", { userId, otp: otpValue }, false);
      const data = await res.json();
      if (data.success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await login(data.data.token, data.data.user);
        router.replace("/(tabs)");
      } else {
        setError(data.message || "Invalid OTP");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: topPad }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoArea}>
          <View style={styles.logoBox}>
            <Ionicons name="car" size={36} color="#fff" />
          </View>
          <Text style={styles.appTitle}>Cars Buy and Sell</Text>
          <Text style={styles.appSubtitle}>Driving Deals Funding Dreams..</Text>
        </View>

        {/* OTP Card */}
        <View style={styles.card}>
          <Text style={styles.verifyLabel}>VERIFY OTP</Text>
          <Text style={styles.sentTo}>Sent to {phone}</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={15} color={Colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* OTP Boxes */}
          <View style={styles.otpRow}>
            {Array(OTP_LENGTH).fill(0).map((_, idx) => (
              <TextInput
                key={idx}
                ref={(el) => { inputRefs.current[idx] = el; }}
                style={[styles.otpBox, otp[idx] ? styles.otpBoxFilled : {}]}
                value={otp[idx]}
                onChangeText={(v) => handleOtpChange(v, idx)}
                onKeyPress={(e) => handleKeyPress(e, idx)}
                keyboardType="numeric"
                maxLength={1}
                returnKeyType={idx === OTP_LENGTH - 1 ? "done" : "next"}
                onSubmitEditing={idx === OTP_LENGTH - 1 ? handleVerify : undefined}
                textAlign="center"
                selectTextOnFocus
              />
            ))}
          </View>

          <View style={styles.hintBox}>
            <Ionicons name="information-circle-outline" size={13} color={Colors.info} />
            <Text style={styles.hintText}>Demo OTP: <Text style={{ fontFamily: "Urbanist_700Bold", color: Colors.primary }}>123456</Text></Text>
          </View>

          <Pressable
            style={({ pressed }) => [styles.verifyBtn, { opacity: pressed ? 0.85 : 1 }]}
            onPress={handleVerify}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.verifyBtnText}>VERIFY & LOGIN</Text>}
          </Pressable>

          <Pressable onPress={() => router.back()} style={styles.editRow}>
            <Text style={styles.editText}>EDIT MOBILE NUMBER</Text>
          </Pressable>
        </View>

        <Text style={styles.footer}>
          Powered by <Text style={styles.footerBold}>Raj Motors</Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  container: { flexGrow: 1, paddingHorizontal: 24, alignItems: "center" },
  logoArea: { alignItems: "center", marginBottom: 40, marginTop: 16 },
  logoBox: {
    width: 88, height: 88, borderRadius: 24, backgroundColor: Colors.navy,
    alignItems: "center", justifyContent: "center", marginBottom: 20,
    shadowColor: Colors.navy, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25, shadowRadius: 16, elevation: 8,
  },
  appTitle: { fontSize: 28, fontFamily: "Urbanist_700Bold", color: Colors.text, marginBottom: 6 },
  appSubtitle: { fontSize: 15, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary },
  card: {
    width: "100%", backgroundColor: Colors.card, borderRadius: 20, padding: 24,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 16,
    elevation: 4, marginBottom: 24, gap: 16, alignItems: "center",
  },
  verifyLabel: { fontSize: 12, fontFamily: "Urbanist_700Bold", color: Colors.textSecondary, letterSpacing: 1 },
  sentTo: { fontSize: 14, fontFamily: "Urbanist_400Regular", color: Colors.text, marginTop: -8 },
  errorBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#FEF2F2", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#FECACA", width: "100%",
  },
  errorText: { color: Colors.danger, fontSize: 13, fontFamily: "Urbanist_500Medium", flex: 1 },
  otpRow: { flexDirection: "row", gap: 10, width: "100%", justifyContent: "center" },
  otpBox: {
    width: 44, height: 52, borderRadius: 12,
    backgroundColor: Colors.inputBg, borderWidth: 1.5, borderColor: Colors.inputBorder,
    fontSize: 22, fontFamily: "Urbanist_700Bold", color: Colors.text,
  },
  otpBoxFilled: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  hintBox: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#EEF6FF", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: "#BFDBFE", width: "100%",
  },
  hintText: { fontSize: 12, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary },
  verifyBtn: {
    height: 54, borderRadius: 14, backgroundColor: Colors.actionBtn,
    alignItems: "center", justifyContent: "center", width: "100%",
  },
  verifyBtnText: { fontSize: 14, fontFamily: "Urbanist_700Bold", color: "#fff", letterSpacing: 1.5 },
  editRow: { paddingVertical: 8 },
  editText: { fontSize: 12, fontFamily: "Urbanist_700Bold", color: Colors.textSecondary, letterSpacing: 1 },
  footer: { fontSize: 13, fontFamily: "Urbanist_400Regular", color: Colors.textMuted, marginTop: 16 },
  footerBold: { fontFamily: "Urbanist_700Bold", color: Colors.text },
});
