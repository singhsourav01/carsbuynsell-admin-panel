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
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { apiRequest } from "@/lib/auth";

export default function OTPScreen() {
  const insets = useSafeAreaInsets();
  const { userId, phone, email } = useLocalSearchParams<{ userId: string; phone: string; email: string }>();
  const [phoneOtp, setPhoneOtp] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const emailRef = useRef<TextInput>(null);

  const handleVerify = async () => {
    if (phoneOtp.length < 4 || emailOtp.length < 4) {
      setError("Please enter both OTPs");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/verify-otp", { userId, phoneOtp, emailOtp }, false);
      const data = await res.json();
      if (data.success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace({
          pathname: "/(auth)/pending",
          params: { userId },
        });
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
      style={{ flex: 1, backgroundColor: Colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <LinearGradient
        colors={["#1A0A00", Colors.background]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.4 }}
      />
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 20 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </Pressable>

        <View style={styles.iconCircle}>
          <Ionicons name="shield-checkmark" size={36} color={Colors.primary} />
        </View>
        <Text style={styles.headline}>Verify Identity</Text>
        <Text style={styles.subheadline}>OTPs sent to your phone and email</Text>

        <View style={styles.form}>
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={Colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.otpSection}>
            <View style={styles.otpHeader}>
              <Ionicons name="call-outline" size={16} color={Colors.primary} />
              <Text style={styles.otpLabel}>Phone OTP</Text>
            </View>
            <Text style={styles.otpSentTo}>{phone}</Text>
            <TextInput
              style={styles.otpInput}
              placeholder="Enter 4-digit OTP"
              placeholderTextColor={Colors.textMuted}
              value={phoneOtp}
              onChangeText={(t) => {
                setPhoneOtp(t);
                if (t.length === 4) emailRef.current?.focus();
              }}
              keyboardType="numeric"
              maxLength={4}
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
            />
          </View>

          <View style={styles.otpSection}>
            <View style={styles.otpHeader}>
              <Ionicons name="mail-outline" size={16} color={Colors.primary} />
              <Text style={styles.otpLabel}>Email OTP</Text>
            </View>
            <Text style={styles.otpSentTo}>{email}</Text>
            <TextInput
              ref={emailRef}
              style={styles.otpInput}
              placeholder="Enter 4-digit OTP"
              placeholderTextColor={Colors.textMuted}
              value={emailOtp}
              onChangeText={setEmailOtp}
              keyboardType="numeric"
              maxLength={4}
              returnKeyType="done"
              onSubmitEditing={handleVerify}
            />
          </View>

          <View style={styles.hintBox}>
            <Ionicons name="information-circle-outline" size={14} color={Colors.info} />
            <Text style={styles.hintText}>Use <Text style={{ color: Colors.primary, fontFamily: "Urbanist_700Bold" }}>1234</Text> as OTP for demo</Text>
          </View>

          <Pressable
            style={({ pressed }) => [styles.btn, { opacity: pressed ? 0.85 : 1 }]}
            onPress={handleVerify}
            disabled={loading}
          >
            <LinearGradient
              colors={["#FF8C4C", Colors.primary, "#E05020"]}
              style={styles.btnGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Verify & Continue</Text>}
            </LinearGradient>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 24 },
  backBtn: { marginBottom: 28, width: 40, height: 40, justifyContent: "center" },
  iconCircle: {
    width: 72, height: 72, borderRadius: 24, backgroundColor: "#FF6B2C1A",
    borderWidth: 1, borderColor: "#FF6B2C33", alignItems: "center", justifyContent: "center", marginBottom: 24,
  },
  headline: { fontSize: 32, fontFamily: "Urbanist_700Bold", color: Colors.text, marginBottom: 8 },
  subheadline: { fontSize: 16, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary, marginBottom: 36 },
  form: { gap: 20 },
  errorBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#EF444422", borderWidth: 1, borderColor: "#EF444444", borderRadius: 10, padding: 12,
  },
  errorText: { color: Colors.danger, fontSize: 14, fontFamily: "Urbanist_500Medium", flex: 1 },
  otpSection: {
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.cardBorder,
    borderRadius: 16, padding: 16, gap: 8,
  },
  otpHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  otpLabel: { fontSize: 14, fontFamily: "Urbanist_600SemiBold", color: Colors.primary },
  otpSentTo: { fontSize: 13, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary },
  otpInput: {
    backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: Colors.inputBorder,
    borderRadius: 12, paddingHorizontal: 16, height: 50,
    fontSize: 20, fontFamily: "Urbanist_700Bold", color: Colors.text, letterSpacing: 8,
  },
  hintBox: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#3B82F611", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#3B82F633",
  },
  hintText: { fontSize: 13, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary },
  btn: { borderRadius: 14, overflow: "hidden", marginTop: 8 },
  btnGrad: { height: 54, alignItems: "center", justifyContent: "center" },
  btnText: { fontSize: 16, fontFamily: "Urbanist_700Bold", color: "#fff", letterSpacing: 0.5 },
});
