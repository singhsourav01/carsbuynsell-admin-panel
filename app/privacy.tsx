import React from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors } from "@/constants/colors";

const PRIVACY_SECTIONS = [
  {
    title: "Information We Collect",
    content: `We collect information you provide directly to us, such as:

• Personal Information: Name, email address, phone number, and identity verification documents.
• Transaction Data: Bidding history, purchase records, and payment information.
• Device Information: Device type, operating system, and unique device identifiers.
• Usage Data: How you interact with our app, including pages visited and features used.`,
  },
  {
    title: "How We Use Your Information",
    content: `We use the information we collect to:

• Provide, maintain, and improve our services
• Process transactions and send related information
• Send promotional communications (with your consent)
• Monitor and analyze trends, usage, and activities
• Detect, investigate, and prevent fraudulent transactions
• Comply with legal obligations`,
  },
  {
    title: "Information Sharing",
    content: `We may share your information with:

• Sellers: When you win an auction or make a purchase, we share necessary contact details.
• Payment Processors: To process your payments securely through Razorpay.
• Service Providers: Third parties that help us operate our platform.
• Legal Requirements: When required by law or to protect our rights.

We do not sell your personal information to third parties.`,
  },
  {
    title: "Data Security",
    content: `We implement appropriate security measures to protect your personal information:

• Encryption of data in transit using SSL/TLS
• Secure storage of sensitive information
• Regular security assessments and updates
• Access controls and authentication mechanisms

While we strive to protect your information, no method of transmission over the Internet is 100% secure.`,
  },
  {
    title: "Your Rights",
    content: `You have the right to:

• Access your personal information
• Correct inaccurate data
• Request deletion of your data
• Opt-out of marketing communications
• Export your data in a portable format

To exercise these rights, contact us at privacy@carsbuynsell.com.`,
  },
  {
    title: "Data Retention",
    content: `We retain your personal information for as long as:

• Your account is active
• Needed to provide services to you
• Required by law or regulations
• Necessary to resolve disputes

You may request deletion of your account and associated data at any time.`,
  },
  {
    title: "Updates to This Policy",
    content: `We may update this Privacy Policy from time to time. We will notify you of any changes by:

• Posting the new policy on this page
• Updating the "Last Updated" date
• Sending you an email notification for significant changes

Continued use of our services after changes constitutes acceptance of the updated policy.`,
  },
];

export default function PrivacyPolicyScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.titleCard}>
          <View style={styles.iconWrap}>
            <Ionicons name="shield-checkmark" size={28} color={Colors.primary} />
          </View>
          <Text style={styles.titleText}>Privacy Policy</Text>
          <Text style={styles.updateDate}>Last Updated: March 2024</Text>
        </View>

        <View style={styles.introCard}>
          <Text style={styles.introText}>
            At CarsBuynSell, we are committed to protecting your privacy. This policy explains how we collect, use, and safeguard your personal information when you use our mobile application and services.
          </Text>
        </View>

        {PRIVACY_SECTIONS.map((section, idx) => (
          <View key={idx} style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionNumber}>{String(idx + 1).padStart(2, "0")}</Text>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </View>
        ))}

        <View style={styles.contactCard}>
          <Ionicons name="mail-outline" size={20} color={Colors.primary} />
          <Text style={styles.contactText}>
            Questions about this policy? Contact us at{" "}
            <Text style={styles.contactEmail}>privacy@carsbuynsell.com</Text>
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
    backgroundColor: Colors.primaryLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
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
  contactCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  contactText: { flex: 1, fontSize: 13, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary, lineHeight: 20 },
  contactEmail: { color: Colors.primary, fontFamily: "Urbanist_600SemiBold" },
});
