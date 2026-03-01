import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
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

interface SellVehicleSheetProps {
  visible: boolean;
  onClose: () => void;
}

const CATEGORIES = ["Sedan", "SUV", "Hatchback", "Luxury", "Sports", "Electric", "Pickup"];

function SellVehicleSheet({ visible, onClose }: SellVehicleSheetProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("SUV");
  const [listingType, setListingType] = useState<"AUCTION" | "BUY_NOW">("AUCTION");
  const [basePrice, setBasePrice] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !basePrice.trim()) {
      Alert.alert("Missing Info", "Please fill in vehicle title and price.");
      return;
    }
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/user/sell-request", {
        title: title.trim(),
        description: description.trim(),
        category,
        listingType,
        basePrice: parseInt(basePrice, 10),
      });
      const data = await res.json();
      if (data.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Submitted!", data.data.message);
        setTitle(""); setDescription(""); setBasePrice("");
        setCategory("SUV"); setListingType("AUCTION");
        onClose();
      }
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={sellStyles.overlay}>
          <View style={sellStyles.sheet}>
            <View style={sellStyles.grabber} />
            <View style={sellStyles.header}>
              <Text style={sellStyles.sheetTitle}>Sell Your Vehicle</Text>
              <Pressable onPress={onClose} style={sellStyles.closeBtn}>
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={sellStyles.form}>
              <View style={sellStyles.inputGroup}>
                <Text style={sellStyles.label}>Vehicle Title</Text>
                <TextInput
                  style={sellStyles.input}
                  placeholder="e.g., Honda City ZX 2022"
                  placeholderTextColor={Colors.textMuted}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              <View style={sellStyles.inputGroup}>
                <Text style={sellStyles.label}>Description</Text>
                <TextInput
                  style={[sellStyles.input, { height: 80, textAlignVertical: "top" }]}
                  placeholder="Condition, features, history..."
                  placeholderTextColor={Colors.textMuted}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                />
              </View>

              <View style={sellStyles.inputGroup}>
                <Text style={sellStyles.label}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={sellStyles.chipsRow}>
                  {CATEGORIES.map((cat) => (
                    <Pressable
                      key={cat}
                      onPress={() => { setCategory(cat); Haptics.selectionAsync(); }}
                      style={[sellStyles.chip, category === cat && sellStyles.chipActive]}
                    >
                      <Text style={[sellStyles.chipText, category === cat && sellStyles.chipTextActive]}>{cat}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              <View style={sellStyles.inputGroup}>
                <Text style={sellStyles.label}>Listing Type</Text>
                <View style={sellStyles.typeRow}>
                  {(["AUCTION", "BUY_NOW"] as const).map((type) => (
                    <Pressable
                      key={type}
                      onPress={() => { setListingType(type); Haptics.selectionAsync(); }}
                      style={[sellStyles.typeBtn, listingType === type && sellStyles.typeBtnActive]}
                    >
                      <Ionicons
                        name={type === "AUCTION" ? "flash" : "pricetag"}
                        size={16}
                        color={listingType === type ? Colors.primary : Colors.textMuted}
                      />
                      <Text style={[sellStyles.typeBtnText, listingType === type && { color: Colors.primary }]}>
                        {type === "AUCTION" ? "Live Auction" : "Buy Now"}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={sellStyles.inputGroup}>
                <Text style={sellStyles.label}>Base Price (₹)</Text>
                <View style={sellStyles.priceInputWrap}>
                  <Text style={sellStyles.priceSymbol}>₹</Text>
                  <TextInput
                    style={sellStyles.priceInput}
                    placeholder="e.g., 1500000"
                    placeholderTextColor={Colors.textMuted}
                    value={basePrice}
                    onChangeText={setBasePrice}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={sellStyles.reviewNotice}>
                <Ionicons name="time-outline" size={16} color={Colors.warning} />
                <Text style={sellStyles.reviewNoticeText}>
                  Your listing will be reviewed by admin and listed within 24 hours.
                </Text>
              </View>

              <Pressable
                style={({ pressed }) => [sellStyles.submitBtn, { opacity: pressed ? 0.85 : 1 }]}
                onPress={handleSubmit}
                disabled={loading}
              >
                <LinearGradient
                  colors={["#FF8C4C", Colors.primary, "#E05020"]}
                  style={sellStyles.submitBtnGrad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {loading ? <ActivityIndicator color="#fff" /> : (
                    <>
                      <Ionicons name="send" size={16} color="#fff" />
                      <Text style={sellStyles.submitBtnText}>Submit for Review</Text>
                    </>
                  )}
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

  const { data, isLoading } = useQuery<{ success: boolean; data: any }>({
    queryKey: ["/api/user/profile"],
  });

  const { data: subData } = useQuery<{ success: boolean; data: any }>({
    queryKey: ["/api/subscriptions/me"],
  });

  const profile = data?.data;
  const sub = subData?.data;

  const topPadding = insets.top + (insets.top < 20 ? 67 : 0);

  const menuItems = [
    { icon: "car-sport-outline", label: "My Vehicles", onPress: () => {} },
    { icon: "heart-outline", label: "Saved Auctions", onPress: () => {} },
    { icon: "notifications-outline", label: "Notifications", onPress: () => {} },
    { icon: "help-circle-outline", label: "Help & Support", onPress: () => {} },
    { icon: "shield-outline", label: "Privacy Policy", onPress: () => {} },
  ];

  const initials = (user?.fullName ?? profile?.fullName ?? "U")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Profile</Text>
        <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); logout(); }} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color={Colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Avatar + Info */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <LinearGradient colors={["#FF8C4C", Colors.primary]} style={styles.avatar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={styles.avatarText}>{initials}</Text>
            </LinearGradient>
          </View>
          <Text style={styles.profileName}>{user?.fullName ?? profile?.fullName ?? "User"}</Text>
          <Text style={styles.profileEmail}>{user?.email ?? profile?.email}</Text>
          <Text style={styles.profilePhone}>{user?.phone ?? profile?.phone}</Text>
        </View>

        {/* Subscription Card */}
        <Pressable
          onPress={() => { setSubVisible(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          style={styles.subCard}
        >
          <LinearGradient
            colors={sub?.status === "ACTIVE" ? ["#FF8C4C22", "#FF6B2C11"] : [Colors.surface, Colors.card]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.subCardContent}>
            <View>
              <View style={styles.subBadgeRow}>
                <View style={[styles.subBadge, { backgroundColor: sub?.status === "ACTIVE" ? "#22C55E22" : "#EF444422" }]}>
                  <Ionicons name={sub?.status === "ACTIVE" ? "checkmark-circle" : "close-circle"} size={12} color={sub?.status === "ACTIVE" ? Colors.success : Colors.danger} />
                  <Text style={[styles.subBadgeText, { color: sub?.status === "ACTIVE" ? Colors.success : Colors.danger }]}>
                    {sub?.status === "ACTIVE" ? "Active" : "Inactive"}
                  </Text>
                </View>
                <Text style={styles.subPlan}>{sub?.plan ?? "STANDARD"}</Text>
              </View>
              <Text style={styles.subTitle}>Subscription</Text>
              {sub?.expiresAt && (
                <Text style={styles.subExpiry}>Expires {formatDate(sub.expiresAt)}</Text>
              )}
            </View>
            <View style={styles.subRemainingWrap}>
              <Text style={styles.subRemainingNum}>{sub?.remainingListings ?? 0}</Text>
              <Text style={styles.subRemainingLabel}>listings{"\n"}left</Text>
            </View>
          </View>
        </Pressable>

        {/* Sell Vehicle CTA */}
        <Pressable
          style={({ pressed }) => [styles.sellBtn, { opacity: pressed ? 0.85 : 1 }]}
          onPress={() => { setSellVisible(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
        >
          <LinearGradient
            colors={["#FF8C4C", Colors.primary, "#E05020"]}
            style={styles.sellBtnGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="car-sport" size={20} color="#fff" />
            <View>
              <Text style={styles.sellBtnTitle}>Sell Your Vehicle</Text>
              <Text style={styles.sellBtnSubtitle}>Submit for admin review</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </LinearGradient>
        </Pressable>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, idx) => (
            <Pressable
              key={item.label}
              onPress={() => { item.onPress(); Haptics.selectionAsync(); }}
              style={({ pressed }) => [
                styles.menuItem,
                idx === 0 && styles.menuItemFirst,
                idx === menuItems.length - 1 && styles.menuItemLast,
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <View style={styles.menuIconWrap}>
                <Ionicons name={item.icon as any} size={20} color={Colors.primary} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </Pressable>
          ))}
        </View>

        <Pressable
          style={styles.logoutRow}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); logout(); }}
        >
          <Ionicons name="log-out-outline" size={18} color={Colors.danger} />
          <Text style={styles.logoutRowText}>Sign Out</Text>
        </Pressable>
      </ScrollView>

      <SellVehicleSheet visible={sellVisible} onClose={() => setSellVisible(false)} />
      <SubscriptionModal
        visible={subVisible}
        onClose={() => setSubVisible(false)}
        onSuccess={() => setSubVisible(false)}
        mode="renew"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 24, paddingBottom: 16,
  },
  pageTitle: { fontSize: 24, fontFamily: "Urbanist_700Bold", color: Colors.text },
  logoutBtn: { padding: 8 },
  profileCard: { alignItems: "center", paddingVertical: 24, gap: 6, marginHorizontal: 24, backgroundColor: Colors.card, borderRadius: 20, borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: 16 },
  avatarWrap: { marginBottom: 4 },
  avatar: { width: 72, height: 72, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 26, fontFamily: "Urbanist_700Bold", color: "#fff" },
  profileName: { fontSize: 22, fontFamily: "Urbanist_700Bold", color: Colors.text },
  profileEmail: { fontSize: 14, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary },
  profilePhone: { fontSize: 14, fontFamily: "Urbanist_400Regular", color: Colors.textMuted },
  subCard: {
    marginHorizontal: 24, borderRadius: 20, borderWidth: 1, borderColor: Colors.primary + "44",
    marginBottom: 16, overflow: "hidden",
  },
  subCardContent: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20 },
  subBadgeRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  subBadge: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  subBadgeText: { fontSize: 11, fontFamily: "Urbanist_700Bold" },
  subPlan: { fontSize: 11, fontFamily: "Urbanist_600SemiBold", color: Colors.textMuted },
  subTitle: { fontSize: 18, fontFamily: "Urbanist_700Bold", color: Colors.text },
  subExpiry: { fontSize: 13, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary, marginTop: 2 },
  subRemainingWrap: { alignItems: "center" },
  subRemainingNum: { fontSize: 36, fontFamily: "Urbanist_700Bold", color: Colors.primary },
  subRemainingLabel: { fontSize: 11, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary, textAlign: "center" },
  sellBtn: { marginHorizontal: 24, borderRadius: 16, overflow: "hidden", marginBottom: 24 },
  sellBtnGrad: { flexDirection: "row", alignItems: "center", gap: 14, padding: 18 },
  sellBtnTitle: { fontSize: 16, fontFamily: "Urbanist_700Bold", color: "#fff" },
  sellBtnSubtitle: { fontSize: 12, fontFamily: "Urbanist_400Regular", color: "rgba(255,255,255,0.8)" },
  menuSection: { marginHorizontal: 24, backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.cardBorder, overflow: "hidden", marginBottom: 16 },
  menuItem: { flexDirection: "row", alignItems: "center", padding: 16, borderTopWidth: 1, borderTopColor: Colors.cardBorder, gap: 14 },
  menuItemFirst: { borderTopWidth: 0 },
  menuItemLast: {},
  menuIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#FF6B2C1A", alignItems: "center", justifyContent: "center" },
  menuLabel: { flex: 1, fontSize: 15, fontFamily: "Urbanist_500Medium", color: Colors.text },
  logoutRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 16, marginHorizontal: 24, marginBottom: 16 },
  logoutRowText: { fontSize: 15, fontFamily: "Urbanist_600SemiBold", color: Colors.danger },
});

const sellStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  sheet: { backgroundColor: Colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "95%", borderWidth: 1, borderColor: Colors.cardBorder },
  grabber: { width: 36, height: 4, backgroundColor: Colors.cardBorder, borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 4 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingVertical: 16 },
  sheetTitle: { fontSize: 20, fontFamily: "Urbanist_700Bold", color: Colors.text },
  closeBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center", backgroundColor: Colors.surface, borderRadius: 10 },
  form: { paddingHorizontal: 24, paddingBottom: 40, gap: 20 },
  inputGroup: { gap: 8 },
  label: { fontSize: 14, fontFamily: "Urbanist_600SemiBold", color: Colors.textSecondary },
  input: {
    backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: Colors.inputBorder,
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, fontFamily: "Urbanist_400Regular", color: Colors.text,
  },
  chipsRow: { gap: 8, paddingVertical: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.cardBorder },
  chipActive: { backgroundColor: "#FF6B2C22", borderColor: Colors.primary },
  chipText: { fontSize: 13, fontFamily: "Urbanist_600SemiBold", color: Colors.textSecondary },
  chipTextActive: { color: Colors.primary },
  typeRow: { flexDirection: "row", gap: 12 },
  typeBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1, borderColor: Colors.cardBorder, paddingVertical: 12,
  },
  typeBtnActive: { backgroundColor: "#FF6B2C11", borderColor: Colors.primary },
  typeBtnText: { fontSize: 14, fontFamily: "Urbanist_600SemiBold", color: Colors.textMuted },
  priceInputWrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: Colors.inputBorder, borderRadius: 14, paddingHorizontal: 16, height: 52,
  },
  priceSymbol: { fontSize: 18, fontFamily: "Urbanist_700Bold", color: Colors.textSecondary, marginRight: 6 },
  priceInput: { flex: 1, fontSize: 18, fontFamily: "Urbanist_700Bold", color: Colors.text },
  reviewNotice: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: "#F59E0B11", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#F59E0B33",
  },
  reviewNoticeText: { flex: 1, fontSize: 13, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary, lineHeight: 20 },
  submitBtn: { borderRadius: 14, overflow: "hidden" },
  submitBtnGrad: { height: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  submitBtnText: { fontSize: 16, fontFamily: "Urbanist_700Bold", color: "#fff" },
});
