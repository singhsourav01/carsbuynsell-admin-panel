import React, { useState, useRef } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { apiRequestDirect } from "@/lib/auth";

const OTP_LENGTH = 6;

function StepItem({ n, text, state }: { n: string; text: string; state: "done" | "active" | "pending" }) {
  return (
    <View style={steps.item}>
      <View style={[steps.num, state === "done" ? steps.numDone : state === "active" ? steps.numActive : {}]}>
        {state === "done"
          ? <Ionicons name="checkmark" size={11} color="#fff" />
          : <Text style={[steps.numText, state === "active" && steps.numTextActive]}>{n}</Text>
        }
      </View>
      <Text style={[steps.text, state === "active" && { color: Colors.primary, fontFamily: "Urbanist_600SemiBold" as const }]}>{text}</Text>
    </View>
  );
}

export default function VerifyPhoneScreen() {
  const insets = useSafeAreaInsets();
  const { phone, email } = useLocalSearchParams<{ phone: string; email: string }>();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const topPad = insets.top + (insets.top < 20 ? 67 : 0);

  const handleOtpChange = (value: string, idx: number) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[idx] = value.slice(-1);
    setOtp(newOtp);
    if (value && idx < OTP_LENGTH - 1) inputRefs.current[idx + 1]?.focus();
    if (!value && idx > 0) inputRefs.current[idx - 1]?.focus();
  };

  const handleKeyPress = (e: any, idx: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[idx] && idx > 0) inputRefs.current[idx - 1]?.focus();
  };

  const handleVerify = async () => {
    const otpValue = otp.join("");
    if (otpValue.length < OTP_LENGTH) { setError("Please enter all 6 digits"); return; }
    setError(""); setLoading(true);
    try {
      const res = await apiRequestDirect("POST", "http://13.127.188.130:3001/auth/verify-phone", { otp: otpValue, phone });
      const rawText = await res.text();
      let data: any = {};
      try { data = JSON.parse(rawText); } catch { data = { message: rawText }; }
      if (res.ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace({ pathname: "/(auth)/verify-email", params: { phone, email } });
      } else {
        setError(data?.message || data?.error || "Invalid OTP");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (err: any) { setError(err?.message || "Verification failed. Please try again."); }
    finally { setLoading(false); }
  };

  const handleResend = async () => {
    setResending(true); setError(""); setSuccess("");
    try {
      const res = await apiRequestDirect("POST", "http://13.127.188.130:3001/auth/send-phone-otp", { phone });
      const rawText = await res.text();
      let data: any = {};
      try { data = JSON.parse(rawText); } catch { data = { message: rawText }; }
      if (res.ok) {
        setSuccess(data?.message || "OTP resent successfully");
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        setError(data?.message || data?.error || "Failed to resend OTP");
      }
    } catch { setError("Failed to resend OTP. Please try again."); }
    finally { setResending(false); }
  };

  return (
    <KeyboardAvoidingView style={[styles.root, { paddingTop: topPad }]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 32 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Logo */}
        <View style={styles.logoArea}>
          <View style={styles.logoBox}><Ionicons name="car" size={34} color="#fff" /></View>
          <Text style={styles.appTitle}>Verify Mobile</Text>
          <Text style={styles.appSubtitle}>Cars Buy and Sell</Text>
        </View>

        {/* Steps */}
        <View style={styles.stepsRow}>
          <StepItem n="1" text="Details" state="done" />
          <View style={styles.stepLine} />
          <StepItem n="2" text="Mobile OTP" state="active" />
          <View style={styles.stepLine} />
          <StepItem n="3" text="Email OTP" state="pending" />
          <View style={styles.stepLine} />
          <StepItem n="4" text="Approval" state="pending" />
        </View>

        {/* OTP Card */}
        <View style={styles.card}>
          <View style={styles.phoneBadge}>
            <Ionicons name="phone-portrait-outline" size={16} color={Colors.primary} />
            <Text style={styles.phoneBadgeText}>OTP sent to {phone}</Text>
          </View>

          <Text style={styles.cardTitle}>VERIFY OTP</Text>
          <Text style={styles.cardSub}>Enter the 6-digit code sent to your mobile number</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={14} color={Colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {success ? (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle-outline" size={14} color={Colors.success} />
              <Text style={styles.successText}>{success}</Text>
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

          {/* Demo hint */}
          <View style={styles.hintBox}>
            <Ionicons name="information-circle-outline" size={13} color={Colors.info} />
            <Text style={styles.hintText}>Demo OTP: <Text style={styles.hintCode}>123456</Text></Text>
          </View>

          <Pressable
            style={({ pressed }) => [styles.verifyBtn, { opacity: pressed ? 0.85 : 1 }]}
            onPress={handleVerify}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.verifyBtnText}>VERIFY & CONTINUE</Text>}
          </Pressable>

          <Pressable onPress={handleResend} disabled={resending} style={styles.resendRow}>
            {resending
              ? <ActivityIndicator size="small" color={Colors.primary} />
              : <Text style={styles.resendText}>Didn't receive? <Text style={styles.resendLink}>Resend OTP</Text></Text>
            }
          </Pressable>
        </View>

        <Text style={styles.footer}>Powered by <Text style={styles.footerBold}>Raj Motors</Text></Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  container: { flexGrow: 1, paddingHorizontal: 24, alignItems: "center" },
  logoArea: { alignItems: "center", marginBottom: 20, marginTop: 12 },
  logoBox: { width: 80, height: 80, borderRadius: 22, backgroundColor: Colors.navy, alignItems: "center", justifyContent: "center", marginBottom: 14, shadowColor: Colors.navy, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.22, shadowRadius: 14, elevation: 7 },
  appTitle: { fontSize: 26, fontFamily: "Urbanist_700Bold", color: Colors.text, marginBottom: 2 },
  appSubtitle: { fontSize: 14, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary },
  stepsRow: { flexDirection: "row", alignItems: "center", marginBottom: 20, width: "100%" },
  stepLine: { flex: 1, height: 1.5, backgroundColor: Colors.cardBorder },
  card: { width: "100%", backgroundColor: Colors.card, borderRadius: 20, padding: 22, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 16, elevation: 4, marginBottom: 20, gap: 14, alignItems: "center" },
  phoneBadge: { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: Colors.primaryLight, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: Colors.primary + "33" },
  phoneBadgeText: { fontSize: 13, fontFamily: "Urbanist_500Medium", color: Colors.primary },
  cardTitle: { fontSize: 13, fontFamily: "Urbanist_700Bold", color: Colors.textSecondary, letterSpacing: 1 },
  cardSub: { fontSize: 13, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary, textAlign: "center", marginTop: -6 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "#FEF2F2", borderRadius: 10, padding: 11, borderWidth: 1, borderColor: "#FECACA", width: "100%" },
  errorText: { flex: 1, fontSize: 13, fontFamily: "Urbanist_500Medium", color: Colors.danger },
  successBox: { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "#ECFDF5", borderRadius: 10, padding: 11, borderWidth: 1, borderColor: "#A7F3D0", width: "100%" },
  successText: { flex: 1, fontSize: 13, fontFamily: "Urbanist_500Medium", color: Colors.success },
  otpRow: { flexDirection: "row", gap: 8, width: "100%", justifyContent: "center" },
  otpBox: { width: 44, height: 52, borderRadius: 12, backgroundColor: Colors.inputBg, borderWidth: 1.5, borderColor: Colors.inputBorder, fontSize: 22, fontFamily: "Urbanist_700Bold", color: Colors.text },
  otpBoxFilled: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  hintBox: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#EEF6FF", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: "#BFDBFE", width: "100%" },
  hintText: { fontSize: 12, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary },
  hintCode: { fontFamily: "Urbanist_700Bold", color: Colors.primary },
  verifyBtn: { height: 54, borderRadius: 14, backgroundColor: Colors.actionBtn, alignItems: "center", justifyContent: "center", width: "100%" },
  verifyBtnText: { fontSize: 14, fontFamily: "Urbanist_700Bold", color: "#fff", letterSpacing: 1.5 },
  resendRow: { paddingVertical: 4 },
  resendText: { fontSize: 13, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary, textAlign: "center" },
  resendLink: { fontFamily: "Urbanist_700Bold", color: Colors.primary },
  footer: { fontSize: 13, fontFamily: "Urbanist_400Regular", color: Colors.textMuted, marginBottom: 8 },
  footerBold: { fontFamily: "Urbanist_700Bold", color: Colors.text },
});

const steps = StyleSheet.create({
  item: { alignItems: "center", gap: 5 },
  num: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.inputBorder, alignItems: "center", justifyContent: "center" },
  numDone: { backgroundColor: Colors.success, borderColor: Colors.success },
  numActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  numText: { fontSize: 11, fontFamily: "Urbanist_700Bold", color: Colors.textMuted },
  numTextActive: { color: "#fff" },
  text: { fontSize: 10, fontFamily: "Urbanist_400Regular", color: Colors.textMuted, textAlign: "center" },
});
