import React, { useState, useEffect, useCallback } from "react";
import {
  Modal, View, Text, Pressable, StyleSheet,
  ActivityIndicator, Alert, ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import {
  fetchMySubscription,
  fetchPlans,
  createSubscriptionOrder,
  openRazorpayCheckout,
  verifySubscriptionPayment,
  ActiveSubscription,
  SubscriptionPlan,
} from "@/lib/subscription";

interface SubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode?: "subscribe" | "renew";
}

export function SubscriptionModal({ visible, onClose, onSuccess }: SubscriptionModalProps) {
  const [activeSub, setActiveSub] = useState<ActiveSubscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subChecked, setSubChecked] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  const loadData = useCallback(async () => {
    setSubChecked(false);
    setActiveSub(null);
    try {
      const [sub, fetchedPlans] = await Promise.all([
        fetchMySubscription(),
        fetchPlans()
      ]);
      setActiveSub(sub);
      setPlans(fetchedPlans);
    } catch {
      // ignore
    } finally {
      setSubChecked(true);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      setSubscribing(false);
      loadData();
    }
  }, [visible, loadData]);

  const hasActiveSub = subChecked && !!activeSub && activeSub.sub_remaining_uses > 0;
  
  // Use the first available plan, or a fallback if none loaded
  const defaultPlan = plans.length > 0 ? plans[0] : {
    sp_id: "",
    sp_name: "Loading Plan...",
    sp_price: 0,
    sp_duration: 0,
    sp_description: "Please wait..."
  };

  // We assume the uses are fixed to 3 for the UI, or could be fetched if backend supported it.
  const DISPLAY_USES = 3;

  const handleSubscribe = () => {
    if (subscribing) return;
    if (!defaultPlan.sp_id) {
      Alert.alert("Error", "No subscription plans available at the moment.");
      return;
    }

    // Direct to payment to avoid redundant alert, or keep the alert. User requested "once it will open this api, razopay will open". 
    // We proceed directly without the intermediate Alert since it's already a modal.
    proceedWithPayment(defaultPlan.sp_id, defaultPlan.sp_price);
  };

  const proceedWithPayment = async (plan_id: string, price: number) => {
    setSubscribing(true);
    try {
      console.log("[SUB] Starting subscription flow for plan:", plan_id);

      // Step 1: Create Razorpay order on backend
      const order = await createSubscriptionOrder(plan_id);
      console.log("[SUB] Order created:", order.razorpay_order_id);

      // Step 2: Open Razorpay checkout in the system browser
      const paymentResult = await openRazorpayCheckout(order);
      console.log("[SUB] Payment completed:", paymentResult.razorpay_payment_id);

      // Step 3: Verify the payment signature with backend
      await verifySubscriptionPayment(
        paymentResult.razorpay_order_id,
        paymentResult.razorpay_payment_id,
        paymentResult.razorpay_signature,
      );

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess();
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const message = err?.message || "Could not complete payment. Please try again.";
      if (!message.toLowerCase().includes("cancel")) {
        Alert.alert("Payment Failed", message);
      }
      setSubscribing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.grabber} />

          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Unlock Vehicle Actions</Text>
              <Text style={styles.subtitle}>
                {subChecked && hasActiveSub
                  ? `${activeSub!.sub_remaining_uses} of ${DISPLAY_USES} transactions remaining`
                  : "One subscription · 3 transactions"}
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={Colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            {!subChecked ? (
               <View style={{ padding: 40, alignItems: "center" }}>
                 <ActivityIndicator size="large" color={Colors.primary} />
                 <Text style={{ marginTop: 10, color: Colors.textSecondary }}>Checking subscription...</Text>
               </View>
            ) : hasActiveSub ? (
              <View>
                <View style={styles.activeCard}>
                  <LinearGradient
                    colors={[Colors.heroLight, Colors.hero]}
                    style={styles.activeGrad}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.activeIconWrap}>
                      <Ionicons name="checkmark-circle" size={40} color="#fff" />
                    </View>
                    <Text style={styles.activeTitle}>Subscription Active</Text>
                    <Text style={styles.activePlan}>{activeSub?.plan?.sp_name ?? "Standard Plan"}</Text>
                    <View style={styles.usesRow}>
                      {[1, 2, 3].map((n) => (
                        <View
                          key={n}
                          style={[
                            styles.usesDot,
                            n <= activeSub!.sub_remaining_uses ? styles.usesDotActive : styles.usesDotUsed,
                          ]}
                        />
                      ))}
                    </View>
                    <Text style={styles.usesLabel}>
                      {activeSub!.sub_remaining_uses} of {DISPLAY_USES} transactions left
                    </Text>
                  </LinearGradient>
                </View>
                <Pressable
                  style={({ pressed }) => [styles.subBtn, { opacity: pressed ? 0.85 : 1 }]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onSuccess(); }}
                >
                  <LinearGradient
                    colors={[Colors.heroLight, Colors.hero]}
                    style={styles.subBtnGrad}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Ionicons name="flash" size={16} color="#fff" />
                    <Text style={styles.subBtnText}>Continue</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            ) : (
              <View>
                <View style={styles.planCard}>
                  <View style={styles.planBadge}>
                    <Ionicons name="star" size={10} color="#fff" />
                    <Text style={styles.planBadgeText}>SUBSCRIPTION</Text>
                  </View>
                  <Text style={styles.planName}>{defaultPlan.sp_name}</Text>
                  <Text style={styles.planDesc}>
                    {defaultPlan.sp_description || `Subscribe once to bid or buy up to ${DISPLAY_USES} vehicles`}
                  </Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceCur}>₹</Text>
                    <Text style={styles.priceVal}>{defaultPlan.sp_price ? defaultPlan.sp_price.toLocaleString("en-IN") : "..."}</Text>
                    <Text style={styles.priceNote}> one-time</Text>
                  </View>
                  <View style={styles.divider} />
                  {[
                    { icon: "flash", text: `${DISPLAY_USES} vehicle transactions (bid or buy)` },
                    { icon: "shield-checkmark", text: "Secure Razorpay payment" },
                    { icon: "time", text: "Valid until all transactions are used" },
                    { icon: "car-sport", text: "Access all live auctions & buy now listings" },
                  ].map(({ icon, text }) => (
                    <View key={text} style={styles.featureRow}>
                      <View style={styles.featureIcon}>
                        <Ionicons name={icon as any} size={14} color={Colors.primary} />
                      </View>
                      <Text style={styles.featureText}>{text}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.infoBox}>
                  <Ionicons name="information-circle-outline" size={14} color={Colors.info} />
                  <Text style={styles.infoText}>
                    Each successful bid or purchase deducts one transaction. Subscription expires after {DISPLAY_USES} completed transactions.
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer — only show Subscribe when user doesn't have active sub and check is complete */}
          {subChecked && !hasActiveSub && (
            <View style={styles.footer}>
              <Pressable
                style={({ pressed }) => [styles.subBtn, { opacity: (pressed || subscribing) ? 0.85 : 1 }]}
                onPress={handleSubscribe}
                disabled={subscribing || !defaultPlan.sp_id}
              >
                <LinearGradient
                  colors={[Colors.heroLight, Colors.hero]}
                  style={styles.subBtnGrad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {subscribing ? (
                    <>
                      <ActivityIndicator color="#fff" size="small" />
                      <Text style={styles.subBtnText}>Opening Payment…</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="lock-open" size={16} color="#fff" />
                      <Text style={styles.subBtnText}>
                        Subscribe — ₹{defaultPlan.sp_price ? defaultPlan.sp_price.toLocaleString("en-IN") : "..."}
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </Pressable>
              <Text style={styles.secureText}>🔒 Secure payment via Razorpay</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: "88%",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  grabber: {
    width: 36, height: 4, backgroundColor: Colors.cardBorder,
    borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 4,
  },
  header: {
    flexDirection: "row", alignItems: "flex-start",
    justifyContent: "space-between", paddingHorizontal: 24, paddingVertical: 16,
  },
  title: { fontSize: 22, fontFamily: "Urbanist_700Bold", color: Colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary },
  closeBtn: {
    width: 36, height: 36, alignItems: "center", justifyContent: "center",
    backgroundColor: Colors.surface, borderRadius: 10,
  },
  body: { paddingHorizontal: 20, paddingBottom: 12, gap: 12 },

  // Active subscription
  activeCard: { borderRadius: 20, overflow: "hidden", marginBottom: 16 },
  activeGrad: { padding: 28, alignItems: "center", gap: 10 },
  activeIconWrap: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center",
  },
  activeTitle: { fontSize: 22, fontFamily: "Urbanist_700Bold", color: "#fff" },
  activePlan: { fontSize: 14, fontFamily: "Urbanist_500Medium", color: "rgba(255,255,255,0.8)" },
  usesRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  usesDot: { width: 22, height: 22, borderRadius: 11 },
  usesDotActive: { backgroundColor: "rgba(255,255,255,0.95)" },
  usesDotUsed: { backgroundColor: "rgba(255,255,255,0.25)" },
  usesLabel: { fontSize: 13, fontFamily: "Urbanist_500Medium", color: "rgba(255,255,255,0.85)" },

  // Plan card
  planCard: {
    backgroundColor: Colors.surface, borderRadius: 20, padding: 20,
    borderWidth: 1.5, borderColor: Colors.primary + "33", gap: 10,
  },
  planBadge: {
    alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
  },
  planBadgeText: { fontSize: 10, fontFamily: "Urbanist_700Bold", color: "#fff", letterSpacing: 0.5 },
  planName: { fontSize: 20, fontFamily: "Urbanist_700Bold", color: Colors.text },
  planDesc: { fontSize: 13, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary, lineHeight: 20 },
  priceRow: { flexDirection: "row", alignItems: "flex-end", gap: 2, marginTop: 4 },
  priceCur: { fontSize: 18, fontFamily: "Urbanist_600SemiBold", color: Colors.primary, marginBottom: 3 },
  priceVal: { fontSize: 38, fontFamily: "Urbanist_700Bold", color: Colors.primary, lineHeight: 42 },
  priceNote: { fontSize: 13, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary, marginBottom: 5 },
  divider: { height: 1, backgroundColor: Colors.cardBorder, marginVertical: 4 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  featureIcon: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: Colors.primaryLight, alignItems: "center", justifyContent: "center",
  },
  featureText: { flex: 1, fontSize: 13, fontFamily: "Urbanist_500Medium", color: Colors.textSecondary },

  infoBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: "#EFF6FF", borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: "#BFDBFE",
  },
  infoText: { flex: 1, fontSize: 12, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary, lineHeight: 18 },

  // Footer
  footer: { padding: 20, gap: 10, borderTopWidth: 1, borderTopColor: Colors.cardBorder },
  subBtn: { borderRadius: 14, overflow: "hidden" },
  subBtnGrad: { height: 56, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  subBtnText: { fontSize: 16, fontFamily: "Urbanist_700Bold", color: "#fff" },
  secureText: { textAlign: "center", fontSize: 12, fontFamily: "Urbanist_400Regular", color: Colors.textMuted },
});
