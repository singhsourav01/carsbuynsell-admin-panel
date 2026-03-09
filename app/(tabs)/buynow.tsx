import React, { useState, useCallback, useEffect, memo } from "react";
import {
  View, Text, FlatList, Pressable, StyleSheet,
  ActivityIndicator, RefreshControl, TextInput,
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

const VCard = memo(function VCard({ item, onPress }: { item: any; onPress: () => void }) {
  const imageUri = item.images?.[0]?.url || item.images?.[0]?.file_url;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, { opacity: pressed ? 0.95 : 1 }]}>
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
        </View>
      </View>
    </Pressable>
  );
});

export default function BuyNowScreen() {
  const insets = useSafeAreaInsets();
  const topPad = insets.top + (insets.top < 20 ? 67 : 0);

  // API data
  const [listings, setListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchListings = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    try {
      const res = await apiRequestDirect("GET", "http://192.168.1.102:8002/user/listings?type=BUY_NOW");
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

  // Filter by search
  const query = searchQuery.trim().toLowerCase();
  const filtered = query
    ? listings.filter((item) => item.lst_title?.toLowerCase().includes(query))
    : listings;

  const handlePress = useCallback((v: any) => { router.push(`/listing/${v.lst_id}` as any); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }, []);
  const keyExtractor = useCallback((item: any) => item.lst_id, []);
  const renderItem = useCallback(({ item }: { item: any }) => <VCard item={item} onPress={() => handlePress(item)} />, [handlePress]);

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
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 20, fontFamily: "Urbanist_700Bold", color: Colors.text },
  emptySub: { fontSize: 14, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary },
});
