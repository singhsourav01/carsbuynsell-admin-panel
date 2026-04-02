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
import { apiRequestDirect } from "@/lib/auth";

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const [inputType, setInputType] = useState<"email" | "phone">("phone");
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const topPad = insets.top + (insets.top < 20 ? 67 : 0);

  const handleRequestOTP = async () => {
    const cleaned = inputValue.trim();
    if (!cleaned) {
      setError(inputType === "email" ? "Please enter your email address" : "Please enter your mobile number");
      return;
    }

    // Basic validation
    if (inputType === "email" && !cleaned.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    if (inputType === "phone" && cleaned.replace(/\D/g, "").length < 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const payload = inputType === "email" 
        ? { email: cleaned } 
        : { phone: cleaned.replace(/\D/g, "") };

      const res = await apiRequestDirect(
        "POST",
        "http://13.127.188.130:3002/user/forgot-password",
        payload
      );

      const rawText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(rawText);
      } catch {
        data = { message: rawText };
      }

      if (res.ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSuccess(data?.message || "OTP sent successfully!");
        
        // Navigate to OTP verification screen
        setTimeout(() => {
          router.push({
            pathname: "/(auth)/verify-reset-otp",
            params: {
              identifier: inputType === "email" ? cleaned : cleaned.replace(/\D/g, ""),
              type: inputType,
            },
          });
        }, 800);
      } else {
        const apiMessage = data?.message || data?.error || "Failed to send OTP. Please try again.";
        setError(apiMessage);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (err: any) {
      setError(err?.message || "Network error. Please check your connection.");
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
          <Text style={styles.appTitle}>CarsbuyNsell</Text>
          <Text style={styles.appSubtitle}>Reset your password</Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Forgot Password</Text>
          <Text style={styles.cardSubtitle}>
            Enter your registered {inputType === "email" ? "email" : "mobile number"} to receive an OTP
          </Text>

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

          {/* Toggle Tabs */}
          <View style={styles.toggleRow}>
            <Pressable
              style={[styles.toggleBtn, inputType === "phone" && styles.toggleBtnActive]}
              onPress={() => {
                setInputType("phone");
                setInputValue("");
                setError("");
              }}
            >
              <Ionicons
                name="call-outline"
                size={16}
                color={inputType === "phone" ? Colors.primary : Colors.textMuted}
              />
              <Text style={[styles.toggleText, inputType === "phone" && styles.toggleTextActive]}>
                Phone
              </Text>
            </Pressable>
            <Pressable
              style={[styles.toggleBtn, inputType === "email" && styles.toggleBtnActive]}
              onPress={() => {
                setInputType("email");
                setInputValue("");
                setError("");
              }}
            >
              <Ionicons
                name="mail-outline"
                size={16}
                color={inputType === "email" ? Colors.primary : Colors.textMuted}
              />
              <Text style={[styles.toggleText, inputType === "email" && styles.toggleTextActive]}>
                Email
              </Text>
            </Pressable>
          </View>

          <Text style={styles.fieldLabel}>
            {inputType === "email" ? "EMAIL ADDRESS" : "MOBILE NUMBER"}
          </Text>
          <View style={styles.inputRow}>
            {inputType === "phone" && (
              <View style={styles.countryCode}>
                <Text style={styles.countryCodeText}>+91</Text>
              </View>
            )}
            <TextInput
              style={styles.input}
              placeholder={inputType === "email" ? "your@email.com" : "10-digit number"}
              placeholderTextColor={Colors.textMuted}
              value={inputValue}
              onChangeText={setInputValue}
              keyboardType={inputType === "email" ? "email-address" : "phone-pad"}
              autoCapitalize="none"
              maxLength={inputType === "phone" ? 10 : 100}
              returnKeyType="done"
              onSubmitEditing={handleRequestOTP}
            />
          </View>

          <Pressable
            style={({ pressed }) => [styles.submitBtn, { opacity: pressed ? 0.85 : 1 }]}
            onPress={handleRequestOTP}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>SEND OTP</Text>
            )}
          </Pressable>
        </View>

        {/* Back to Login */}
        <Pressable onPress={() => router.back()} style={styles.backRow}>
          <Ionicons name="arrow-back" size={16} color={Colors.primary} />
          <Text style={styles.backText}>Back to Login</Text>
        </Pressable>

        {/* Footer */}
        <Text style={styles.footer}>
          Developed by <Text style={styles.footerBold}>Raj Motors</Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  container: { flexGrow: 1, paddingHorizontal: 24, alignItems: "center" },
  logoArea: { alignItems: "center", marginBottom: 32, marginTop: 16 },
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
  cardTitle: {
    fontSize: 20,
    fontFamily: "Urbanist_700Bold",
    color: Colors.text,
    textAlign: "center",
  },
  cardSubtitle: {
    fontSize: 14,
    fontFamily: "Urbanist_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: -8,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorText: { color: Colors.danger, fontSize: 13, fontFamily: "Urbanist_500Medium", flex: 1 },
  successBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ECFDF5",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  successText: { color: Colors.success, fontSize: 13, fontFamily: "Urbanist_500Medium", flex: 1 },
  toggleRow: {
    flexDirection: "row",
    backgroundColor: Colors.inputBg,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  toggleBtnActive: {
    backgroundColor: Colors.card,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: {
    fontSize: 14,
    fontFamily: "Urbanist_600SemiBold",
    color: Colors.textMuted,
  },
  toggleTextActive: {
    color: Colors.primary,
  },
  fieldLabel: {
    fontSize: 11,
    fontFamily: "Urbanist_700Bold",
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  inputRow: {
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
  input: {
    flex: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: "Urbanist_400Regular",
    color: Colors.text,
  },
  submitBtn: {
    height: 54,
    borderRadius: 14,
    backgroundColor: Colors.actionBtn,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnText: {
    fontSize: 14,
    fontFamily: "Urbanist_700Bold",
    color: "#fff",
    letterSpacing: 1.5,
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 24,
  },
  backText: {
    fontSize: 14,
    fontFamily: "Urbanist_600SemiBold",
    color: Colors.primary,
  },
  footer: { fontSize: 13, fontFamily: "Urbanist_400Regular", color: Colors.textMuted, marginTop: "auto" },
  footerBold: { fontFamily: "Urbanist_700Bold", color: Colors.text },
});
