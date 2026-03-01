import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/auth";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState("");

  const topPad = insets.top + (insets.top < 20 ? 67 : 0);

  const handleGetOtp = async () => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length < 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const fullPhone = `+91 ${cleaned}`;
      const res = await apiRequest("POST", "/api/auth/request-otp", { phone: fullPhone }, false);
      const data = await res.json();
      if (data.success) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({
          pathname: "/(auth)/otp",
          params: { userId: data.data.userId, phone: fullPhone },
        });
      } else {
        setError(data.message || "Failed to send OTP");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/demo-login", {}, false);
      const data = await res.json();
      if (data.success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await login(data.data.token, data.data.user);
        router.replace("/(tabs)");
      }
    } catch {
      setError("Demo login failed. Please try again.");
    } finally {
      setDemoLoading(false);
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

        {/* Form Card */}
        <View style={styles.card}>
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={15} color={Colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Text style={styles.fieldLabel}>ENTER MOBILE NUMBER</Text>
          <View style={styles.phoneRow}>
            <View style={styles.countryCode}>
              <Text style={styles.countryCodeText}>+91</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              placeholder="98765 43210"
              placeholderTextColor={Colors.textMuted}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={10}
              returnKeyType="done"
              onSubmitEditing={handleGetOtp}
            />
          </View>

          <Pressable
            style={({ pressed }) => [styles.otpBtn, { opacity: pressed ? 0.85 : 1 }]}
            onPress={handleGetOtp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.otpBtnText}>GET OTP</Text>
            )}
          </Pressable>
        </View>

        {/* Demo Login */}
        <View style={styles.demoSection}>
          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or explore instantly</Text>
            <View style={styles.divider} />
          </View>

          <Pressable
            style={({ pressed }) => [styles.demoBtn, { opacity: pressed ? 0.85 : 1 }]}
            onPress={handleDemoLogin}
            disabled={demoLoading}
          >
            {demoLoading ? (
              <ActivityIndicator color={Colors.primary} size="small" />
            ) : (
              <>
                <Ionicons name="flash" size={16} color={Colors.primary} />
                <Text style={styles.demoBtnText}>Try Demo Login</Text>
              </>
            )}
          </Pressable>
          <Text style={styles.demoHint}>Instantly access the app with sample data</Text>
        </View>

        {/* Sign Up Link */}
        <View style={styles.signupRow}>
          <Text style={styles.signupText}>New here? </Text>
          <Pressable onPress={() => router.push("/(auth)/register")} hitSlop={8}>
            <Text style={styles.signupLink}>CREATE ACCOUNT</Text>
          </Pressable>
        </View>

        {/* Footer */}
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
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: Colors.navy,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  appTitle: { fontSize: 28, fontFamily: "Urbanist_700Bold", color: Colors.text, marginBottom: 6 },
  appSubtitle: { fontSize: 15, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary },
  card: {
    width: "100%",
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 24,
    gap: 16,
  },
  errorBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#FEF2F2", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#FECACA",
  },
  errorText: { color: Colors.danger, fontSize: 13, fontFamily: "Urbanist_500Medium", flex: 1 },
  fieldLabel: {
    fontSize: 11,
    fontFamily: "Urbanist_700Bold",
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.inputBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    height: 56,
    overflow: "hidden",
  },
  countryCode: {
    paddingHorizontal: 16,
    height: "100%",
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: Colors.inputBorder,
    backgroundColor: "#EAEFF8",
  },
  countryCodeText: {
    fontSize: 16,
    fontFamily: "Urbanist_600SemiBold",
    color: Colors.text,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: "Urbanist_400Regular",
    color: Colors.text,
  },
  otpBtn: {
    height: 54,
    borderRadius: 14,
    backgroundColor: Colors.actionBtn,
    alignItems: "center",
    justifyContent: "center",
  },
  otpBtnText: {
    fontSize: 14,
    fontFamily: "Urbanist_700Bold",
    color: "#fff",
    letterSpacing: 1.5,
  },
  demoSection: { width: "100%", alignItems: "center", gap: 16, marginBottom: 32 },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12, width: "100%" },
  divider: { flex: 1, height: 1, backgroundColor: Colors.cardBorder },
  dividerText: { fontSize: 12, fontFamily: "Urbanist_400Regular", color: Colors.textMuted },
  demoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.primaryLight,
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: Colors.primary + "44",
    width: "100%",
    justifyContent: "center",
  },
  demoBtnText: { fontSize: 15, fontFamily: "Urbanist_700Bold", color: Colors.primary },
  demoHint: { fontSize: 12, fontFamily: "Urbanist_400Regular", color: Colors.textMuted, textAlign: "center" },
  signupRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  signupText: { fontSize: 14, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary },
  signupLink: { fontSize: 13, fontFamily: "Urbanist_700Bold", color: Colors.primary, letterSpacing: 0.5 },
  footer: { fontSize: 13, fontFamily: "Urbanist_400Regular", color: Colors.textMuted, marginTop: "auto" },
  footerBold: { fontFamily: "Urbanist_700Bold", color: Colors.text },
});
