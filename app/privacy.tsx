import React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors } from "@/constants/colors";

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
        {/* Close Button */}
        <Pressable
          style={styles.closeBtn}
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={22} color={Colors.textMuted} />
        </Pressable>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* Title */}
          <Text style={styles.title}>Privacy Policy</Text>

          {/* Section 1 */}
          <Text style={styles.sectionHeading}>
            1. Introduction
          </Text>

          <Text style={styles.sectionText}>
            At Raj Motors, we value your trust. This privacy governs your
            use of our dealer platform. Please read it carefully before
            proceeding.
          </Text>

          {/* Section 2 */}
          <Text style={styles.sectionHeading}>
            2. Key Provisions
          </Text>

          <Text style={styles.sectionText}>
            We collect and process your business information solely to
            facilitate vehicle trading and verification. We do not sell
            your data to third-party advertisers. All auction participants
            must adhere to fair bidding practices.
          </Text>

          {/* Section 3 */}
          <Text style={styles.sectionHeading}>
            3. Compliance
          </Text>

          <Text style={styles.sectionText}>
            Failure to comply with these terms may result in account
            freezing or suspension. Refund requests for subscriptions are
            processed within 5–7 business days if the subscription remains
            unused.
          </Text>
        </ScrollView>

        {/* Button */}
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
    maxHeight: "80%",
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
  },

  content: {
    paddingTop: 20,
    paddingBottom: 30,
  },

  title: {
    fontSize: 22,
    fontFamily: "Urbanist_700Bold",
    color: Colors.text,
    marginBottom: 22,
  },

  sectionHeading: {
    fontSize: 16,
    fontFamily: "Urbanist_700Bold",
    color: Colors.text,
    marginBottom: 6,
    marginTop: 12,
  },

  sectionText: {
    fontSize: 14,
    fontFamily: "Urbanist_400Regular",
    color: Colors.textSecondary,
    lineHeight: 22,
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