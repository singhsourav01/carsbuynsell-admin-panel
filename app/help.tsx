import React, { useState } from "react";
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  Linking, TextInput, Alert, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { apiRequestDirect } from "@/lib/auth";

const FAQ_ITEMS = [
  {
    q: "How do I place a bid?",
    a: "Navigate to a live auction listing, enter your bid amount (must be higher than current bid), and tap 'Place Bid'. You need an active subscription to bid.",
  },
  {
    q: "What is the subscription for?",
    a: "The subscription allows you to make up to 3 transactions (bids or purchases) per day. Your daily limit resets at midnight.",
  },
  {
    q: "How do I buy a vehicle directly?",
    a: "Go to 'Buy Now' listings, select a vehicle, and tap 'Buy Now'. Payment is processed through Razorpay.",
  },
  {
    q: "Can I cancel my bid?",
    a: "Once placed, bids cannot be cancelled. Please ensure you're willing to purchase before bidding.",
  },
  {
    q: "How do I contact the seller?",
    a: "After winning an auction or completing a purchase, seller contact details will be shared with you.",
  },
  {
    q: "What payment methods are accepted?",
    a: "We accept UPI, credit/debit cards, net banking, and wallets through our secure Razorpay payment gateway.",
  },
];

export default function HelpScreen() {
  const insets = useSafeAreaInsets();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleContactSupport = async () => {
    if (!message.trim()) {
      Alert.alert("Empty Message", "Please enter your message before sending.");
      return;
    }
    setSending(true);
    try {
      const res = await apiRequestDirect("POST", "http://13.127.188.130:3002/user/support", { message: message.trim() }, true);
      if (res.ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Sent!", "Your message has been sent. We'll get back to you soon.");
        setMessage("");
      } else {
        Alert.alert("Error", "Failed to send message. Please try again.");
      }
    } catch {
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const openEmail = () => {
    Linking.openURL("mailto:support@carsbuynsell.com?subject=Support Request");
  };

  const openPhone = () => {
    Linking.openURL("tel:+919876543210");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>
{/* 
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <LinearGradient colors={[Colors.hero, Colors.heroDark]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          <Ionicons name="help-buoy-outline" size={40} color="#fff" />
          <Text style={styles.heroTitle}>How can we help?</Text>
          <Text style={styles.heroSub}>Find answers or contact our support team</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Contact</Text>
          <View style={styles.contactRow}>
            <Pressable onPress={openEmail} style={styles.contactCard}>
              <View style={[styles.contactIcon, { backgroundColor: "#EEF2FF" }]}>
                <Ionicons name="mail-outline" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.contactLabel}>Email Us</Text>
            </Pressable>
            <Pressable onPress={openPhone} style={styles.contactCard}>
              <View style={[styles.contactIcon, { backgroundColor: "#D1FAE5" }]}>
                <Ionicons name="call-outline" size={20} color={Colors.success} />
              </View>
              <Text style={styles.contactLabel}>Call Us</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          <View style={styles.faqContainer}>
            {FAQ_ITEMS.map((item, idx) => (
              <Pressable
                key={idx}
                onPress={() => {
                  setExpandedFaq(expandedFaq === idx ? null : idx);
                  Haptics.selectionAsync();
                }}
                style={[styles.faqItem, idx === 0 && { borderTopWidth: 0 }]}
              >
                <View style={styles.faqHeader}>
                  <Text style={styles.faqQuestion}>{item.q}</Text>
                  <Ionicons
                    name={expandedFaq === idx ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={Colors.textMuted}
                  />
                </View>
                {expandedFaq === idx && (
                  <Text style={styles.faqAnswer}>{item.a}</Text>
                )}
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Send us a message</Text>
          <View style={styles.formCard}>
            <TextInput
              style={styles.textArea}
              placeholder="Describe your issue or question..."
              placeholderTextColor={Colors.textMuted}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <Pressable
              onPress={handleContactSupport}
              style={({ pressed }) => [styles.sendBtn, { opacity: pressed ? 0.85 : 1 }]}
              disabled={sending}
            >
              <LinearGradient colors={[Colors.heroLight, Colors.hero]} style={styles.sendGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {sending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="send" size={16} color="#fff" />
                    <Text style={styles.sendText}>Send Message</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </View>
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
  content: { paddingBottom: 40 },
  heroCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    gap: 10,
    overflow: "hidden",
  },
  heroTitle: { fontSize: 22, fontFamily: "Urbanist_700Bold", color: "#fff" },
  heroSub: { fontSize: 14, fontFamily: "Urbanist_400Regular", color: "rgba(255,255,255,0.8)", textAlign: "center" },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontFamily: "Urbanist_700Bold", color: Colors.text, paddingHorizontal: 16, marginBottom: 12 },
  contactRow: { flexDirection: "row", paddingHorizontal: 16, gap: 12 },
  contactCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  contactIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  contactLabel: { fontSize: 14, fontFamily: "Urbanist_600SemiBold", color: Colors.text },
  faqContainer: {
    marginHorizontal: 16,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: "hidden",
  },
  faqItem: { padding: 16, borderTopWidth: 1, borderTopColor: Colors.cardBorder },
  faqHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  faqQuestion: { flex: 1, fontSize: 14, fontFamily: "Urbanist_600SemiBold", color: Colors.text, marginRight: 12 },
  faqAnswer: { fontSize: 13, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary, marginTop: 10, lineHeight: 20 },
  formCard: {
    marginHorizontal: 16,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 12,
  },
  textArea: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    fontFamily: "Urbanist_400Regular",
    color: Colors.text,
    minHeight: 100,
  },
  sendBtn: { borderRadius: 12, overflow: "hidden" },
  sendGrad: { height: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  sendText: { fontSize: 15, fontFamily: "Urbanist_700Bold", color: "#fff" },
});
