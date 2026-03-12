import React, { useState, useRef } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { apiRequestDirect } from "@/lib/auth";

interface FormErrors { fullName?: string; phone?: string; email?: string; password?: string; general?: string; }

function validate(fullName: string, phone: string, email: string, password: string): FormErrors {
  const errs: FormErrors = {};
  if (!fullName.trim() || fullName.trim().length < 2) errs.fullName = "Please enter your full name";
  if (phone.replace(/\D/g, "").length !== 10) errs.phone = "Enter a valid 10-digit mobile number";
  if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = "Enter a valid email address";
  if (!password || password.length < 6) errs.password = "Password must be at least 6 characters";
  return errs;
}

function StepItem({ n, text, active }: { n: string; text: string; active?: boolean }) {
  return (
    <View style={styles.stepItem}>
      <View style={[styles.stepNum, active && styles.stepNumActive]}>
        <Text style={[styles.stepNumText, active && styles.stepNumTextActive]}>{n}</Text>
      </View>
      <Text style={[styles.stepText, active && { color: Colors.primary, fontFamily: "Urbanist_600SemiBold" as const }]}>{text}</Text>
    </View>
  );
}

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const phoneRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passRef = useRef<TextInput>(null);

  const topPad = insets.top + (insets.top < 20 ? 67 : 0);

  const clearError = (field: keyof FormErrors) => setErrors(p => ({ ...p, [field]: undefined }));

  const handleSubmit = async () => {
    const errs = validate(fullName, phone, email, password);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const fullPhone = `${phone.replace(/\D/g, "")}`;
      const res = await apiRequestDirect("POST", "http://13.201.55.131:3001/auth/signup", {
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: fullPhone,
      });

      // Read response as text first, then try to parse as JSON
      const rawText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(rawText);
      } catch {
        // Response is not JSON
        data = { message: rawText || "Unexpected server response" };
      }

      if (res.ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSuccess(data?.message || "Account created successfully!");
        setTimeout(() => {
          router.push({
            pathname: "/(auth)/verify-phone",
            params: { phone: fullPhone, email: email.trim().toLowerCase() },
          });
        }, 800);
      } else {
        // Show error message from API response
        const apiMessage = data?.message || data?.error || `Registration failed (${res.status})`;
        setErrors({ general: apiMessage });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (err: any) {
      setErrors({ general: err?.message || "Network error. Please check your connection." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.root, { paddingTop: topPad }]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoArea}>
          <View style={styles.logoBox}><Ionicons name="car" size={34} color="#fff" /></View>
          <Text style={styles.appTitle}>Create Account</Text>
          <Text style={styles.appSubtitle}>Join Cars Buy and Sell today</Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          {success ? (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
              <Text style={styles.successText}>{success}</Text>
            </View>
          ) : null}

          {errors.general ? (
            <View style={styles.alertBox}>
              <Ionicons name="alert-circle" size={16} color={Colors.danger} />
              <Text style={styles.alertText}>{errors.general}</Text>
            </View>
          ) : null}

          {/* Full Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>FULL NAME</Text>
            <View style={[styles.inputRow, errors.fullName ? styles.inputRowError : {}]}>
              <Ionicons name="person-outline" size={16} color={errors.fullName ? Colors.danger : Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={(v) => { setFullName(v); clearError("fullName"); }}
                placeholder="e.g. Rahul Sharma"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => phoneRef.current?.focus()}
              />
            </View>
            {errors.fullName ? <FieldError msg={errors.fullName} /> : null}
          </View>

          {/* Phone */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>MOBILE NUMBER</Text>
            <View style={[styles.inputRow, errors.phone ? styles.inputRowError : {}]}>
              <View style={styles.countryCode}><Text style={styles.countryCodeText}>+91</Text></View>
              <TextInput
                ref={phoneRef}
                style={[styles.input, { paddingLeft: 8 }]}
                value={phone}
                onChangeText={(v) => { setPhone(v.replace(/\D/g, "").slice(0, 10)); clearError("phone"); }}
                placeholder="98765 43210"
                placeholderTextColor={Colors.textMuted}
                keyboardType="phone-pad"
                returnKeyType="next"
                maxLength={10}
                onSubmitEditing={() => emailRef.current?.focus()}
              />
            </View>
            {errors.phone ? <FieldError msg={errors.phone} /> : null}
          </View>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
            <View style={[styles.inputRow, errors.email ? styles.inputRowError : {}]}>
              <Ionicons name="mail-outline" size={16} color={errors.email ? Colors.danger : Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                ref={emailRef}
                style={styles.input}
                value={email}
                onChangeText={(v) => { setEmail(v); clearError("email"); }}
                placeholder="rahul@example.com"
                placeholderTextColor={Colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => passRef.current?.focus()}
              />
            </View>
            {errors.email ? <FieldError msg={errors.email} /> : null}
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>PASSWORD</Text>
            <View style={[styles.inputRow, errors.password ? styles.inputRowError : {}]}>
              <Ionicons name="lock-closed-outline" size={16} color={errors.password ? Colors.danger : Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                ref={passRef}
                style={styles.input}
                value={password}
                onChangeText={(v) => { setPassword(v); clearError("password"); }}
                placeholder="Min. 6 characters"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showPass}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />
              <Pressable onPress={() => setShowPass(p => !p)} style={styles.eyeBtn} hitSlop={8}>
                <Ionicons name={showPass ? "eye-outline" : "eye-off-outline"} size={18} color={Colors.textMuted} />
              </Pressable>
            </View>
            {errors.password ? <FieldError msg={errors.password} /> : null}
          </View>

          {/* Submit */}
          <Pressable
            style={({ pressed }) => [styles.submitBtn, { opacity: pressed ? 0.85 : 1 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitBtnText}>CREATE ACCOUNT</Text>
            }
          </Pressable>
        </View>

        {/* Sign In Link */}
        <View style={styles.signinRow}>
          <Text style={styles.signinText}>Already have an account? </Text>
          <Pressable onPress={() => router.replace("/(auth)/login")} hitSlop={8}>
            <Text style={styles.signinLink}>SIGN IN</Text>
          </Pressable>
        </View>

        <Text style={styles.footer}>Powered by <Text style={styles.footerBold}>Raj Motors</Text></Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function FieldError({ msg }: { msg: string }) {
  return (
    <View style={styles.errorRow}>
      <Ionicons name="alert-circle-outline" size={12} color={Colors.danger} />
      <Text style={styles.errorMsg}>{msg}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  container: { flexGrow: 1, paddingHorizontal: 24, alignItems: "center" },
  logoArea: { alignItems: "center", marginBottom: 24, marginTop: 12 },
  logoBox: {
    width: 80, height: 80, borderRadius: 22, backgroundColor: Colors.navy,
    alignItems: "center", justifyContent: "center", marginBottom: 16,
    shadowColor: Colors.navy, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.22, shadowRadius: 14, elevation: 7,
  },
  appTitle: { fontSize: 26, fontFamily: "Urbanist_700Bold", color: Colors.text, marginBottom: 4 },
  appSubtitle: { fontSize: 14, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary },
  card: {
    width: "100%", backgroundColor: Colors.card, borderRadius: 20, padding: 22,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 16,
    elevation: 4, marginBottom: 20, gap: 15,
  },
  alertBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#FEF2F2", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#FECACA",
  },
  alertText: { flex: 1, fontSize: 13, fontFamily: "Urbanist_500Medium", color: Colors.danger },
  successBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#ECFDF5", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#A7F3D0",
  },
  successText: { flex: 1, fontSize: 13, fontFamily: "Urbanist_500Medium", color: Colors.success },
  fieldGroup: { gap: 7 },
  fieldLabel: { fontSize: 11, fontFamily: "Urbanist_700Bold", color: Colors.textSecondary, letterSpacing: 1 },
  inputRow: {
    flexDirection: "row", alignItems: "center", backgroundColor: Colors.inputBg,
    borderRadius: 14, borderWidth: 1.5, borderColor: Colors.inputBorder, height: 54, overflow: "hidden",
  },
  inputRowError: { borderColor: Colors.danger, backgroundColor: "#FFF5F5" },
  inputIcon: { marginLeft: 14, marginRight: 2 },
  countryCode: {
    paddingHorizontal: 14, height: "100%", justifyContent: "center",
    borderRightWidth: 1, borderRightColor: Colors.inputBorder, backgroundColor: "#EAEFF8", minWidth: 56,
  },
  countryCodeText: { fontSize: 15, fontFamily: "Urbanist_600SemiBold", color: Colors.text },
  input: { flex: 1, paddingHorizontal: 12, fontSize: 15, fontFamily: "Urbanist_400Regular", color: Colors.text },
  eyeBtn: { paddingHorizontal: 14 },
  errorRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  errorMsg: { fontSize: 12, fontFamily: "Urbanist_400Regular", color: Colors.danger },
  stepsBox: {
    backgroundColor: Colors.surface, borderRadius: 14, padding: 14, gap: 10,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  stepsTitle: { fontSize: 12, fontFamily: "Urbanist_600SemiBold", color: Colors.textSecondary, marginBottom: 2 },
  stepsList: { gap: 9 },
  stepItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  stepNum: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 1.5, borderColor: Colors.inputBorder, alignItems: "center", justifyContent: "center",
  },
  stepNumActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  stepNumText: { fontSize: 11, fontFamily: "Urbanist_700Bold", color: Colors.textMuted },
  stepNumTextActive: { color: "#fff" },
  stepText: { fontSize: 13, fontFamily: "Urbanist_400Regular", color: Colors.textMuted },
  submitBtn: { height: 54, borderRadius: 14, backgroundColor: Colors.actionBtn, alignItems: "center", justifyContent: "center" },
  submitBtnText: { fontSize: 14, fontFamily: "Urbanist_700Bold", color: "#fff", letterSpacing: 1.5 },
  signinRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  signinText: { fontSize: 14, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary },
  signinLink: { fontSize: 13, fontFamily: "Urbanist_700Bold", color: Colors.primary, letterSpacing: 0.5 },
  footer: { fontSize: 13, fontFamily: "Urbanist_400Regular", color: Colors.textMuted, marginBottom: 8 },
  footerBold: { fontFamily: "Urbanist_700Bold", color: Colors.text },
});
