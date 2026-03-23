import React, { useState, useCallback, useEffect, memo } from "react";
import {
  View, Text, FlatList, Pressable, StyleSheet,
  ActivityIndicator, RefreshControl, TextInput, Alert,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { formatCurrency } from "@/utils/formatters";
import { apiRequestDirect } from "@/lib/auth";
import { SubscriptionModal } from "@/components/SubscriptionModal";
import { fetchMySubscription } from "@/lib/subscription";

function getFirstListingImageUri(item: any): string | undefined {
  const firstImage = item?.images?.[0] || item?.user_portfolio?.[0];
  if (!firstImage) return undefined;
  if (typeof firstImage === "string") return firstImage;
  return (
    firstImage.url ||
    firstImage.file_url ||
    firstImage.file_signed_url ||
    firstImage.signed_url ||
    firstImage.image_url
  );
}

const VCard = memo(function VCard({ item, onBuyNow }: { item: any; onBuyNow: () => void }) {
  const imageUri = getFirstListingImageUri(item);
  return (
    <Pressable onPress={() => { router.push(`/listing/${item.lst_id}` as any); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} style={({ pressed }) => [styles.card, { opacity: pressed ? 0.95 : 1 }]}>
      <View style={styles.imgWrap}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
        ) : (
          <LinearGradient colors={[Colors.hero, Colors.heroDark]} style={StyleSheet.absoluteFill} />
        )}
        <View style={styles.badge}><Ionicons name="pricetag" size={9} color="#fff" /><Text style={styles.badgeText}>BUY NOW</Text></View>
      </View>
      <View style={styles.body}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.lst_title}</Text>
        <Text style={styles.cardMeta} numberOfLines={1}>{item.category?.cat_name || ""} · {item.seller?.user_full_name || ""}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatCurrency(item.lst_price)}</Text>
          <Pressable
            onPress={(e) => { e.stopPropagation?.(); onBuyNow(); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
            style={styles.buyBtn}
          >
            <LinearGradient colors={[Colors.heroLight, Colors.hero]} style={styles.buyBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Ionicons name="pricetag" size={12} color="#fff" />
              <Text style={styles.buyBtnText}>Buy Now</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
});

export default function BuyNowScreen() {
  const insets = useSafeAreaInsets();
  const topPad = insets.top + (insets.top < 20 ? 67 : 0);

  const [listings, setListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [subVisible, setSubVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [buyingItem, setBuyingItem] = useState<string | null>(null);

  const executeBuyNow = useCallback(async (item: any) => {
    setBuyingItem(item.lst_id);
    try {
      const res = await apiRequestDirect(
        "POST",
        `http://13.127.188.130:3002/user/listings/${item.lst_id}/buy`,
        {},
        true,
      );
      const rawText = await res.text();
      let data: any = {};
      try { data = JSON.parse(rawText); } catch { data = {}; }
      if (res.ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Purchase Successful!", data?.message || "You have successfully purchased this vehicle.");
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert("Purchase Failed", data?.message || "Something went wrong. Please try again.");
      }
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Network Error", "Please check your connection and try again.");
    } finally {
      setBuyingItem(null);
    }
  }, []);

  const handleBuyNowPress = useCallback(async (item: any) => {
    setSelectedItem(item);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const sub = await fetchMySubscription();
      console.log("[DEBUG-SUB] buynow.tsx Subscription:", sub);

      const remainingUses =
        sub?.sub_remaining_uses ??
        sub?.remaining_uses ??
        0;

      console.log("[DEBUG-SUB] buynow.tsx remainingUses:", remainingUses);

      if (sub && remainingUses > 0) {
        Alert.alert(
          "Confirm Purchase",
          `Are you sure you want to buy "${item.lst_title}" for ${formatCurrency(item.lst_price)}?`,
          [
            { text: "Cancel", style: "cancel" },
            { text: "Buy Now", onPress: () => executeBuyNow(item) },
          ]
        );
      } else {
        setSubVisible(true);
      }

    } catch (err) {
      console.error("[DEBUG-SUB] buynow.tsx check error:", err);
      setSubVisible(true);
    }

  }, [executeBuyNow]);

  const fetchListings = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    try {
      const res = await apiRequestDirect("GET", "http://13.127.188.130:3002/user/listings?type=BUY_NOW");
      const rawText = await res.text();
      let data: any = {};
      try { data = JSON.parse(rawText); } catch { data = {}; }
      if (res.ok) {
        // Response could be data.data.data or data.data (array) or data.data.listings
        const items = data?.data?.data || data?.data?.listings || (Array.isArray(data?.data) ? data.data : []);
        setListings(items);
      }
    } catch { /* ignore */ }
    finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const handleRefresh = useCallback(() => { fetchListings(true); }, [fetchListings]);

  const query = searchQuery.trim().toLowerCase();
  const filtered = query
    ? listings.filter((item) => item.lst_title?.toLowerCase().includes(query))
    : listings;

  const keyExtractor = useCallback((item: any) => item.lst_id, []);
  const renderItem = useCallback(({ item }: { item: any }) => (
    <VCard item={item} onBuyNow={() => handleBuyNowPress(item)} />
  ), [handleBuyNowPress]);

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Buy Now</Text>
        <Text style={styles.pageSub}>{filtered.length} vehicle{filtered.length !== 1 ? "s" : ""} available</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search vehicles..."
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </Pressable>
        )}
      </View>

      {isLoading ? <View style={styles.loadWrap}><ActivityIndicator size="large" color={Colors.primary} /></View> : (
        <FlatList data={filtered} renderItem={renderItem} keyExtractor={keyExtractor}
          contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />}
          ListEmptyComponent={<View style={styles.empty}><Ionicons name="car-outline" size={48} color={Colors.textMuted} /><Text style={styles.emptyTitle}>No Vehicles</Text><Text style={styles.emptySub}>{query ? "No results for your search" : "Check back soon for new listings"}</Text></View>}
        />
      )}
      <SubscriptionModal
        visible={subVisible}
        onClose={() => setSubVisible(false)}
        onSuccess={() => {
          setSubVisible(false);
          if (selectedItem) {
            // After subscribing, confirm and buy
            Alert.alert(
              "Confirm Purchase",
              `Are you sure you want to buy "${selectedItem.lst_title}" for ${formatCurrency(selectedItem.lst_price)}?`,
              [
                { text: "Cancel", style: "cancel" },
                { text: "Buy Now", style: "default", onPress: () => executeBuyNow(selectedItem) },
              ]
            );
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 16, paddingBottom: 8 },
  pageTitle: { fontSize: 24, fontFamily: "Urbanist_700Bold", color: Colors.text },
  pageSub: { fontSize: 13, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary, marginTop: 2 },
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 16, marginBottom: 14,
    backgroundColor: Colors.inputBg, borderRadius: 12, borderWidth: 1, borderColor: Colors.inputBorder,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Urbanist_400Regular", color: Colors.text, padding: 0 },
  loadWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { paddingHorizontal: 16, paddingBottom: 100, gap: 14 },
  card: { backgroundColor: Colors.card, borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: Colors.cardBorder, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  imgWrap: { height: 155, position: "relative" },
  badge: { position: "absolute", top: 12, left: 12, flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Colors.success, borderRadius: 7, paddingHorizontal: 9, paddingVertical: 4 },
  badgeText: { fontSize: 9, fontFamily: "Urbanist_700Bold", color: "#fff" },
  body: { padding: 14, gap: 6 },
  cardTitle: { fontSize: 16, fontFamily: "Urbanist_700Bold", color: Colors.text },
  cardMeta: { fontSize: 13, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary },
  priceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  price: { fontSize: 20, fontFamily: "Urbanist_700Bold", color: Colors.primary },
  buyBtn: { borderRadius: 10, overflow: "hidden" },
  buyBtnGrad: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 9 },
  buyBtnText: { fontSize: 12, fontFamily: "Urbanist_700Bold", color: "#fff" },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 20, fontFamily: "Urbanist_700Bold", color: Colors.text },
  emptySub: { fontSize: 14, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary },
});
