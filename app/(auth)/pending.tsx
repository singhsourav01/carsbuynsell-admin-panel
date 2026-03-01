import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from "react-native-reanimated";
import { Colors } from "@/constants/colors";
import { apiRequest, storeToken, storeUser } from "@/lib/auth";

export default function PendingScreen() {
  const insets = useSafeAreaInsets();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [status, setStatus] = useState<"PENDING_APPROVAL" | "ACCEPTED" | "REJECTED" | "BLOCKED">("PENDING_APPROVAL");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pulseScale = useSharedValue(1);
  useEffect(() => {
    pulseScale.value = withRepeat(
      withTiming(1.15, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulseScale.value }] }));

  const pollStatus = async () => {
    try {
      const res = await apiRequest("GET", "/api/auth/status", undefined, false);
      const data = await res.json();
      if (data.success) {
        setStatus(data.data.status);
        if (data.data.status === "ACCEPTED") {
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      }
    } catch {}
  };

  useEffect(() => {
    pollStatus();
    intervalRef.current = setInterval(pollStatus, 10000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const goToLogin = () => router.replace("/(auth)/login");

  const statusConfig = {
    PENDING_APPROVAL: {
      icon: "time-outline" as const,
      iconColor: Colors.warning,
      title: "Under Review",
      message: "Your account is being reviewed by our admin team. This usually takes a few hours.",
      bg: "#F59E0B22",
      border: "#F59E0B44",
    },
    ACCEPTED: {
      icon: "checkmark-circle" as const,
      iconColor: Colors.success,
      title: "Account Approved!",
      message: "Your account has been approved. You can now sign in and start bidding.",
      bg: "#22C55E22",
      border: "#22C55E44",
    },
    REJECTED: {
      icon: "close-circle" as const,
      iconColor: Colors.danger,
      title: "Account Rejected",
      message: "Your account application has been rejected. Please contact support for more information.",
      bg: "#EF444422",
      border: "#EF444444",
    },
    BLOCKED: {
      icon: "ban" as const,
      iconColor: Colors.danger,
      title: "Account Blocked",
      message: "Your account has been blocked. Please contact support.",
      bg: "#EF444422",
      border: "#EF444444",
    },
  };

  const config = statusConfig[status];

  return (
    <View style={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
      <LinearGradient
        colors={["#1A0A00", Colors.background]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.4 }}
      />

      <View style={styles.content}>
        <Animated.View style={[styles.iconCircle, { backgroundColor: config.bg, borderColor: config.border }, status === "PENDING_APPROVAL" ? pulseStyle : {}]}>
          <Ionicons name={config.icon} size={48} color={config.iconColor} />
        </Animated.View>

        <Text style={styles.title}>{config.title}</Text>
        <Text style={styles.message}>{config.message}</Text>

        {status === "PENDING_APPROVAL" && (
          <View style={styles.pollingRow}>
            <ActivityIndicator size="small" color={Colors.textMuted} />
            <Text style={styles.pollingText}>Checking status automatically...</Text>
          </View>
        )}

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.info} />
          <Text style={styles.infoText}>
            {status === "PENDING_APPROVAL"
              ? "We poll every 10 seconds. You'll be notified when approved."
              : status === "ACCEPTED"
              ? "Tap Sign In below to access your account."
              : "Contact support at support@autobid.in"}
          </Text>
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [styles.btn, { opacity: pressed ? 0.85 : 1 }]}
        onPress={goToLogin}
      >
        <LinearGradient
          colors={status === "ACCEPTED" ? ["#FF8C4C", Colors.primary] : [Colors.surface, Colors.card]}
          style={styles.btnGrad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={[styles.btnText, status !== "ACCEPTED" && { color: Colors.textSecondary }]}>
            {status === "ACCEPTED" ? "Sign In Now" : "Back to Sign In"}
          </Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: 24 },
  content: { flex: 1, alignItems: "center", justifyContent: "center", gap: 20 },
  iconCircle: {
    width: 100, height: 100, borderRadius: 30, borderWidth: 1,
    alignItems: "center", justifyContent: "center", marginBottom: 8,
  },
  title: { fontSize: 28, fontFamily: "Urbanist_700Bold", color: Colors.text, textAlign: "center" },
  message: { fontSize: 16, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary, textAlign: "center", lineHeight: 24, paddingHorizontal: 16 },
  pollingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  pollingText: { fontSize: 13, fontFamily: "Urbanist_400Regular", color: Colors.textMuted },
  infoBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: "#3B82F611", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#3B82F633",
    width: "100%",
  },
  infoText: { flex: 1, fontSize: 13, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary, lineHeight: 20 },
  btn: { borderRadius: 14, overflow: "hidden" },
  btnGrad: { height: 54, alignItems: "center", justifyContent: "center" },
  btnText: { fontSize: 16, fontFamily: "Urbanist_700Bold", color: "#fff", letterSpacing: 0.5 },
});
