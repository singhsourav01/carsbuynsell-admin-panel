import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  TextInput, Modal, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { SubscriptionModal } from "@/components/SubscriptionModal";
import { apiRequestDirect, getToken } from "@/lib/auth";
import { fetchMySubscription, ActiveSubscription, CreateOrderResult, RazorpayPaymentResult, openNativeRazorpayCheckout } from "@/lib/subscription";

const CATEGORIES = ["Sedan", "SUV", "Hatchback", "Luxury", "Sports", "Electric"];
const SELL_VEHICLE_FEE = 800; // ₹800 listing fee

function SellSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("SUV");
  const [basePrice, setBasePrice] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !basePrice.trim()) {
      Alert.alert("Missing Info", "Please enter vehicle title and price.");
      return;
    }

    setLoading(true);
    try {
      // Step 1: Create Razorpay order for ₹800 listing fee
      const res = await apiRequestDirect("POST", "http://65.2.10.30:3002/user/subscriptions/create-order", {
        plan_id: "sub_002", // Sell vehicle plan ID
        amount: SELL_VEHICLE_FEE * 100, // Amount in paise
      }, true);

      const rawText = await res.text();
      let data: any = {};
      try { data = JSON.parse(rawText); } catch { data = { message: rawText }; }

      if (!res.ok || !data?.data) {
        Alert.alert("Error", data?.message || "Failed to create payment order.");
        setLoading(false);
        return;
      }

      console.log("[SELL] Order created:", data.data);
      const order = data.data as CreateOrderResult;

      // Step 2: Open native Razorpay checkout (supports UPI, GPay, PhonePe, etc.)
      const paymentResult = await openNativeRazorpayCheckout(
        order,
        "CarsbuyNsell User",
        "",
        "",
        "Vehicle Listing Fee - ₹800",
      );

      // Step 3: Verify the payment on backend
      const verifyRes = await apiRequestDirect("POST", "http://65.2.10.30:3002/user/subscriptions/verify-payment", {
        razorpay_order_id: paymentResult.razorpay_order_id,
        razorpay_payment_id: paymentResult.razorpay_payment_id,
        razorpay_signature: paymentResult.razorpay_signature,
      }, true);

      const verifyRaw = await verifyRes.text();
      let verifyData: any = {};
      try { verifyData = JSON.parse(verifyRaw); } catch { verifyData = {}; }

      if (!verifyRes.ok) {
        Alert.alert("Payment Error", verifyData?.message || "Payment verification failed.");
        setLoading(false);
        return;
      }

      console.log("[SELL] Payment verified, submitting vehicle data...");

      // Step 4: Submit the vehicle record
      const submitRes = await apiRequestDirect("POST", "http://65.2.10.30:3002/user/vehicle-records", {
        uvr_title: title.trim(),
        uvr_description: description.trim(),
        uvr_category: category,
        uvr_base_price: parseInt(basePrice.trim(), 10),
        uvr_razorpay_payment_id: paymentResult.razorpay_payment_id,
      }, true);

      const submitRaw = await submitRes.text();
      let submitData: any = {};
      try { submitData = JSON.parse(submitRaw); } catch { submitData = { message: submitRaw }; }

      if (submitRes.ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          "Vehicle Submitted! 🎉",
          "Payment successful! Your vehicle has been submitted for review. Admin will contact you soon.",
          [{ text: "OK", style: "default" }]
        );
        setTitle("");
        setDescription("");
        setBasePrice("");
        setCategory("SUV");
        onClose();
      } else {
        Alert.alert(
          "Submission Error",
          submitData?.message || "Payment was successful but vehicle submission failed. Please contact support with your payment ID: " + paymentResult.razorpay_payment_id
        );
      }
    } catch (err: any) {
      console.error("[SELL] Error:", err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const message = err?.message || "Could not complete payment. Please try again.";
      if (!message.toLowerCase().includes("cancel")) {
        Alert.alert("Error", message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={sellS.overlay}>
          <View style={sellS.sheet}>
            <View style={sellS.grabber} />
            <View style={sellS.header}>
              <Text style={sellS.title}>Sell Your Vehicle</Text>
              <Pressable onPress={onClose} style={sellS.closeBtn}>
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={sellS.form}>
              <View style={sellS.group}>
                <Text style={sellS.label}>Vehicle Title</Text>
                <TextInput style={sellS.input} placeholder="e.g., Honda City ZX 2022" placeholderTextColor={Colors.textMuted} value={title} onChangeText={setTitle} />
              </View>
              <View style={sellS.group}>
                <Text style={sellS.label}>Description</Text>
                <TextInput style={[sellS.input, { height: 80, textAlignVertical: "top" }]} placeholder="Condition, features, history..." placeholderTextColor={Colors.textMuted} value={description} onChangeText={setDescription} multiline />
              </View>
              <View style={sellS.group}>
                <Text style={sellS.label}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={sellS.chipsRow}>
                  {CATEGORIES.map(c => (
                    <Pressable key={c} onPress={() => { setCategory(c); Haptics.selectionAsync(); }} style={[sellS.chip, category === c && sellS.chipActive]}>
                      <Text style={[sellS.chipText, category === c && sellS.chipActiveText]}>{c}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
              <View style={sellS.group}>
                <Text style={sellS.label}>Base Price (₹)</Text>
                <View style={sellS.priceWrap}>
                  <Text style={sellS.rupee}>₹</Text>
                  <TextInput style={sellS.priceInput} placeholder="e.g., 1500000" placeholderTextColor={Colors.textMuted} value={basePrice} onChangeText={setBasePrice} keyboardType="numeric" />
                </View>
              </View>
              <View style={sellS.feeNotice}>
                <Ionicons name="card-outline" size={16} color={Colors.primary} />
                <Text style={sellS.feeNoticeText}>₹{SELL_VEHICLE_FEE} listing fee</Text>
              </View>
              <View style={sellS.notice}>
                <Ionicons name="time-outline" size={15} color={Colors.warning} />
                <Text style={sellS.noticeText}>Admin will review and list your vehicle within 24 hours.</Text>
              </View>
              <Pressable style={({ pressed }) => [sellS.submitBtn, { opacity: pressed ? 0.85 : 1 }]} onPress={handleSubmit} disabled={loading}>
                <LinearGradient colors={[Colors.heroLight, Colors.hero]} style={sellS.submitGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {loading ? <ActivityIndicator color="#fff" /> : (
                    <>
                      <Ionicons name="card" size={15} color="#fff" />
                      <Text style={sellS.submitText}>Pay ₹{SELL_VEHICLE_FEE} & Submit</Text>
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

  // Profile photo state
  const [editPhotoUri, setEditPhotoUri] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [pendingFileId, setPendingFileId] = useState<string | null>(null); // file_id from upload service, sent on Save

  // Get user ID (could be stored as 'id', 'user_id', etc.)
  const userId = (user as any)?.id || (user as any)?.user_id || (user as any)?.uld_user_id || "";

  const fetchProfile = useCallback(async () => {
    try {
      setProfileError("");
      let res: Response;

      // Try user-specific endpoint if we have user ID
      if (userId) {
        res = await apiRequestDirect("GET", `http://65.2.10.30:3002/user/users/${userId}`, undefined, false);
      } else {
        // Fallback to authenticated profile endpoint
        res = await apiRequestDirect("GET", "http://65.2.10.30:3002/user/users-profile", undefined, true);
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
  console.log(profile, " here is prfoile")
  const openEditProfile = () => {
    // Map API fields: user_full_name, user_email, user_primary_phone, user_gender
    setEditName(profile?.user_full_name || profile?.full_name || user?.fullName || "");
    setEditEmail(profile?.user_email || profile?.email || user?.email || "");
    setEditPhone(profile?.user_primary_phone || profile?.phone || user?.phone || "");
    setEditGender(profile?.user_gender || profile?.gender || "");
    setEditPhotoUri(profile?.user_profile_image_file_id || null);   // reset local preview
    setPendingFileId(profile?.user_profile_image_file_id || null);  // reset any pending file upload
    setEditVisible(true);
  };

  const pickAndUploadPhoto = async () => {
    try {
      // Request media library permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please allow access to your photo library to update your profile picture.");
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      // Show preview immediately — never clear this after picking
      setEditPhotoUri(asset.uri);
      setPendingFileId(null); // reset any old file id
      setUploadingPhoto(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Guard: user must be logged in with a resolvable ID
      if (!userId) {
        Alert.alert("Error", "Could not determine your user ID. Please log out and log back in.");
        return;
      }

      const filename = asset.uri.split("/").pop() || "profile.jpg";
      const mimeType = asset.mimeType || "image/jpeg";

      // Step 1: Read the image file into a real Blob via XHR
      // (The { uri, name, type } RN shorthand can silently fail in some Expo environments)
      console.log("[PHOTO] Reading image as blob from URI:", asset.uri);
      const imageBlob: Blob = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = () => resolve(xhr.response);
        xhr.onerror = () => reject(new Error("Failed to read image file from URI"));
        xhr.responseType = "blob";
        xhr.open("GET", asset.uri, true);
        xhr.send(null);
      });
      console.log("[PHOTO] Blob size:", imageBlob.size, "type:", imageBlob.type);

      // Step 2: Build multipart FormData with the real Blob
      // Middleware checks: files?.files (field "files") and fields?.type (field "type")
      const formData = new FormData();
      formData.append("files", imageBlob, filename);
      formData.append("type", "portfolio");

      // Step 3: POST to file service
      const token = await getToken();
      console.log("[PHOTO] Uploading → userId:", userId, "token:", token ? "present" : "missing");

      const uploadData: any = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `http://65.2.10.30:3003/file/upload?id=${userId}`);
        if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        // Do NOT set Content-Type — XHR sets multipart boundary automatically
        xhr.onload = () => {
          console.log("[PHOTO] Upload status:", xhr.status, "response:", xhr.responseText.substring(0, 300));
          try { resolve(JSON.parse(xhr.responseText)); }
          catch { resolve({ message: xhr.responseText, statusCode: xhr.status }); }
        };
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(formData);
      });

      if (uploadData?.statusCode && uploadData.statusCode !== 200) {
        Alert.alert("Upload Failed", uploadData?.message || "Failed to upload photo. Please try again.");
        return;
      }

      const fileId = uploadData?.data?.[0]?.file_id
        || uploadData?.data?.file_id
        || uploadData?.file_id
        || uploadData?.id;

      if (!fileId) {
        console.log("[PHOTO] Unexpected upload response:", JSON.stringify(uploadData));
        Alert.alert("Upload Error", "Could not get file ID. Please try again.");
        return;
      }

      console.log("[PHOTO] File uploaded successfully, file_id:", fileId);
      setPendingFileId(fileId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      console.error("[PHOTO] Upload error:", err);
      Alert.alert("Error", "Something went wrong uploading your photo. Please try again.");
      // Photo preview stays so user can retry — do NOT clear editPhotoUri
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!pendingFileId) {
      // Nothing new to save
      setEditVisible(false);
      return;
    }
    setSaving(true);
    try {
      const res = await apiRequestDirect(
        "PUT",
        "http://65.2.10.30:3002/user/users-profile",
        { profile_image_file_id: pendingFileId },
        true
      );
      const rawText = await res.text();
      let data: any = {};
      try { data = JSON.parse(rawText); } catch { data = {}; }
      if (res.ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setPendingFileId(null);
        setEditVisible(false);
        fetchProfile();
      } else {
        Alert.alert("Error", data?.message || "Failed to update profile photo.");
      }
    } catch { Alert.alert("Error", "Network error. Please try again."); }
    finally { setSaving(false); }
  };

  // Map API fields for display
  const displayName = profile?.user_full_name || profile?.full_name || user?.fullName || "User";
  const displayEmail = profile?.user_email || profile?.email || user?.email || "";
  const displayPhone = profile?.user_primary_phone || profile?.phone || user?.phone || "";
  const displayImage = profile?.user_profile_image_file_id || "";

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
            <Image source={{ uri: displayImage }} style={styles.avatar} />
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

        {/* Sell CTA - Opens form directly, payment happens on submit */}
        <Pressable onPress={() => { setSellVisible(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }} style={styles.sellCta}>
          <View style={styles.sellCtaIcon}><Ionicons name="car-sport" size={20} color={Colors.primary} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sellCtaTitle}>Sell Your Vehicle</Text>
            <Text style={styles.sellCtaSub}>₹800 listing fee</Text>
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

                {/* Profile Photo */}
                <View style={editS.photoSection}>
                  <Pressable onPress={pickAndUploadPhoto} disabled={uploadingPhoto} style={editS.photoWrap}>
                    {(() => {
                      const photoUrl = editPhotoUri ||
                        profile?.user_profile_image_url ||
                        profile?.profile_image_url ||
                        profile?.profile_image ||
                        null;
                      return photoUrl ? (
                        <Image source={{ uri: photoUrl }} style={editS.photoImg} />
                      ) : (
                        <LinearGradient colors={[Colors.hero, Colors.heroLight]} style={editS.photoPlaceholder} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                          <Text style={editS.photoInitials}>{initials}</Text>
                        </LinearGradient>
                      );
                    })()}
                    {/* Overlay badge */}
                    <View style={editS.photoBadge}>
                      {uploadingPhoto
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <Ionicons name="camera" size={14} color="#fff" />}
                    </View>
                  </Pressable>
                  <Text style={editS.photoHint}>
                    {uploadingPhoto ? "Uploading photo…" : "Tap to change profile photo"}
                  </Text>
                </View>

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
                  disabled={saving || uploadingPhoto}
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
  feeNotice: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.primaryLight, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.primary },
  feeNoticeText: { flex: 1, fontSize: 14, fontFamily: "Urbanist_600SemiBold", color: Colors.primary },
  submitBtn: { borderRadius: 14, overflow: "hidden" },
  submitGrad: { height: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  submitText: { fontSize: 16, fontFamily: "Urbanist_700Bold", color: "#fff" },
});

const editS = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { backgroundColor: Colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "92%", borderWidth: 1, borderColor: Colors.cardBorder },
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
  // Profile photo
  photoSection: { alignItems: "center", paddingVertical: 4, gap: 10 },
  photoWrap: { width: 90, height: 90, borderRadius: 26, position: "relative" },
  photoImg: { width: 90, height: 90, borderRadius: 26 },
  photoPlaceholder: { width: 90, height: 90, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  photoInitials: { fontSize: 30, fontFamily: "Urbanist_700Bold", color: "#fff" },
  photoBadge: { position: "absolute", bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: Colors.card },
  photoHint: { fontSize: 12, fontFamily: "Urbanist_400Regular", color: Colors.textMuted },
});
