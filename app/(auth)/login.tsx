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
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Device from "expo-device";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequestDirect } from "@/lib/auth";

// Helper to deep-search for a key in nested object
function findValue(obj: any, key: string): any {
  if (!obj || typeof obj !== "object") return null;
  if (obj[key]) return obj[key];
  for (const k of Object.keys(obj)) {
    const found = findValue(obj[k], key);
    if (found) return found;
  }
  return null;
}

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const topPad = insets.top + (insets.top < 20 ? 67 : 0);

  const registerDevice = async (data: any) => {
    try {
      console.log("=== SIGNIN RESPONSE DATA ===", JSON.stringify(data, null, 2));

      const userId = findValue(data, "id") || findValue(data, "user_id") || findValue(data, "userId");
      const accessToken = findValue(data, "access_token") || findValue(data, "token");
      const refreshToken = findValue(data, "refresh_token") || findValue(data, "refreshToken");

      const deviceName = Device.modelName || Device.deviceName || "Unknown Device";
      const deviceType = Platform.OS === "ios" ? "IOS" : "ANDROID";

      const payload = {
        uld_user_id: userId || "",
        uld_fcm_token: "not-available",
        uld_device_name: deviceName,
        uld_device_type: deviceType,
        uld_access_token: accessToken || "",
        uld_refresh_token: refreshToken || "",
      };
      console.log("=== DEVICE REGISTRATION PAYLOAD ===", JSON.stringify(payload, null, 2));

      const res = await apiRequestDirect("POST", "http://localhost:8002/user/user-device", payload);
      const resText = await res.text();
      console.log("=== DEVICE REGISTRATION RESPONSE ===", res.status, resText);
    } catch (err: any) {
      console.log("=== DEVICE REGISTRATION ERROR ===", err?.message || err);
    }
  };

  const handleSignin = async () => {
    const cleaned = phone.trim();
    if (!cleaned) {
      setError("Please enter your email or mobile number");
      return;
    }
    if (!password) {
      setError("Please enter your password");
      return;
    }
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      // If it looks like an email, send as-is; otherwise just digits
      const isEmail = cleaned.includes("@");
      const userDetail = isEmail ? cleaned : `${cleaned.replace(/\D/g, "")}`;

      const res = await apiRequestDirect("POST", "http://localhost:8000/auth/signin", {
        user_details: userDetail,
        password,
      });

      const rawText = await res.text();
      let data: any = {};
      try { data = JSON.parse(rawText); } catch { data = { message: rawText }; }

      if (res.ok) {

        // Extract token from known response paths
        const token =
          data?.access_token ||
          data?.data?.access_token ||
          data?.token ||
          data?.data?.token ||
          data?.data?.uld_access_token;

        const refreshToken =
          data?.refresh_token ||
          data?.data?.refresh_token ||
          data?.data?.uld_refresh_token;

        const userData = data?.user || data?.data?.user || data?.data;

        // Only store if it looks like a real JWT
        if (token && typeof token === "string" && token.startsWith("eyJ")) {
          await login(token, userData || { id: "", fullName: "", email: "", phone: "" }, refreshToken || undefined);
        }

        // Register device in background
        registerDevice(data);

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSuccess(data?.message || "Login successful! Redirecting...");
        setTimeout(() => router.replace("/(tabs)"), 800);
      } else {
        // Show API error message (not approved, not verified, etc.)
        const apiMessage = data?.message || data?.error || "Sign in failed. Please try again.";
        setError(apiMessage);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (err: any) {
      setError(err?.message || "Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // Demo login commented out — no longer using old API
  // const handleDemoLogin = async () => { ... };

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
          {success ? (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle-outline" size={15} color={Colors.success} />
              <Text style={styles.successText}>{success}</Text>
            </View>
          ) : null}

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={15} color={Colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Text style={styles.fieldLabel}>ENTER EMAIL OR MOBILE NUMBER</Text>
          <View style={styles.phoneRow}>
            <View style={styles.countryCode}>
              <Text style={styles.countryCodeText}>+91</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              placeholder="Email or 10-digit number"
              placeholderTextColor={Colors.textMuted}
              value={phone}
              onChangeText={setPhone}
              keyboardType="default"
              autoCapitalize="none"
              returnKeyType="next"
              onSubmitEditing={() => { }}
            />
          </View>
          <Text style={styles.fieldLabel}>ENTER PASSWORD</Text>
          <View style={styles.phoneRow}>

            <TextInput
              style={styles.phoneInput}
              placeholder="Admin@123"
              placeholderTextColor={Colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={true}
              keyboardType="default"
              maxLength={15}
              returnKeyType="done"
              onSubmitEditing={handleSignin}
            />
          </View>

          <Pressable
            style={({ pressed }) => [styles.otpBtn, { opacity: pressed ? 0.85 : 1 }]}
            onPress={handleSignin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.otpBtnText}>SUBMIT</Text>
            )}
          </Pressable>
        </View>

        {/* Demo Login */}
        {/* <View style={styles.demoSection}>
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
        </View> */}

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
  successBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#ECFDF5", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#A7F3D0",
  },
  successText: { color: Colors.success, fontSize: 13, fontFamily: "Urbanist_500Medium", flex: 1 },
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
