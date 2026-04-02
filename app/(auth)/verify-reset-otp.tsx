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
import { apiRequestDirect } from "@/lib/auth";

const OTP_LENGTH = 6;

export default function VerifyResetOTPScreen() {
  const insets = useSafeAreaInsets();
  const { identifier, type } = useLocalSearchParams<{ identifier: string; type: string }>();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const topPad = insets.top + (insets.top < 20 ? 67 : 0);

  const displayIdentifier = type === "email" ? identifier : `+91 ${identifier}`;

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
      setError("Please enter the complete 6-digit OTP");
      return;
    }
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const payload = type === "email" 
        ? { email: identifier, otp: otpValue }
        : { phone: identifier, otp: otpValue };

      const res = await apiRequestDirect(
        "POST",
        "http://13.127.188.130:3002/user/verify-reset-otp",
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
        setSuccess("OTP verified successfully!");

        // Extract reset token
        const resetToken = data?.reset_token || data?.resetToken || data?.data?.reset_token;

        // Navigate to reset password screen
        setTimeout(() => {
          router.push({
            pathname: "/(auth)/reset-password",
            params: {
              resetToken: resetToken || "",
              identifier,
              type,
            },
          });
        }, 800);
      } else {
        const apiMessage = data?.message || data?.error || "Invalid OTP. Please try again.";
        setError(apiMessage);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (err: any) {
      setError(err?.message || "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError("");
    setSuccess("");

    try {
      const payload = type === "email" 
        ? { email: identifier } 
        : { phone: identifier };

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
        setSuccess(data?.message || "OTP resent successfully!");
        setOtp(Array(OTP_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
      } else {
        setError(data?.message || "Failed to resend OTP");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (err: any) {
      setError(err?.message || "Network error. Please try again.");
    } finally {
      setResending(false);
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
          <Text style={styles.appSubtitle}>Verify your identity</Text>
        </View>

        {/* OTP Card */}
        <View style={styles.card}>
          <Text style={styles.verifyLabel}>VERIFY OTP</Text>
          <Text style={styles.sentTo}>
            Sent to <Text style={styles.sentToHighlight}>{displayIdentifier}</Text>
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

          {/* OTP Boxes */}
          <View style={styles.otpRow}>
            {Array(OTP_LENGTH)
              .fill(0)
              .map((_, idx) => (
                <TextInput
                  key={idx}
                  ref={(el) => {
                    inputRefs.current[idx] = el;
                  }}
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
            <Ionicons name="time-outline" size={13} color={Colors.info} />
            <Text style={styles.hintText}>OTP is valid for 15 minutes</Text>
          </View>

          <Pressable
            style={({ pressed }) => [styles.verifyBtn, { opacity: pressed ? 0.85 : 1 }]}
            onPress={handleVerify}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.verifyBtnText}>VERIFY OTP</Text>
            )}
          </Pressable>

          {/* Resend & Edit */}
          <View style={styles.actionRow}>
            <Pressable onPress={handleResend} disabled={resending} style={styles.resendBtn}>
              {resending ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Text style={styles.resendText}>RESEND OTP</Text>
              )}
            </Pressable>

            <View style={styles.actionDivider} />

            <Pressable onPress={() => router.back()} style={styles.editBtn}>
              <Text style={styles.editText}>CHANGE {type === "email" ? "EMAIL" : "NUMBER"}</Text>
            </Pressable>
          </View>
        </View>

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
    alignItems: "center",
  },
  verifyLabel: {
    fontSize: 12,
    fontFamily: "Urbanist_700Bold",
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  sentTo: {
    fontSize: 14,
    fontFamily: "Urbanist_400Regular",
    color: Colors.text,
    marginTop: -8,
  },
  sentToHighlight: {
    fontFamily: "Urbanist_600SemiBold",
    color: Colors.primary,
  },
  successBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ECFDF5",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#A7F3D0",
    width: "100%",
  },
  successText: { color: Colors.success, fontSize: 13, fontFamily: "Urbanist_500Medium", flex: 1 },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
    width: "100%",
  },
  errorText: { color: Colors.danger, fontSize: 13, fontFamily: "Urbanist_500Medium", flex: 1 },
  otpRow: { flexDirection: "row", gap: 10, width: "100%", justifyContent: "center" },
  otpBox: {
    width: 44,
    height: 52,
    borderRadius: 12,
    backgroundColor: Colors.inputBg,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    fontSize: 22,
    fontFamily: "Urbanist_700Bold",
    color: Colors.text,
  },
  otpBoxFilled: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  hintBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EEF6FF",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    width: "100%",
  },
  hintText: { fontSize: 12, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary },
  verifyBtn: {
    height: 54,
    borderRadius: 14,
    backgroundColor: Colors.actionBtn,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  verifyBtnText: { fontSize: 14, fontFamily: "Urbanist_700Bold", color: "#fff", letterSpacing: 1.5 },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  resendBtn: { paddingVertical: 8, paddingHorizontal: 4 },
  resendText: {
    fontSize: 12,
    fontFamily: "Urbanist_700Bold",
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  actionDivider: {
    width: 1,
    height: 16,
    backgroundColor: Colors.inputBorder,
  },
  editBtn: { paddingVertical: 8, paddingHorizontal: 4 },
  editText: {
    fontSize: 12,
    fontFamily: "Urbanist_700Bold",
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  footer: { fontSize: 13, fontFamily: "Urbanist_400Regular", color: Colors.textMuted, marginTop: "auto" },
  footerBold: { fontFamily: "Urbanist_700Bold", color: Colors.text },
});
