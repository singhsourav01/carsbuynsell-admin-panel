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
  verifySubscriptionPayment,
  ActiveSubscription,
  SubscriptionPlan,
  CreateOrderResult,
  RazorpayPaymentResult,
} from "@/lib/subscription";
import { RazorpayCheckoutModal } from "./RazorpayCheckoutModal";

interface SubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode?: "subscribe" | "renew";
  /** Filter plans by type: "auction" for full subscription, "sell" for user vehicle subscription */
  planType?: "auction" | "sell";
}

export function SubscriptionModal({ visible, onClose, onSuccess, planType = "auction" }: SubscriptionModalProps) {
  const [activeSub, setActiveSub] = useState<ActiveSubscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subChecked, setSubChecked] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [checkoutOrder, setCheckoutOrder] = useState<CreateOrderResult | null>(null);

  const loadData = useCallback(async () => {
    setSubChecked(false);
    setActiveSub(null);
    try {
      const [sub, fetchedPlans] = await Promise.all([
        fetchMySubscription(),
        fetchPlans()
      ]);
      setActiveSub(sub);

      // Filter plans based on planType
      // "sell" type filters for User Vehicle Subscription (sp_id: sub_002, price: 800)
      // "auction" type filters for the full subscription (price: 10000)
      let filteredPlans = fetchedPlans;
      console.log("[SUB] All plans from API:", JSON.stringify(fetchedPlans));
      console.log("[SUB] Filtering for planType:", planType);

      if (planType === "sell") {
        filteredPlans = fetchedPlans.filter(
          (p) => p.sp_id === "sub_002" ||
                 p.sp_name.toLowerCase().includes("user vehicle") ||
                 Number(p.sp_price) === 800
        );
      } else if (planType === "auction") {
        filteredPlans = fetchedPlans.filter(
          (p) => p.sp_id !== "sub_002" &&
                 !p.sp_name.toLowerCase().includes("user vehicle") &&
                 Number(p.sp_price) !== 800
        );
      }

      console.log("[SUB] Filtered plans:", JSON.stringify(filteredPlans));

      setPlans(filteredPlans.length > 0 ? filteredPlans : fetchedPlans);
    } catch {
      // ignore
    } finally {
      setSubChecked(true);
    }
  }, [planType]);

  useEffect(() => {
    if (visible) {
      setSubscribing(false);
      loadData();
    }
  }, [visible, loadData]);

  const hasActiveSub = subChecked && !!activeSub;

  // Auto-continue: if the user already has an active subscription AND this is for auction (not sell),
  // skip the modal entirely and fire onSuccess immediately.
  // For "sell" planType, we ALWAYS show the payment modal regardless of existing subscription.
  if (visible && hasActiveSub && planType !== "sell") {
    onSuccess()
    return null
  }

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

  // For sell planType, always show the payment option regardless of activeSub
  const showPaymentOption = planType === "sell" || !activeSub;

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
      const order = await createSubscriptionOrder(plan_id);
      console.log("[SUB] Order created:", JSON.stringify(order));

      // Validate order has all required fields before opening checkout
      if (!order.razorpay_order_id || !order.key_id || !order.amount) {
        throw new Error(
          "Incomplete order data from server. " +
          `Missing: ${!order.razorpay_order_id ? 'order_id ' : ''}${!order.key_id ? 'key_id ' : ''}${!order.amount ? 'amount' : ''}`
        );
      }

      setCheckoutOrder(order);
    } catch (err: any) {
      console.error("[SUB] Order creation failed:", err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const message = err?.error?.description || err?.description || err?.message || "Could not complete payment. Please try again.";
      if (!message.toLowerCase().includes("cancel")) {
        Alert.alert("Error Creating Order", message);
      }
      setSubscribing(false);
    }
  };


  const handlePaymentSuccess = async (data: RazorpayPaymentResult) => {
    console.log("[SUB] Payment success from Razorpay:", data.razorpay_payment_id);
    console.log("[SUB] Full payment data:", JSON.stringify(data));
    try {
      console.log("[SUB] Calling verify-payment for order:", data.razorpay_order_id);
      await verifySubscriptionPayment(
        data.razorpay_order_id,
        data.razorpay_payment_id,
        data.razorpay_signature
      );

      console.log("[SUB] Verification successful — subscription activated");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCheckoutOrder(null);
      setSubscribing(false);
      onSuccess();
    } catch (err: any) {
      console.error("[SUB] Verification error:", err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const message = err?.message || "Verification failed on server. Please contact support.";
      Alert.alert("Payment Failed", message);
      setCheckoutOrder(null);
      setSubscribing(false);
    }
  };

  return (
    <>
      <Modal visible={visible && !checkoutOrder} animationType="slide" transparent onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.grabber} />

            {/* Header */}
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>
                  {planType === "sell" ? "Sell Your Vehicle" : "Unlock Vehicle Actions"}
                </Text>
                <Text style={styles.subtitle}>
                  {subChecked && hasActiveSub
                    ? `${activeSub!.sub_remaining_uses ?? activeSub!.remaining_uses ?? 'Active'} transactions remaining`
                    : planType === "sell"
                      ? "List your vehicle in the marketplace"
                      : "3 transactions per day"}
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
              ) : hasActiveSub && planType !== "sell" ? (
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
                              n <= (activeSub!.sub_remaining_uses ?? activeSub!.remaining_uses ?? 3) ? styles.usesDotActive : styles.usesDotUsed,
                            ]}
                          />
                        ))}
                      </View>
                      <Text style={styles.usesLabel}>
                        {activeSub!.sub_remaining_uses ?? activeSub!.remaining_uses ?? 'Active'} transactions left
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
                      <Text style={styles.planBadgeText}>{planType === "sell" ? "SELLER" : "SUBSCRIPTION"}</Text>
                    </View>
                    <Text style={styles.planName}>{defaultPlan.sp_name}</Text>
                    <Text style={styles.planDesc}>
                      {defaultPlan.sp_description || (planType === "sell" ? `List your vehicle for ${defaultPlan.sp_duration || 365} days` : `Bid or buy up to ${DISPLAY_USES} vehicles per day`)}
                    </Text>
                    <View style={styles.priceRow}>
                      <Text style={styles.priceCur}>₹</Text>
                      <Text style={styles.priceVal}>{defaultPlan.sp_price ? defaultPlan.sp_price.toLocaleString("en-IN") : "..."}</Text>
                      <Text style={styles.priceNote}>{planType === "sell" ? ` / ${defaultPlan.sp_duration || 365} days` : " /day"}</Text>
                    </View>
                    <View style={styles.divider} />
                    {(planType === "sell" ? [
                      { icon: "car-sport", text: "List your vehicle in the marketplace" },
                      { icon: "time", text: `Active for ${defaultPlan.sp_duration || 365} days` },
                      { icon: "shield-checkmark", text: "Secure Razorpay payment" },
                      { icon: "people", text: "Reach thousands of potential buyers" },
                    ] : [
                      { icon: "flash", text: `${DISPLAY_USES} vehicle transactions per day (bid or buy)` },
                      { icon: "shield-checkmark", text: "Secure Razorpay payment" },
                      { icon: "time", text: "Daily limit resets every day" },
                      { icon: "car-sport", text: "Access all live auctions & buy now listings" },
                    ]).map(({ icon, text }) => (
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
                      {planType === "sell"
                        ? `Your vehicle will be visible to buyers for ${defaultPlan.sp_duration || 365} days. Admin will review and approve your listing within 24 hours.`
                        : `Each successful bid or purchase deducts one daily transaction. Your ${DISPLAY_USES} daily transactions reset at the start of each day. If you need more than ${DISPLAY_USES} in a day, purchase again.`}
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Footer — show Subscribe button when payment is needed */}
            {subChecked && showPaymentOption && (
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
                        <Ionicons name={planType === "sell" ? "car-sport" : "lock-open"} size={16} color="#fff" />
                        <Text style={styles.subBtnText}>
                          {planType === "sell" ? "Pay to List Vehicle" : "Subscribe"} — ₹{defaultPlan.sp_price ? defaultPlan.sp_price.toLocaleString("en-IN") : "..."}
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
      <RazorpayCheckoutModal
        visible={!!checkoutOrder}
        order={checkoutOrder}
        onSuccess={handlePaymentSuccess}
        onClose={(errorMsg?: string) => {
          setCheckoutOrder(null);
          setSubscribing(false);
          if (errorMsg && !errorMsg.toLowerCase().includes("cancel")) {
            Alert.alert("Payment Failed", errorMsg);
          }
        }}
      />
    </>
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
