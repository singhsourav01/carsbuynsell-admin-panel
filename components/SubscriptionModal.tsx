import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { apiRequest } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";

interface SubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode?: "subscribe" | "renew";
}

const PLANS = [
  {
    id: "BASIC",
    name: "Basic",
    price: 499,
    listings: 2,
    features: ["2 vehicle actions", "View all auctions", "Basic support"],
    popular: false,
  },
  {
    id: "STANDARD",
    name: "Standard",
    price: 999,
    listings: 4,
    features: ["4 vehicle actions", "Priority bidding", "Sell 2 vehicles", "24/7 support"],
    popular: true,
  },
  {
    id: "PREMIUM",
    name: "Premium",
    price: 1999,
    listings: 10,
    features: ["10 vehicle actions", "Exclusive auctions", "Sell unlimited", "Dedicated manager"],
    popular: false,
  },
];

export function SubscriptionModal({ visible, onClose, onSuccess, mode = "subscribe" }: SubscriptionModalProps) {
  const [selectedPlan, setSelectedPlan] = useState("STANDARD");
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/subscriptions/purchase", { plan: selectedPlan });
      const data = await res.json();
      if (data.success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        queryClient.invalidateQueries({ queryKey: ["/api/subscriptions/me"] });
        onSuccess();
      }
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.grabber} />

          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{mode === "renew" ? "Renew Subscription" : "Unlock Full Access"}</Text>
              <Text style={styles.subtitle}>Choose a plan to start bidding & selling</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={Colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.plansContainer}>
            {PLANS.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              return (
                <Pressable
                  key={plan.id}
                  onPress={() => {
                    setSelectedPlan(plan.id);
                    Haptics.selectionAsync();
                  }}
                  style={[styles.planCard, isSelected && styles.planCardSelected]}
                >
                  {plan.popular && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularText}>POPULAR</Text>
                    </View>
                  )}
                  <View style={styles.planTop}>
                    <View>
                      <Text style={[styles.planName, isSelected && { color: Colors.primary }]}>{plan.name}</Text>
                      <Text style={styles.planListings}>{plan.listings} vehicle actions</Text>
                    </View>
                    <View style={styles.planPriceWrap}>
                      <Text style={styles.planCurrency}>₹</Text>
                      <Text style={[styles.planPrice, isSelected && { color: Colors.primary }]}>{plan.price}</Text>
                      <Text style={styles.planPeriod}>/mo</Text>
                    </View>
                  </View>
                  <View style={styles.planFeatures}>
                    {plan.features.map((f) => (
                      <View key={f} style={styles.featureRow}>
                        <Ionicons name="checkmark-circle" size={14} color={isSelected ? Colors.primary : Colors.success} />
                        <Text style={styles.featureText}>{f}</Text>
                      </View>
                    ))}
                  </View>
                  {isSelected && (
                    <View style={styles.selectedIndicator}>
                      <Ionicons name="radio-button-on" size={20} color={Colors.primary} />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              style={({ pressed }) => [styles.purchaseBtn, { opacity: pressed ? 0.85 : 1 }]}
              onPress={handlePurchase}
              disabled={loading}
            >
              <LinearGradient
                colors={["#FF8C4C", Colors.primary, "#E05020"]}
                style={styles.purchaseBtnGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="flash" size={16} color="#fff" />
                    <Text style={styles.purchaseBtnText}>
                      Subscribe — ₹{PLANS.find((p) => p.id === selectedPlan)?.price}/mo
                    </Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
            <Text style={styles.secureText}>
              <Ionicons name="lock-closed-outline" size={11} color={Colors.textMuted} /> Secure payment · Cancel anytime
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "90%",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  grabber: { width: 36, height: 4, backgroundColor: Colors.cardBorder, borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 4 },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", paddingHorizontal: 24, paddingVertical: 16 },
  title: { fontSize: 22, fontFamily: "Urbanist_700Bold", color: Colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary },
  closeBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center", backgroundColor: Colors.surface, borderRadius: 10 },
  plansContainer: { paddingHorizontal: 24, gap: 12, paddingBottom: 12 },
  planCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    position: "relative",
  },
  planCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: "#FF6B2C0A",
  },
  popularBadge: {
    position: "absolute", top: -1, right: 12,
    backgroundColor: Colors.primary, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  popularText: { fontSize: 10, fontFamily: "Urbanist_700Bold", color: "#fff", letterSpacing: 0.5 },
  planTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  planName: { fontSize: 18, fontFamily: "Urbanist_700Bold", color: Colors.text, marginBottom: 2 },
  planListings: { fontSize: 13, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary },
  planPriceWrap: { flexDirection: "row", alignItems: "flex-end", gap: 1 },
  planCurrency: { fontSize: 14, fontFamily: "Urbanist_600SemiBold", color: Colors.textSecondary, marginBottom: 4 },
  planPrice: { fontSize: 28, fontFamily: "Urbanist_700Bold", color: Colors.text },
  planPeriod: { fontSize: 13, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary, marginBottom: 4 },
  planFeatures: { gap: 8 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  featureText: { fontSize: 13, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary },
  selectedIndicator: { position: "absolute", top: 12, right: 12 },
  footer: { padding: 24, gap: 12, borderTopWidth: 1, borderTopColor: Colors.cardBorder },
  purchaseBtn: { borderRadius: 14, overflow: "hidden" },
  purchaseBtnGrad: { height: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  purchaseBtnText: { fontSize: 16, fontFamily: "Urbanist_700Bold", color: "#fff" },
  secureText: { textAlign: "center", fontSize: 12, fontFamily: "Urbanist_400Regular", color: Colors.textMuted },
});
