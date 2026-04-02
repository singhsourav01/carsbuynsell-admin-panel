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
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { apiRequestDirect } from "@/lib/auth";

export default function ResetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const { resetToken, identifier, type } = useLocalSearchParams<{
    resetToken: string;
    identifier: string;
    type: string;
  }>();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const topPad = insets.top + (insets.top < 20 ? 67 : 0);

  const handleResetPassword = async () => {
    // Validation
    if (!newPassword) {
      setError("Please enter a new password");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await apiRequestDirect(
        "POST",
        "http://13.127.188.130:3002/user/reset-password",
        {
          reset_token: resetToken,
          new_password: newPassword,
        }
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
        setSuccess(data?.message || "Password reset successfully!");

        // Navigate to login after success
        setTimeout(() => {
          router.replace("/(auth)/login");
        }, 1500);
      } else {
        const apiMessage = data?.message || data?.error || "Failed to reset password. Please try again.";
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
          <Text style={styles.appSubtitle}>Create new password</Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Reset Password</Text>
          <Text style={styles.cardSubtitle}>Enter your new password below</Text>

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

          {/* New Password */}
          <Text style={styles.fieldLabel}>NEW PASSWORD</Text>
          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter new password"
              placeholderTextColor={Colors.textMuted}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNewPassword}
              autoCapitalize="none"
              returnKeyType="next"
            />
            <Pressable onPress={() => setShowNewPassword(!showNewPassword)} style={styles.eyeBtn}>
              <Ionicons
                name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={Colors.textMuted}
              />
            </Pressable>
          </View>

          {/* Confirm Password */}
          <Text style={styles.fieldLabel}>CONFIRM PASSWORD</Text>
          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm new password"
              placeholderTextColor={Colors.textMuted}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleResetPassword}
            />
            <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeBtn}>
              <Ionicons
                name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={Colors.textMuted}
              />
            </Pressable>
          </View>

          {/* Password Requirements */}
          <View style={styles.requirementsBox}>
            <Ionicons name="information-circle-outline" size={14} color={Colors.info} />
            <Text style={styles.requirementsText}>
              Password must be at least 6 characters
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [styles.submitBtn, { opacity: pressed ? 0.85 : 1 }]}
            onPress={handleResetPassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>RESET PASSWORD</Text>
            )}
          </Pressable>
        </View>

        {/* Back to Login */}
        <Pressable onPress={() => router.replace("/(auth)/login")} style={styles.backRow}>
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
  inputIcon: {
    paddingLeft: 16,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 16,
    fontFamily: "Urbanist_400Regular",
    color: Colors.text,
  },
  eyeBtn: {
    paddingHorizontal: 16,
    height: "100%",
    justifyContent: "center",
  },
  requirementsBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EEF6FF",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  requirementsText: {
    fontSize: 12,
    fontFamily: "Urbanist_400Regular",
    color: Colors.textSecondary,
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
