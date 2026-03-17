import React from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors } from "@/constants/colors";

const TERMS_SECTIONS = [
  {
    title: "Acceptance of Terms",
    content: `By accessing or using the CarsBuynSell mobile application, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.

These terms apply to all users, including buyers, sellers, and visitors.`,
  },
  {
    title: "Eligibility",
    content: `To use our services, you must:

• Be at least 18 years of age
• Be a registered dealer or authorized representative
• Provide accurate and complete registration information
• Maintain the security of your account credentials
• Have a valid business registration (for sellers)

We reserve the right to refuse service to anyone at our discretion.`,
  },
  {
    title: "Subscription & Transactions",
    content: `Our subscription model works as follows:

• A subscription allows 3 transactions per day (bids or purchases)
• Daily transaction limits reset at midnight IST
• Subscription fees are non-refundable once activated
• You may repurchase a subscription if daily limits are exhausted
• All bids are binding commitments to purchase

Transaction fees and applicable taxes are clearly displayed before confirmation.`,
  },
  {
    title: "Bidding Rules",
    content: `When participating in auctions:

• All bids are final and cannot be retracted
• Bid amounts must exceed the current highest bid
• Winning bidders are obligated to complete the purchase
• Failure to honor winning bids may result in account suspension
• Bid sniping and collusion are strictly prohibited

We monitor all bidding activity for fraudulent behavior.`,
  },
  {
    title: "Buy Now Transactions",
    content: `For immediate purchases:

• Listed prices are final and non-negotiable
• Payment must be completed within the specified timeframe
• Ownership transfer occurs after full payment verification
• Vehicle inspection is the buyer's responsibility
• We facilitate but do not guarantee transaction completion

All sales are subject to vehicle availability.`,
  },
  {
    title: "Seller Responsibilities",
    content: `Sellers on our platform must:

• Provide accurate vehicle descriptions and photos
• Disclose any known defects or issues
• Set reasonable and honest pricing
• Respond to buyer inquiries promptly
• Complete ownership transfer upon payment
• Comply with all applicable laws and regulations

Misrepresentation may result in permanent account termination.`,
  },
  {
    title: "Prohibited Activities",
    content: `The following activities are strictly prohibited:

• Fraudulent listings or transactions
• Manipulating bids or prices
• Creating multiple accounts
• Sharing account credentials
• Harassing other users
• Circumventing platform fees
• Using automated bidding tools
• Money laundering or illegal transactions

Violations will result in immediate account suspension.`,
  },
  {
    title: "Limitation of Liability",
    content: `CarsBuynSell:

• Acts as an intermediary platform only
• Does not own, inspect, or warrant vehicles
• Is not responsible for transaction disputes
• Does not guarantee vehicle condition or authenticity
• Is not liable for indirect or consequential damages

Maximum liability is limited to fees paid for our services.`,
  },
  {
    title: "Dispute Resolution",
    content: `In case of disputes:

• Contact our support team within 48 hours
• Provide all relevant documentation
• Allow 7-14 business days for investigation
• Accept our mediation decision as preliminary
• Pursue arbitration for unresolved matters

Disputes are governed by the laws of India, with jurisdiction in appropriate courts.`,
  },
  {
    title: "Modifications",
    content: `We reserve the right to:

• Modify these terms at any time
• Change pricing and subscription models
• Add or remove features
• Suspend or terminate accounts
• Update platform policies

Continued use after modifications constitutes acceptance.`,
  },
];

export default function TermsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.titleCard}>
          <View style={styles.iconWrap}>
            <Ionicons name="document-text" size={28} color={Colors.primary} />
          </View>
          <Text style={styles.titleText}>Terms & Conditions</Text>
          <Text style={styles.updateDate}>Last Updated: March 2024</Text>
        </View>

        <View style={styles.introCard}>
          <Text style={styles.introText}>
            Please read these Terms and Conditions carefully before using the CarsBuynSell platform. These terms govern your use of our services and constitute a legally binding agreement.
          </Text>
        </View>

        {TERMS_SECTIONS.map((section, idx) => (
          <View key={idx} style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionNumber}>{String(idx + 1).padStart(2, "0")}</Text>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </View>
        ))}

        <View style={styles.footerCard}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
          <Text style={styles.footerText}>
            By using our services, you acknowledge that you have read, understood, and agree to these Terms and Conditions.
          </Text>
        </View>

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
    backgroundColor: "#FEF3C7",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#F59E0B",
  },
  introText: { fontSize: 14, fontFamily: "Urbanist_500Medium", color: Colors.text, lineHeight: 22 },
  sectionCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  sectionNumber: { fontSize: 12, fontFamily: "Urbanist_700Bold", color: Colors.primary },
  sectionTitle: { fontSize: 16, fontFamily: "Urbanist_700Bold", color: Colors.text, flex: 1 },
  sectionContent: { fontSize: 13, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary, lineHeight: 22 },
  footerCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#D1FAE5",
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  footerText: { flex: 1, fontSize: 13, fontFamily: "Urbanist_500Medium", color: Colors.text, lineHeight: 20 },
});
