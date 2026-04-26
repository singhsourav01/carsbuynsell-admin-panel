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
import { Ionicons, Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors } from "@/constants/colors";

export default function HelpSupportScreen() {
  const insets = useSafeAreaInsets();

  const PHONE = "+919988776655";
  const EMAIL = "support@rajmotors.com";

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
          <Text style={styles.title}>Help & Support</Text>

          {/* Icon */}
          <View style={styles.iconCircle}>
            <Feather name="headphones" size={34} color={Colors.primary} />
          </View>

          {/* Heading */}
          <Text style={styles.heading}>
            Need assistance?
          </Text>

          <Text style={styles.subHeading}>
            Our support team is available Mon–Sat, 10 AM to 7 PM IST.
          </Text>

          {/* Email Card */}
          <Pressable
            style={styles.card}
            onPress={() => Linking.openURL(`mailto:${EMAIL}`)}
          >
            <View style={styles.cardLeft}>
              <Ionicons name="mail" size={20} color={Colors.primary} />
              <View>
                <Text style={styles.cardLabel}>
                  EMAIL SUPPORT
                </Text>
                <Text style={styles.cardValue}>
                  {EMAIL}
                </Text>
              </View>
            </View>

            <Ionicons
              name="copy-outline"
              size={18}
              color={Colors.primary}
            />
          </Pressable>

          {/* Call Card */}
          <Pressable
            style={styles.card}
            onPress={() => Linking.openURL(`tel:${PHONE}`)}
          >
            <View style={styles.cardLeft}>
              <Ionicons name="call" size={20} color={Colors.primary} />

              <View>
                <Text style={styles.cardLabel}>
                  CALL SUPPORT
                </Text>

                <Text style={styles.cardValue}>
                  {PHONE}
                </Text>
              </View>
            </View>

            <Ionicons
              name="copy-outline"
              size={18}
              color={Colors.primary}
            />
          </Pressable>

          {/* WhatsApp Card */}
          <Pressable
            style={styles.card}
            onPress={() =>
              Linking.openURL(`https://wa.me/${PHONE.replace("+", "")}`)
            }
          >
            <View style={styles.cardLeft}>
              <Ionicons name="logo-whatsapp" size={20} color="#22C55E" />

              <View>
                <Text style={styles.cardLabel}>
                  WHATSAPP
                </Text>

                <Text style={styles.cardValue}>
                  {PHONE}
                </Text>
              </View>
            </View>

            <Ionicons
              name="copy-outline"
              size={18}
              color={Colors.primary}
            />
          </Pressable>

          {/* Warning Box */}
          <View style={styles.warningBox}>
            <Ionicons
              name="information-circle"
              size={18}
              color="#92400E"
            />

            <Text style={styles.warningText}>
              For faster resolution, please include your Dealer ID in your messages.
            </Text>
          </View>
        </ScrollView>

        {/* CTA */}
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
  },

  content: {
    paddingTop: 20,
    paddingBottom: 20,
  },

  title: {
    fontSize: 22,
    fontFamily: "Urbanist_700Bold",
    color: Colors.text,
    marginBottom: 10,
  },

  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 50,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginVertical: 18,
  },

  heading: {
    textAlign: "center",
    fontSize: 20,
    fontFamily: "Urbanist_700Bold",
    color: Colors.text,
  },

  subHeading: {
    textAlign: "center",
    fontSize: 14,
    marginTop: 6,
    marginBottom: 22,
    fontFamily: "Urbanist_400Regular",
    color: Colors.textSecondary,
  },

  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },

  cardLeft: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },

  cardLabel: {
    fontSize: 12,
    fontFamily: "Urbanist_600SemiBold",
    color: Colors.textMuted,
  },

  cardValue: {
    fontSize: 15,
    fontFamily: "Urbanist_700Bold",
    color: Colors.text,
  },

  warningBox: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#FEF3C7",
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },

  warningText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Urbanist_500Medium",
    color: "#92400E",
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