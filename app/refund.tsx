import React from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors } from "@/constants/colors";

const REFUND_ITEMS = [
  {
    icon: "card-outline",
    iconBg: "#EEF2FF",
    iconColor: Colors.primary,
    title: "Subscription Fees",
    desc: "Subscription fees are non-refundable once the subscription is activated. Your 3 daily transactions will be available immediately upon purchase.",
    refundable: false,
  },
  {
    icon: "flash-outline",
    iconBg: "#FEF3C7",
    iconColor: Colors.warning,
    title: "Unused Daily Transactions",
    desc: "Unused daily transactions do not carry over to the next day and are not refundable. Each day starts with a fresh limit of 3 transactions.",
    refundable: false,
  },
  {
    icon: "close-circle-outline",
    iconBg: "#FEE2E2",
    iconColor: Colors.danger,
    title: "Failed Payments",
    desc: "If a payment fails or is declined, no charges will be applied. If you see a deduction without service activation, contact support within 24 hours for a full refund.",
    refundable: true,
  },
  {
    icon: "sync-outline",
    iconBg: "#D1FAE5",
    iconColor: Colors.success,
    title: "Duplicate Charges",
    desc: "If you are charged multiple times for the same transaction due to a technical error, we will refund the duplicate amount within 5-7 business days.",
    refundable: true,
  },
  {
    icon: "car-sport-outline",
    iconBg: "#EEF2FF",
    iconColor: Colors.primary,
    title: "Vehicle Purchases",
    desc: "Vehicle purchase transactions are between buyers and sellers. CarsBuynSell acts as a facilitator and does not process vehicle payment refunds. Disputes should be resolved directly with the seller.",
    refundable: false,
  },
  {
    icon: "hammer-outline",
    iconBg: "#FFF0F0",
    iconColor: "#FF6B6B",
    title: "Winning Bids",
    desc: "Once you win an auction, you are obligated to complete the purchase. Bid deposits or earnest money follow separate rules as specified in the auction terms.",
    refundable: false,
  },
];

const PROCESS_STEPS = [
  { step: "1", title: "Submit Request", desc: "Email refunds@carsbuynsell.com with your transaction details" },
  { step: "2", title: "Review", desc: "Our team reviews your request within 2-3 business days" },
  { step: "3", title: "Decision", desc: "You'll receive an email with the refund decision" },
  { step: "4", title: "Processing", desc: "Approved refunds are processed within 5-7 business days" },
];

