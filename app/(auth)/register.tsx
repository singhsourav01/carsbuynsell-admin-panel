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
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { apiRequest } from "@/lib/auth";

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async () => {
    if (!fullName.trim() || !phone.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await apiRequest(
        "POST",
        "/api/auth/register",
        { fullName: fullName.trim(), phone: phone.trim(), email: email.trim(), password },
        false,
      );
      const data = await res.json();
      if (data.success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.push({
          pathname: "/(auth)/otp",
          params: { userId: data.data.userId, phone: data.data.phone, email: data.data.email },
        });
      } else {
        setError(data.message || "Registration failed");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch {
      setError("Registration failed. Please try again.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
        end={{ x: 0.5, y: 0.5 }}
      />
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 20 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </Pressable>

        <Text style={styles.headline}>Create account</Text>
        <Text style={styles.subheadline}>Join the auction platform</Text>

        <View style={styles.form}>
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={Colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {[
            { label: "Full Name", icon: "person-outline", value: fullName, setter: setFullName, placeholder: "John Doe", keyboardType: "default" },
            { label: "Phone Number", icon: "call-outline", value: phone, setter: setPhone, placeholder: "+91 9876543210", keyboardType: "phone-pad" },
            { label: "Email", icon: "mail-outline", value: email, setter: setEmail, placeholder: "you@example.com", keyboardType: "email-address" },
          ].map((field) => (
            <View key={field.label} style={styles.inputGroup}>
              <Text style={styles.label}>{field.label}</Text>
              <View style={styles.inputWrap}>
                <Ionicons name={field.icon as any} size={18} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={field.placeholder}
                  placeholderTextColor={Colors.textMuted}
                  value={field.value}
                  onChangeText={field.setter}
                  keyboardType={field.keyboardType as any}
                  autoCapitalize={field.label === "Email" ? "none" : "words"}
                  autoCorrect={false}
                />
              </View>
            </View>
          ))}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Min 6 characters"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color={Colors.textSecondary} />
              </Pressable>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.btn, { opacity: pressed ? 0.85 : 1 }]}
            onPress={handleRegister}
            disabled={loading}
          >
            <LinearGradient
              colors={["#FF8C4C", Colors.primary, "#E05020"]}
              style={styles.btnGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Create Account</Text>
              )}
            </LinearGradient>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.footerLink}>Sign In</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 24 },
  backBtn: { marginBottom: 28, width: 40, height: 40, justifyContent: "center" },
  headline: { fontSize: 32, fontFamily: "Urbanist_700Bold", color: Colors.text, marginBottom: 8 },
  subheadline: { fontSize: 16, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary, marginBottom: 36 },
  form: { gap: 20 },
  errorBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#EF444422", borderWidth: 1, borderColor: "#EF444444",
    borderRadius: 10, padding: 12,
  },
  errorText: { color: Colors.danger, fontSize: 14, fontFamily: "Urbanist_500Medium", flex: 1 },
  inputGroup: { gap: 8 },
  label: { fontSize: 14, fontFamily: "Urbanist_600SemiBold", color: Colors.textSecondary, letterSpacing: 0.3 },
  inputWrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: Colors.inputBorder,
    borderRadius: 14, paddingHorizontal: 14, height: 52,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, fontFamily: "Urbanist_400Regular", color: Colors.text },
  eyeBtn: { padding: 4 },
  btn: { borderRadius: 14, overflow: "hidden", marginTop: 8 },
  btnGrad: { height: 54, alignItems: "center", justifyContent: "center" },
  btnText: { fontSize: 16, fontFamily: "Urbanist_700Bold", color: "#fff", letterSpacing: 0.5 },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 32 },
  footerText: { fontSize: 14, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary },
  footerLink: { fontSize: 14, fontFamily: "Urbanist_700Bold", color: Colors.primary },
});
