
import React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors } from "@/constants/colors";

const PHONE = "+919607864200";
const EMAIL = "legal@rajenterprises.com";

const sections = [
  {
    title: "Acceptance of Terms",
    text: "By creating an account, listing a vehicle, applying for a loan, or using our services, you confirm that you are at least 18 years old and that all information you provide is accurate and complete.",
  },
  {
    title: "Our Role",
    text: "Raj Enterprises acts solely as a platform connecting buyers, sellers, and lending partners. We are not the owner, seller, buyer, or lender for any listed vehicle.",
  },
  {
    title: "Vehicle Listings",
    text: "Sellers are responsible for providing accurate vehicle information and valid documentation. Buyers must independently verify vehicle condition, ownership, and documents before completing a purchase.",
  },
  {
    title: "Loan Facilitation",
    text: "We connect users with banks and NBFC partners. Loan approval, interest rates, eligibility, and terms are determined solely by the lending institution.",
  },
  {
    title: "User Responsibilities",
    bullets: [
      "Provide truthful and accurate information.",
      "List only vehicles you own or are authorized to sell.",
      "Maintain valid and genuine vehicle documents.",
      "Comply with applicable laws and RTO regulations.",
      "Protect your account credentials.",
      "Use the platform lawfully and in good faith.",
    ],
  },
  {
    title: "Prohibited Activities",
    bullets: [
      "Listing stolen, illegally obtained, or tampered vehicles.",
      "Providing false information or using fake identities.",
      "Engaging in fraud, price manipulation, or bid rigging.",
      "Harassing or abusing other users.",
      "Attempting to compromise platform security.",
      "Using automated scraping tools without permission.",
    ],
  },
  {
    title: "Fees & Payments",
    text: "Browsing listings is free. Premium services may incur charges, which will be disclosed before purchase. Vehicle payments occur directly between buyers and sellers.",
  },
  {
    title: "Disclaimers & Liability",
    text: "Raj Enterprises does not inspect, verify, or guarantee vehicle condition, legality, safety, or listing accuracy. We are not responsible for transaction disputes, loan rejections, vehicle defects, or financial losses arising from platform use.",
  },
  {
    title: "Intellectual Property",
    text: "All platform content, including logos, text, graphics, and software, is owned by or licensed to Raj Enterprises. By uploading content, you grant us a non-exclusive, royalty-free license to display and distribute it on our platform.",
  },
  {
    title: "Account Termination",
    text: "We may suspend or terminate accounts involved in fraud, misuse, or violations of these terms. You may close your account at any time by contacting our support team.",
  },
  {
    title: "Governing Law",
    text: "These terms are governed by the laws of India. Disputes will first be addressed through good-faith negotiations and, if unresolved, through arbitration under Indian law.",
  },
  {
    title: "Changes to Terms",
    text: "We may update these terms from time to time to reflect changes in our services, legal requirements, or business practices. Continued use of our platform constitutes acceptance of the updated terms.",
  },
];

export default function TermsConditionsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.overlay}>
      <View
        style={[
          styles.modalContainer,
          { paddingBottom: insets.bottom + 12 },
        ]}
      >
        <Pressable
          style={styles.closeBtn}
          onPress={() => router.back()}
        >
          <Ionicons
            name="close"
            size={22}
            color={Colors.textMuted}
          />
        </Pressable>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <Text style={styles.title}>Terms & Conditions</Text>

          <Text style={styles.company}>
            Raj Enterprises - Cars Buy and Sell
          </Text>

          <Text style={styles.effectiveDate}>
            Effective Date: November 24, 2025
          </Text>

          <Text style={styles.intro}>
            By accessing or using our platform, you agree to these
            Terms & Conditions. Please read them carefully before
            using our services.
          </Text>

          {sections.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionHeading}>
                {section.title}
              </Text>

              {section.text && (
                <Text style={styles.sectionText}>
                  {section.text}
                </Text>
              )}

              {section.bullets?.map((item) => (
                <View key={item} style={styles.bulletRow}>
                  <Text style={styles.bullet}>•</Text>

                  <Text style={styles.bulletText}>
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          ))}

          <View style={styles.contactBox}>
            <Text style={styles.contactTitle}>
              Questions About These Terms?
            </Text>

            <Pressable
              onPress={() =>
                Linking.openURL(`mailto:${EMAIL}`)
              }
            >
              <Text style={styles.contactLink}>
                {EMAIL}
              </Text>
            </Pressable>

            <Pressable
              onPress={() =>
                Linking.openURL(`tel:${PHONE}`)
              }
            >
              <Text style={styles.contactLink}>
                {PHONE}
              </Text>
            </Pressable>

            <Text style={styles.contactHours}>
              Monday – Saturday, 9:00 AM – 6:00 PM IST
            </Text>
          </View>
        </ScrollView>

        <Pressable
          style={styles.button}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>
            GOT IT
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },

  modalContainer: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 24,
    maxHeight: "88%",
  },

  closeBtn: {
    position: "absolute",
    right: 18,
    top: 18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },

  content: {
    paddingTop: 20,
    paddingBottom: 20,
  },

  title: {
    fontSize: 22,
    fontFamily: "Urbanist_700Bold",
    color: Colors.text,
  },

  company: {
    marginTop: 6,
    fontSize: 15,
    fontFamily: "Urbanist_600SemiBold",
    color: Colors.text,
  },

  effectiveDate: {
    marginTop: 6,
    marginBottom: 16,
    fontSize: 13,
    fontFamily: "Urbanist_500Medium",
    color: Colors.textMuted,
  },

  intro: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.textSecondary,
    fontFamily: "Urbanist_400Regular",
  },

  section: {
    marginTop: 22,
  },

  sectionHeading: {
    fontSize: 16,
    fontFamily: "Urbanist_700Bold",
    color: Colors.text,
    marginBottom: 8,
  },

  sectionText: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.textSecondary,
    fontFamily: "Urbanist_400Regular",
  },

  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },

  bullet: {
    marginRight: 10,
    fontSize: 16,
    lineHeight: 22,
    color: Colors.textSecondary,
  },

  bulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    color: Colors.textSecondary,
    fontFamily: "Urbanist_400Regular",
  },

  contactBox: {
    marginTop: 28,
    padding: 18,
    borderRadius: 16,
    backgroundColor: Colors.background,
  },

  contactTitle: {
    fontSize: 15,
    fontFamily: "Urbanist_700Bold",
    color: Colors.text,
    marginBottom: 12,
  },

  contactLink: {
    fontSize: 14,
    fontFamily: "Urbanist_600SemiBold",
    color: Colors.primary,
    marginBottom: 8,
  },

  contactHours: {
    marginTop: 8,
    fontSize: 13,
    fontFamily: "Urbanist_400Regular",
    color: Colors.textMuted,
  },

  button: {
    backgroundColor: Colors.primary,
    height: 54,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  buttonText: {
    fontSize: 15,
    fontFamily: "Urbanist_700Bold",
    color: "#fff",
    letterSpacing: 1,
  },
});