export default function RefundPolicyScreen() {
  const insets = useSafeAreaInsets();

  const openEmail = () => {
    Linking.openURL("mailto:refunds@carsbuynsell.com?subject=Refund Request");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Refund Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.titleCard}>
          <View style={styles.iconWrap}>
            <Ionicons name="wallet" size={28} color={Colors.primary} />
          </View>
          <Text style={styles.titleText}>Refund Policy</Text>
          <Text style={styles.updateDate}>Last Updated: March 2024</Text>
        </View>

        <View style={styles.introCard}>
          <Ionicons name="information-circle" size={20} color={Colors.primary} />
          <Text style={styles.introText}>
            We strive to provide the best service possible. Please review our refund policy for different types of transactions.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Refund Eligibility</Text>
        {REFUND_ITEMS.map((item, idx) => (
          <View key={idx} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <View style={[styles.itemIcon, { backgroundColor: item.iconBg }]}>
                <Ionicons name={item.icon as any} size={20} color={item.iconColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <View style={[styles.refundBadge, { backgroundColor: item.refundable ? "#D1FAE5" : "#FEE2E2" }]}>
                  <Text style={[styles.refundBadgeText, { color: item.refundable ? Colors.success : Colors.danger }]}>
                    {item.refundable ? "Refundable" : "Non-Refundable"}
                  </Text>
                </View>
              </View>
            </View>
            <Text style={styles.itemDesc}>{item.desc}</Text>
          </View>
        ))}

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Refund Process</Text>
        <View style={styles.processCard}>
          {PROCESS_STEPS.map((step, idx) => (
            <View key={idx} style={styles.processStep}>
              <View style={styles.processStepNumber}>
                <Text style={styles.processStepNumberText}>{step.step}</Text>
              </View>
              <View style={styles.processStepContent}>
                <Text style={styles.processStepTitle}>{step.title}</Text>
                <Text style={styles.processStepDesc}>{step.desc}</Text>
              </View>
              {idx < PROCESS_STEPS.length - 1 && <View style={styles.processLine} />}
            </View>
          ))}
        </View>

        <View style={styles.notesCard}>
          <Text style={styles.notesTitle}>Important Notes</Text>
          <View style={styles.noteItem}>
            <Ionicons name="time-outline" size={16} color={Colors.warning} />
            <Text style={styles.noteText}>Refund requests must be submitted within 7 days of the transaction.</Text>
          </View>
          <View style={styles.noteItem}>
            <Ionicons name="receipt-outline" size={16} color={Colors.primary} />
            <Text style={styles.noteText}>Keep your transaction ID and payment receipts for reference.</Text>
          </View>
          <View style={styles.noteItem}>
            <Ionicons name="card-outline" size={16} color={Colors.success} />
            <Text style={styles.noteText}>Refunds are credited to the original payment method.</Text>
          </View>
        </View>

        <Pressable onPress={openEmail} style={styles.contactBtn}>
          <Ionicons name="mail" size={18} color="#fff" />
          <Text style={styles.contactBtnText}>Request a Refund</Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", backgroundColor: Colors.card, borderRadius: 12 },
  headerTitle: { fontSize: 18, fontFamily: "Urbanist_700Bold", color: Colors.text },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  titleCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  titleText: { fontSize: 22, fontFamily: "Urbanist_700Bold", color: Colors.text },
  updateDate: { fontSize: 13, fontFamily: "Urbanist_400Regular", color: Colors.textMuted },
  introCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: Colors.primaryLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  introText: { flex: 1, fontSize: 14, fontFamily: "Urbanist_500Medium", color: Colors.text, lineHeight: 22 },
  sectionTitle: { fontSize: 16, fontFamily: "Urbanist_700Bold", color: Colors.text, marginBottom: 12 },
  itemCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  itemHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  itemIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  itemTitle: { fontSize: 15, fontFamily: "Urbanist_700Bold", color: Colors.text, marginBottom: 4 },
  refundBadge: { alignSelf: "flex-start", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  refundBadgeText: { fontSize: 10, fontFamily: "Urbanist_700Bold" },
  itemDesc: { fontSize: 13, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary, lineHeight: 20 },
  processCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  processStep: { flexDirection: "row", alignItems: "flex-start", position: "relative", paddingBottom: 20 },
  processStepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  processStepNumberText: { fontSize: 13, fontFamily: "Urbanist_700Bold", color: "#fff" },
  processStepContent: { flex: 1, paddingTop: 2 },
  processStepTitle: { fontSize: 14, fontFamily: "Urbanist_700Bold", color: Colors.text },
  processStepDesc: { fontSize: 12, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary, marginTop: 2 },
  processLine: {
    position: "absolute",
    left: 13,
    top: 32,
    bottom: 4,
    width: 2,
    backgroundColor: Colors.cardBorder,
  },
  notesCard: {
    backgroundColor: "#FFFBEB",
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: "#F59E0B",
    gap: 12,
  },
  notesTitle: { fontSize: 14, fontFamily: "Urbanist_700Bold", color: Colors.text },
  noteItem: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  noteText: { flex: 1, fontSize: 13, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary, lineHeight: 18 },
  contactBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 24,
  },
  contactBtnText: { fontSize: 15, fontFamily: "Urbanist_700Bold", color: "#fff" },
});
