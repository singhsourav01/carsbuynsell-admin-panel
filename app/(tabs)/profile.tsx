import React, { useState } from "react";
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  TextInput, Modal, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { SubscriptionModal } from "@/components/SubscriptionModal";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { apiRequest } from "@/lib/auth";

const CATEGORIES = ["Sedan", "SUV", "Hatchback", "Luxury", "Sports", "Electric"];

function SellSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("SUV");
  const [listingType, setListingType] = useState<"AUCTION" | "BUY_NOW">("AUCTION");
  const [basePrice, setBasePrice] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !basePrice.trim()) { Alert.alert("Missing Info", "Please enter vehicle title and price."); return; }
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/user/sell-request", { title: title.trim(), description: description.trim(), category, listingType, basePrice: parseInt(basePrice, 10) });
      const data = await res.json();
      if (data.success) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); Alert.alert("Submitted!", data.data.message); setTitle(""); setDescription(""); setBasePrice(""); onClose(); }
    } catch { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); }
    finally { setLoading(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={sellS.overlay}>
          <View style={sellS.sheet}>
            <View style={sellS.grabber} />
            <View style={sellS.header}><Text style={sellS.title}>Sell Your Vehicle</Text><Pressable onPress={onClose} style={sellS.closeBtn}><Ionicons name="close" size={20} color={Colors.textSecondary} /></Pressable></View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={sellS.form}>
              <View style={sellS.group}><Text style={sellS.label}>Vehicle Title</Text><TextInput style={sellS.input} placeholder="e.g., Honda City ZX 2022" placeholderTextColor={Colors.textMuted} value={title} onChangeText={setTitle} /></View>
              <View style={sellS.group}><Text style={sellS.label}>Description</Text><TextInput style={[sellS.input, { height: 80, textAlignVertical: "top" }]} placeholder="Condition, features, history..." placeholderTextColor={Colors.textMuted} value={description} onChangeText={setDescription} multiline /></View>
              <View style={sellS.group}>
                <Text style={sellS.label}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={sellS.chipsRow}>
                  {CATEGORIES.map(c => <Pressable key={c} onPress={() => { setCategory(c); Haptics.selectionAsync(); }} style={[sellS.chip, category === c && sellS.chipActive]}><Text style={[sellS.chipText, category === c && sellS.chipActiveText]}>{c}</Text></Pressable>)}
                </ScrollView>
              </View>
              <View style={sellS.group}>
                <Text style={sellS.label}>Listing Type</Text>
                <View style={sellS.typeRow}>
                  {(["AUCTION", "BUY_NOW"] as const).map(t => (
                    <Pressable key={t} onPress={() => { setListingType(t); Haptics.selectionAsync(); }} style={[sellS.typeBtn, listingType === t && sellS.typeBtnActive]}>
                      <Ionicons name={t === "AUCTION" ? "flash" : "pricetag"} size={16} color={listingType === t ? Colors.primary : Colors.textMuted} />
                      <Text style={[sellS.typeBtnText, listingType === t && { color: Colors.primary }]}>{t === "AUCTION" ? "Live Auction" : "Buy Now"}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View style={sellS.group}>
                <Text style={sellS.label}>Base Price (₹)</Text>
                <View style={sellS.priceWrap}><Text style={sellS.rupee}>₹</Text><TextInput style={sellS.priceInput} placeholder="e.g., 1500000" placeholderTextColor={Colors.textMuted} value={basePrice} onChangeText={setBasePrice} keyboardType="numeric" /></View>
              </View>
              <View style={sellS.notice}><Ionicons name="time-outline" size={15} color={Colors.warning} /><Text style={sellS.noticeText}>Admin will review and list your vehicle within 24 hours.</Text></View>
              <Pressable style={({ pressed }) => [sellS.submitBtn, { opacity: pressed ? 0.85 : 1 }]} onPress={handleSubmit} disabled={loading}>
                <LinearGradient colors={[Colors.heroLight, Colors.hero]} style={sellS.submitGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {loading ? <ActivityIndicator color="#fff" /> : <><Ionicons name="send" size={15} color="#fff" /><Text style={sellS.submitText}>Submit for Review</Text></>}
                </LinearGradient>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [sellVisible, setSellVisible] = useState(false);
  const [subVisible, setSubVisible] = useState(false);
  const topPad = insets.top + (insets.top < 20 ? 67 : 0);

  const { data } = useQuery<{ success: boolean; data: any }>({ queryKey: ["/api/user/profile"] });
  const { data: subData } = useQuery<{ success: boolean; data: any }>({ queryKey: ["/api/subscriptions/me"] });

  const profile = data?.data;
  const sub = subData?.data;

  const initials = (user?.fullName ?? profile?.fullName ?? "U").split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2);

  const menu = [
    { icon: "car-sport-outline", label: "My Vehicles" },
    { icon: "heart-outline", label: "Saved Listings" },
    { icon: "notifications-outline", label: "Notifications" },
    { icon: "help-circle-outline", label: "Help & Support" },
  ];

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Profile</Text>
        <Pressable onPress={() => logout()} style={styles.logoutIcon}><Ionicons name="log-out-outline" size={22} color={Colors.textSecondary} /></Pressable>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <LinearGradient colors={[Colors.hero, Colors.heroLight]} style={styles.avatar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={styles.avatarText}>{initials}</Text>
          </LinearGradient>
          <Text style={styles.profileName}>{user?.fullName ?? profile?.fullName ?? "User"}</Text>
          <Text style={styles.profileEmail}>{user?.email ?? profile?.email}</Text>
          <Text style={styles.profilePhone}>{user?.phone ?? profile?.phone}</Text>
        </View>

        {/* Subscription */}
        <Pressable onPress={() => { setSubVisible(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} style={styles.subCard}>
          <LinearGradient colors={[Colors.hero, Colors.heroDark]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          <View style={styles.subInner}>
            <View>
              <View style={styles.subBadgeRow}>
                <View style={styles.subActiveBadge}><Text style={styles.subActiveBadgeText}>ACTIVE</Text></View>
                <Text style={styles.subPlan}>{sub?.plan ?? "STANDARD"}</Text>
              </View>
              <Text style={styles.subTitle}>Subscription</Text>
              {sub?.expiresAt && <Text style={styles.subExpiry}>Expires {formatDate(sub.expiresAt)}</Text>}
            </View>
            <View style={styles.subCountWrap}>
              <Text style={styles.subCount}>{sub?.remainingListings ?? 0}</Text>
              <Text style={styles.subCountLabel}>listings{"\n"}left</Text>
            </View>
          </View>
        </Pressable>

        {/* Sell CTA */}
        <Pressable onPress={() => { setSellVisible(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }} style={styles.sellCta}>
          <View style={styles.sellCtaIcon}><Ionicons name="car-sport" size={20} color={Colors.primary} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sellCtaTitle}>Sell Your Vehicle</Text>
            <Text style={styles.sellCtaSub}>Submit for admin review</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </Pressable>

        {/* Menu */}
        <View style={styles.menuSection}>
          {menu.map((item, idx) => (
            <Pressable key={item.label} onPress={() => Haptics.selectionAsync()} style={[styles.menuItem, idx === 0 && { borderTopWidth: 0 }]}>
              <View style={styles.menuIconWrap}><Ionicons name={item.icon as any} size={20} color={Colors.primary} /></View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </Pressable>
          ))}
        </View>

        <Pressable onPress={() => logout()} style={styles.logoutRow}>
          <Ionicons name="log-out-outline" size={18} color={Colors.danger} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </Pressable>
      </ScrollView>
      <SellSheet visible={sellVisible} onClose={() => setSellVisible(false)} />
      <SubscriptionModal visible={subVisible} onClose={() => setSubVisible(false)} onSuccess={() => setSubVisible(false)} mode="renew" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 16 },
  pageTitle: { fontSize: 24, fontFamily: "Urbanist_700Bold", color: Colors.text },
  logoutIcon: { padding: 8 },
  profileCard: { alignItems: "center", paddingVertical: 24, gap: 6, marginHorizontal: 16, backgroundColor: Colors.card, borderRadius: 20, borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  avatar: { width: 72, height: 72, borderRadius: 22, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  avatarText: { fontSize: 26, fontFamily: "Urbanist_700Bold", color: "#fff" },
  profileName: { fontSize: 22, fontFamily: "Urbanist_700Bold", color: Colors.text },
  profileEmail: { fontSize: 14, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary },
  profilePhone: { fontSize: 14, fontFamily: "Urbanist_400Regular", color: Colors.textMuted },
  subCard: { marginHorizontal: 16, borderRadius: 18, overflow: "hidden", marginBottom: 16, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6 },
  subInner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20 },
  subBadgeRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 },
  subActiveBadge: { backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  subActiveBadgeText: { fontSize: 10, fontFamily: "Urbanist_700Bold", color: "#fff", letterSpacing: 0.5 },
  subPlan: { fontSize: 11, fontFamily: "Urbanist_600SemiBold", color: "rgba(255,255,255,0.7)" },
  subTitle: { fontSize: 18, fontFamily: "Urbanist_700Bold", color: "#fff" },
  subExpiry: { fontSize: 13, fontFamily: "Urbanist_400Regular", color: "rgba(255,255,255,0.7)", marginTop: 2 },
  subCountWrap: { alignItems: "center" },
  subCount: { fontSize: 40, fontFamily: "Urbanist_700Bold", color: "#fff" },
  subCountLabel: { fontSize: 11, fontFamily: "Urbanist_400Regular", color: "rgba(255,255,255,0.7)", textAlign: "center" },
  sellCta: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: Colors.card, borderRadius: 16, padding: 16, marginHorizontal: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.cardBorder, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  sellCtaIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primaryLight, alignItems: "center", justifyContent: "center" },
  sellCtaTitle: { fontSize: 16, fontFamily: "Urbanist_700Bold", color: Colors.text },
  sellCtaSub: { fontSize: 13, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary },
  menuSection: { marginHorizontal: 16, backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.cardBorder, overflow: "hidden", marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  menuItem: { flexDirection: "row", alignItems: "center", padding: 16, borderTopWidth: 1, borderTopColor: Colors.cardBorder, gap: 14 },
  menuIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.primaryLight, alignItems: "center", justifyContent: "center" },
  menuLabel: { flex: 1, fontSize: 15, fontFamily: "Urbanist_500Medium", color: Colors.text },
  logoutRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 16, marginHorizontal: 16 },
  logoutText: { fontSize: 15, fontFamily: "Urbanist_600SemiBold", color: Colors.danger },
});

const sellS = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { backgroundColor: Colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "95%", borderWidth: 1, borderColor: Colors.cardBorder },
  grabber: { width: 36, height: 4, backgroundColor: Colors.cardBorder, borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 4 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingVertical: 16 },
  title: { fontSize: 20, fontFamily: "Urbanist_700Bold", color: Colors.text },
  closeBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center", backgroundColor: Colors.surface, borderRadius: 10 },
  form: { paddingHorizontal: 24, paddingBottom: 40, gap: 20 },
  group: { gap: 8 },
  label: { fontSize: 13, fontFamily: "Urbanist_600SemiBold", color: Colors.textSecondary },
  input: { backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: Colors.inputBorder, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: "Urbanist_400Regular", color: Colors.text },
  chipsRow: { gap: 8, paddingVertical: 2 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.cardBorder },
  chipActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  chipText: { fontSize: 13, fontFamily: "Urbanist_600SemiBold", color: Colors.textSecondary },
  chipActiveText: { color: Colors.primary },
  typeRow: { flexDirection: "row", gap: 12 },
  typeBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1, borderColor: Colors.cardBorder, paddingVertical: 12 },
  typeBtnActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  typeBtnText: { fontSize: 14, fontFamily: "Urbanist_600SemiBold", color: Colors.textMuted },
  priceWrap: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: Colors.inputBorder, borderRadius: 12, paddingHorizontal: 14, height: 52 },
  rupee: { fontSize: 18, fontFamily: "Urbanist_700Bold", color: Colors.textSecondary, marginRight: 6 },
  priceInput: { flex: 1, fontSize: 18, fontFamily: "Urbanist_700Bold", color: Colors.text },
  notice: { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: "#FFFBEB", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#FDE68A" },
  noticeText: { flex: 1, fontSize: 13, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary, lineHeight: 20 },
  submitBtn: { borderRadius: 14, overflow: "hidden" },
  submitGrad: { height: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  submitText: { fontSize: 16, fontFamily: "Urbanist_700Bold", color: "#fff" },
});
