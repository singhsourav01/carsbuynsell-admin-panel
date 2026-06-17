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

const sections = [
  {
    title: "Information We Collect",
    content: [
      {
        subtitle: "Personal Details You Provide",
        text: "When you contact us for buying or selling a vehicle, we collect your name, phone number, email address, and location details. For car loan applications, we may also collect financial documents such as your PAN card, Aadhaar card, and bank statements.",
      },
      {
        subtitle: "Vehicle Information",
        text: "For sellers, we collect vehicle details including registration number, make, model, year, condition, and photographs to provide accurate valuations and connect you with genuine buyers.",
      },
      {
        subtitle: "Usage Data",
        text: "We automatically collect information about your interactions with our website, including pages visited, time spent, device type, and browser information.",
      },
    ],
  },
  {
    title: "How We Use Your Information",
    bullets: [
      "Connect buyers and sellers and facilitate vehicle transactions.",
      "Process loan applications with partner financial institutions.",
      "Provide vehicle valuations and market insights.",
      "Send transaction updates, matching listings, and service announcements.",
      "Improve our services through analytics and user feedback.",
      "Verify identity and prevent fraudulent activities.",
    ],
  },
  {
    title: "Who We Share Your Information With",
    content: [
      {
        subtitle: "Verified Buyers and Sellers",
        text: "We share relevant contact details between interested parties to enable communication and complete transactions.",
      },
      {
        subtitle: "Financial Partners",
        text: "Loan application documents are shared with trusted banking and NBFC partners to evaluate eligibility.",
      },
      {
        subtitle: "Service Providers",
        text: "Third-party providers may process data for SMS notifications, email communications, payment processing, and website hosting.",
      },
      {
        subtitle: "Legal Requirements",
        text: "We may disclose information when required by law, court order, government authorities, or to protect our rights.",
      },
    ],
  },
  {
    title: "How We Protect Your Data",
    text: "We use industry-standard security measures including SSL encryption, secure servers, regular security audits, and restricted access controls. However, no internet transmission method is completely secure.",
  },
  {
    title: "Your Privacy Rights",
    bullets: [
      "Access the personal information we hold about you.",
      "Request correction of inaccurate or incomplete information.",
      "Request deletion of your personal information, subject to legal requirements.",
      "Opt out of promotional communications.",
      "Withdraw consent for data processing where applicable.",
    ],
  },
  {
    title: "Cookies and Tracking",
    text: "We use cookies and similar technologies to remember your preferences, analyze traffic, and personalize your experience. You can manage cookie settings through your browser.",
  },
  {
    title: "Children's Privacy",
    text: "Our services are not intended for individuals under 18 years of age, and we do not knowingly collect personal information from children.",
  },
  {
    title: "Changes to This Policy",
    text: "We may update this policy periodically to reflect changes in our practices or legal requirements. Significant changes will be communicated through our website or by email.",
  },
];

export default function PrivacyPolicyScreen() {
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
          <Text style={styles.title}>Privacy Policy</Text>

          <Text style={styles.company}>
            Raj Enterprises - Cars Buy and Sell
          </Text>

          <Text style={styles.lastUpdated}>
            Last Updated: November 24, 2025
          </Text>

          <Text style={styles.intro}>
            At Raj Enterprises, we understand that your personal information
            matters to you, and it matters to us too. This policy explains
            how we collect, use, protect, and share your information when
            you use our services.
          </Text>

          {sections.map((section) => (
            <View key={section.title}>
              <Text style={styles.sectionHeading}>
                {section.title}
              </Text>

              {section.text && (
                <Text style={styles.sectionText}>
                  {section.text}
                </Text>
              )}

              {section.content?.map((item) => (
                <View key={item.subtitle} style={styles.subSection}>
                  <Text style={styles.subHeading}>
                    {item.subtitle}
                  </Text>
                  <Text style={styles.sectionText}>
                    {item.text}
                  </Text>
                </View>
              ))}

              {section.bullets?.map((bullet) => (
                <View key={bullet} style={styles.bulletRow}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.bulletText}>
                    {bullet}
                  </Text>
                </View>
              ))}
            </View>
          ))}

          <Text style={styles.sectionHeading}>Contact Us</Text>

          <Text style={styles.sectionText}>
            To exercise your privacy rights or ask questions about this
            policy, contact us:
          </Text>

          <Pressable
            onPress={() =>
              Linking.openURL("mailto:privacy@rajenterprises.com")
            }
          >
            <Text style={styles.contactLink}>
              privacy@rajenterprises.com
            </Text>
          </Pressable>

          <Pressable
            onPress={() => Linking.openURL("tel:+919607864200")}
          >
            <Text style={styles.contactLink}>
              +91 96078 64200
            </Text>
          </Pressable>
        </ScrollView>

        <Pressable
          style={styles.button}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>GOT IT</Text>
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
    maxHeight: "85%",
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
    paddingBottom: 30,
  },

  title: {
    fontSize: 24,
    fontFamily: "Urbanist_700Bold",
    color: Colors.text,
  },

  company: {
    marginTop: 8,
    fontSize: 16,
    fontFamily: "Urbanist_600SemiBold",
    color: Colors.text,
  },

  lastUpdated: {
    marginTop: 6,
    marginBottom: 18,
    fontSize: 13,
    fontFamily: "Urbanist_500Medium",
    color: Colors.textMuted,
  },

  intro: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: "Urbanist_400Regular",
    color: Colors.textSecondary,
  },

  sectionHeading: {
    marginTop: 24,
    marginBottom: 10,
    fontSize: 18,
    fontFamily: "Urbanist_700Bold",
    color: Colors.text,
  },

  subSection: {
    marginBottom: 14,
  },

  subHeading: {
    marginBottom: 4,
    fontSize: 15,
    fontFamily: "Urbanist_600SemiBold",
    color: Colors.text,
  },

  sectionText: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: "Urbanist_400Regular",
    color: Colors.textSecondary,
  },

  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },

  bullet: {
    marginTop: 2,
    marginRight: 10,
    fontSize: 16,
    color: Colors.textSecondary,
  },

  bulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    fontFamily: "Urbanist_400Regular",
    color: Colors.textSecondary,
  },

  contactLink: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: "Urbanist_600SemiBold",
    color: Colors.primary,
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


