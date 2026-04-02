import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  TextInput, Modal, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { SubscriptionModal } from "@/components/SubscriptionModal";
import { apiRequestDirect } from "@/lib/auth";
import { fetchMySubscription, ActiveSubscription } from "@/lib/subscription";

const CATEGORIES = ["Sedan", "SUV", "Hatchback", "Luxury", "Sports", "Electric"];

function SellSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("SUV");
  const [basePrice, setBasePrice] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !basePrice.trim()) { Alert.alert("Missing Info", "Please enter vehicle title and price."); return; }
    setLoading(true);
    try {
      // Call the vehicle-records API with the correct payload
      const res = await apiRequestDirect("POST", "http://13.127.188.130:3002/user/vehicle-records", {
        uvr_title: title.trim(),
        uvr_description: description.trim(),
        uvr_category: category,
        uvr_base_price: parseInt(basePrice, 10)
      }, true);
      const rawText = await res.text();
      let data: any = {};
      try { data = JSON.parse(rawText); } catch { data = { message: rawText }; }
      if (res.ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          "Vehicle Submitted! 🎉",
          "Your vehicle has been submitted successfully. Admin will review and contact you soon.",
          [{ text: "OK", style: "default" }]
        );
        setTitle("");
        setDescription("");
        setBasePrice("");
        setCategory("SUV");
        onClose();
      } else {
        Alert.alert("Error", data?.message || "Failed to submit vehicle.");
      }
    } catch (err) {
      console.error("[SELL] Submit error:", err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Network error. Please try again.");
    }
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
  const [sellSubVisible, setSellSubVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const topPad = insets.top + (insets.top < 20 ? 67 : 0);

  // Profile data from API
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");

  // Subscription data
  const [subscription, setSubscription] = useState<ActiveSubscription | null>(null);
  const [subLoading, setSubLoading] = useState(true);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editGender, setEditGender] = useState("");
  const [saving, setSaving] = useState(false);

  // Get user ID (could be stored as 'id', 'user_id', etc.)
  const userId = (user as any)?.id || (user as any)?.user_id || (user as any)?.uld_user_id || "";

  const fetchProfile = useCallback(async () => {
    try {
      setProfileError("");
      let res: Response;

      // Try user-specific endpoint if we have user ID
      if (userId) {
        res = await apiRequestDirect("GET", `http://13.127.188.130:3002/user/users/${userId}`, undefined, false);
      } else {
        // Fallback to authenticated profile endpoint
        res = await apiRequestDirect("GET", "http://13.127.188.130:3002/user/users-profile", undefined, true);
      }

      const rawText = await res.text();
      console.log("[PROFILE] Fetch response:", rawText.substring(0, 300));
      let data: any = {};
      try { data = JSON.parse(rawText); } catch { data = {}; }
      if (res.ok) {
        const profileData = data?.data || data?.user || data;
        setProfile(profileData);
      } else {
        console.log("[PROFILE] API error:", res.status, data?.message);
      }
    } catch (err: any) {
      setProfileError(`Error: ${err?.message || "Failed to fetch profile"}`);
    }
    finally { setProfileLoading(false); }
  }, [userId]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  // Fetch subscription
  const loadSubscription = useCallback(async () => {
    setSubLoading(true);
    try {
      const sub = await fetchMySubscription();
      setSubscription(sub);
    } catch (err) {
      console.error("[PROFILE] Subscription fetch error:", err);
    } finally {
      setSubLoading(false);
    }
  }, []);

  useEffect(() => { loadSubscription(); }, [loadSubscription]);

  const openEditProfile = () => {
    // Map API fields: user_full_name, user_email, user_primary_phone, user_gender
    setEditName(profile?.user_full_name || profile?.full_name || user?.fullName || "");
    setEditEmail(profile?.user_email || profile?.email || user?.email || "");
    setEditPhone(profile?.user_primary_phone || profile?.phone || user?.phone || "");
    setEditGender(profile?.user_gender || profile?.gender || "");
    setEditVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      const res = await apiRequestDirect("PUT", "http://13.127.188.130:3002/user/users-profile", {
        full_name: editName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim(),
        gender: editGender.toUpperCase(),
      }, true);
      const rawText = await res.text();
      let data: any = {};
      try { data = JSON.parse(rawText); } catch { data = {}; }
      if (res.ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setEditVisible(false);
        fetchProfile();
      } else {
        Alert.alert("Error", data?.message || "Failed to update profile.");
      }
    } catch { Alert.alert("Error", "Network error. Please try again."); }
    finally { setSaving(false); }
  };

  // Map API fields for display
  const displayName = profile?.user_full_name || profile?.full_name || user?.fullName || "User";
  const displayEmail = profile?.user_email || profile?.email || user?.email || "";
  const displayPhone = profile?.user_primary_phone || profile?.phone || user?.phone || "";

  const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2);

  const menu = [
    { icon: "help-circle-outline", label: "Help & Support", route: "/help" },
    { icon: "shield-checkmark-outline", label: "Privacy Policy", route: "/privacy" },
    { icon: "document-text-outline", label: "Terms & Conditions", route: "/terms" },
    { icon: "wallet-outline", label: "Refund Policy", route: "/refund" },
  ];

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Profile</Text>
        <Pressable onPress={() => logout()} style={styles.logoutIcon}><Ionicons name="log-out-outline" size={22} color={Colors.textSecondary} /></Pressable>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Profile Card — tap to edit */}
        <Pressable onPress={openEditProfile} style={styles.profileCard}>
          <LinearGradient colors={[Colors.hero, Colors.heroLight]} style={styles.avatar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={styles.avatarText}>{initials}</Text>
          </LinearGradient>
          {profileLoading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginTop: 8 }} />
          ) : (
            <>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={styles.profileName}>{displayName}</Text>
                <Ionicons name="pencil" size={14} color={Colors.textMuted} />
              </View>
              <Text style={styles.profileEmail}>{displayEmail}</Text>
              <Text style={styles.profilePhone}>{displayPhone}</Text>
            </>
          )}
        </Pressable>

        {/* Debug: show profile fetch errors */}
        {profileError ? (
          <View style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: "#FEF2F2", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#FECACA" }}>
            <Text style={{ fontSize: 12, fontFamily: "Urbanist_500Medium", color: Colors.danger }}>{profileError}</Text>
          </View>
        ) : null}

        {/* Subscription */}
        {subLoading ? (
          <View style={[styles.subCard, { backgroundColor: Colors.card }]}>
            <View style={styles.subInner}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          </View>
        ) : subscription ? (
          <Pressable onPress={() => { setSubVisible(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} style={styles.subCard}>
            <LinearGradient colors={[Colors.hero, Colors.heroDark]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            <View style={styles.subInner}>
              <View>
                <View style={styles.subBadgeRow}>
                  <View style={styles.subActiveBadge}><Text style={styles.subActiveBadgeText}>ACTIVE</Text></View>
                  <Text style={styles.subPlan}>{subscription.plan?.sp_name ?? "STANDARD"}</Text>
                </View>
                <Text style={styles.subTitle}>Subscription</Text>
                <Text style={styles.subExpiry}>3 active engagements at a time</Text>
              </View>
              <View style={styles.subCountWrap}>
                <Text style={styles.subCount}>{subscription.sub_remaining_uses ?? subscription.remaining_uses ?? 0}</Text>
                <Text style={styles.subCountLabel}>slots{"\n"}left</Text>
              </View>
            </View>
          </Pressable>
        ) : (
          <Pressable onPress={() => { setSubVisible(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} style={styles.subCardInactive}>
            <View style={styles.subInactiveInner}>
              <View style={styles.subInactiveIcon}>
                <Ionicons name="flash" size={24} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.subInactiveTitle}>No Active Subscription</Text>
                <Text style={styles.subInactiveSub}>Subscribe to bid or buy vehicles</Text>
              </View>
              <View style={styles.subInactiveBtn}>
                <Text style={styles.subInactiveBtnText}>Subscribe</Text>
              </View>
            </View>
          </Pressable>
        )}

        {/* Sell CTA */}
        <Pressable onPress={() => { setSellSubVisible(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }} style={styles.sellCta}>
          <View style={styles.sellCtaIcon}><Ionicons name="car-sport" size={20} color={Colors.primary} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sellCtaTitle}>Sell Your Vehicle</Text>
            <Text style={styles.sellCtaSub}>₹800 listing fee • 365 days visibility</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </Pressable>

        {/* Menu */}
        <View style={styles.menuSection}>
          {menu.map((item, idx) => (
            <Pressable key={item.label} onPress={() => { Haptics.selectionAsync(); router.push(item.route as any); }} style={[styles.menuItem, idx === 0 && { borderTopWidth: 0 }]}>
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
      <SubscriptionModal visible={subVisible} onClose={() => setSubVisible(false)} onSuccess={() => { setSubVisible(false); loadSubscription(); }} mode="renew" />
      <SubscriptionModal
        visible={sellSubVisible}
        onClose={() => setSellSubVisible(false)}
        onSuccess={() => {
          setSellSubVisible(false);
          setSellVisible(true);
        }}
        planType="sell"
      />

      {/* Edit Profile Modal */}
      <Modal visible={editVisible} animationType="slide" transparent onRequestClose={() => setEditVisible(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={editS.overlay}>
            <View style={editS.sheet}>
              <View style={editS.grabber} />
              <View style={editS.header}>
                <Text style={editS.title}>Edit Profile</Text>
                <Pressable onPress={() => setEditVisible(false)} style={editS.closeBtn}><Ionicons name="close" size={20} color={Colors.textSecondary} /></Pressable>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={editS.form}>
                {/* Full Name — editable */}
                <View style={editS.group}>
                  <Text style={editS.label}>FULL NAME</Text>
                  <TextInput
                    style={editS.input}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Enter your full name"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>

                {/* Email — editable */}
                <View style={editS.group}>
                  <Text style={editS.label}>EMAIL ADDRESS</Text>
                  <TextInput
                    style={editS.input}
                    value={editEmail}
                    onChangeText={setEditEmail}
                    placeholder="Enter your email"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                {/* Phone — editable */}
                <View style={editS.group}>
                  <Text style={editS.label}>PHONE NUMBER</Text>
                  <TextInput
                    style={editS.input}
                    value={editPhone}
                    onChangeText={setEditPhone}
                    placeholder="Enter your phone number"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="phone-pad"
                  />
                </View>

                {/* Gender — radio buttons */}
                <View style={editS.group}>
                  <Text style={editS.label}>GENDER</Text>
                  <View style={editS.radioRow}>
                    {["MALE", "FEMALE", "OTHER"].map((g) => (
                      <Pressable
                        key={g}
                        onPress={() => { setEditGender(g); Haptics.selectionAsync(); }}
                        style={[editS.radioBtn, editGender.toUpperCase() === g && editS.radioBtnActive]}
                      >
                        <View style={[editS.radioCircle, editGender.toUpperCase() === g && editS.radioCircleActive]}>
                          {editGender.toUpperCase() === g && <View style={editS.radioDot} />}
                        </View>
                        <Text style={[editS.radioText, editGender.toUpperCase() === g && editS.radioTextActive]}>
                          {g.charAt(0) + g.slice(1).toLowerCase()}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Save Button */}
                <Pressable
                  style={({ pressed }) => [editS.saveBtn, { opacity: pressed ? 0.85 : 1 }]}
                  onPress={handleSaveProfile}
                  disabled={saving}
                >
                  <LinearGradient colors={[Colors.heroLight, Colors.hero]} style={editS.saveGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    {saving ? <ActivityIndicator color="#fff" /> : (
                      <><Ionicons name="checkmark-circle" size={18} color="#fff" /><Text style={editS.saveText}>Save Changes</Text></>
                    )}
                  </LinearGradient>
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  subCardInactive: { marginHorizontal: 16, borderRadius: 18, overflow: "hidden", marginBottom: 16, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.cardBorder, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  subInactiveInner: { flexDirection: "row", alignItems: "center", padding: 16, gap: 14 },
  subInactiveIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: Colors.primaryLight, alignItems: "center", justifyContent: "center" },
  subInactiveTitle: { fontSize: 16, fontFamily: "Urbanist_700Bold", color: Colors.text },
  subInactiveSub: { fontSize: 13, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary, marginTop: 2 },
  subInactiveBtn: { backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  subInactiveBtnText: { fontSize: 13, fontFamily: "Urbanist_700Bold", color: "#fff" },
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
  priceWrap: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: Colors.inputBorder, borderRadius: 12, paddingHorizontal: 14, height: 52 },
  rupee: { fontSize: 18, fontFamily: "Urbanist_700Bold", color: Colors.textSecondary, marginRight: 6 },
  priceInput: { flex: 1, fontSize: 18, fontFamily: "Urbanist_700Bold", color: Colors.text },
  notice: { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: "#FFFBEB", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#FDE68A" },
  noticeText: { flex: 1, fontSize: 13, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary, lineHeight: 20 },
  submitBtn: { borderRadius: 14, overflow: "hidden" },
  submitGrad: { height: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  submitText: { fontSize: 16, fontFamily: "Urbanist_700Bold", color: "#fff" },
});

const editS = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { backgroundColor: Colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "90%", borderWidth: 1, borderColor: Colors.cardBorder },
  grabber: { width: 36, height: 4, backgroundColor: Colors.cardBorder, borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 4 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingVertical: 16 },
  title: { fontSize: 20, fontFamily: "Urbanist_700Bold", color: Colors.text },
  closeBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center", backgroundColor: Colors.surface, borderRadius: 10 },
  form: { paddingHorizontal: 24, paddingBottom: 40, gap: 20 },
  group: { gap: 8 },
  label: { fontSize: 11, fontFamily: "Urbanist_700Bold", color: Colors.textSecondary, letterSpacing: 1 },
  input: { backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: Colors.inputBorder, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, fontFamily: "Urbanist_500Medium", color: Colors.text },
  disabledInput: { backgroundColor: "#F0F0F0", color: Colors.textMuted, opacity: 0.7 },
  radioRow: { flexDirection: "row", gap: 12 },
  radioBtn: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1, borderColor: Colors.cardBorder, paddingVertical: 14, paddingHorizontal: 14 },
  radioBtnActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  radioCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.textMuted, alignItems: "center", justifyContent: "center" },
  radioCircleActive: { borderColor: Colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  radioText: { fontSize: 14, fontFamily: "Urbanist_500Medium", color: Colors.textSecondary },
  radioTextActive: { color: Colors.primary, fontFamily: "Urbanist_600SemiBold" },
  saveBtn: { borderRadius: 14, overflow: "hidden", marginTop: 4 },
  saveGrad: { height: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  saveText: { fontSize: 16, fontFamily: "Urbanist_700Bold", color: "#fff" },
});
