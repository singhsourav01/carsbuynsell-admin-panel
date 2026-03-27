import React, { useState, useCallback, useEffect, memo } from "react";
import {
  View,
  Text,
  FlatList,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/utils/formatters";
import { sortCategoriesByPreferredSequence } from "@/utils/category-order";
import { CountdownTimer } from "@/components/CountdownTimer";
import { apiRequestDirect } from "@/lib/auth";

const { width } = Dimensions.get("window");
const CARD_W = (width - 48 - 12) / 2;

// Quick action buttons
const QUICK_ACTIONS = [
  { id: "live", icon: "hammer-outline", label: "VIEW LIVE\nAUCTIONS", color: "#FF6B6B", bg: "#FFF0F0", route: "/(tabs)/live" },
  { id: "buynow", icon: "flash-outline", label: "BUY NOW\nCARS", color: "#4361EE", bg: "#EEF2FF", route: "/(tabs)/buynow" },
  { id: "deals", icon: "receipt-outline", label: "MY\nDEALS", color: "#F59E0B", bg: "#FFFBEB", route: "/(tabs)/deals" },
] as const;

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

function FeaturedCard({ item, isActive }: { item: any; isActive: boolean }) {
  const isAuction = item.lst_type === "AUCTION";
  const imageUri = getFirstListingImageUri(item);
  return (
    <Pressable
      onPress={() => { router.push(`/listing/${item.lst_id}` as any); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
      style={[styles.featuredCard, { width: width - 48, marginRight: 16 }]}
    >
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} contentFit="contain" transition={300} />
      ) : (
        <LinearGradient colors={[Colors.hero, Colors.heroDark]} style={StyleSheet.absoluteFill} />
      )}
      <LinearGradient colors={["transparent", "rgba(0,0,0,0.75)"]} style={styles.featuredGradient} />
      <View style={styles.featuredTypeBadge}>
        <Text style={[styles.featuredTypeBadgeText, { color: isAuction ? "#FFD700" : Colors.success }]}>
          {isAuction ? "LIVE AUCTION" : "BUY NOW"}
        </Text>
      </View>
      {/* Category badge */}
      {item.category?.cat_name && (
        <View style={styles.featuredCatBadge}>
          <Text style={styles.featuredCatBadgeText}>{item.category.cat_name}</Text>
        </View>
      )}
      <View style={styles.featuredBottom}>
        <Text style={styles.featuredTitle} numberOfLines={1}>{item.lst_title}</Text>
        <Text style={styles.featuredSeller} numberOfLines={1}>by {item.seller?.user_full_name || "Unknown"}</Text>
        <View style={styles.featuredPriceRow}>
          <Text style={styles.featuredPrice}>{formatCurrency(isAuction ? (item.lst_current_bid || item.lst_price) : item.lst_price)}</Text>
          {isAuction && item.lst_auction_end && <CountdownTimer endDate={item.lst_auction_end} compact />}
        </View>
        {isAuction && item.lst_bid_count > 0 && (
          <Text style={styles.featuredBidCount}>{item.lst_bid_count} bid{item.lst_bid_count !== 1 ? "s" : ""}</Text>
        )}
      </View>
    </Pressable>
  );
}
const MemoFeaturedCard = memo(FeaturedCard);

function RecentCard({ item }: { item: any }) {
  const isAuction = item.lst_type === "AUCTION";
  const imageUri = getFirstListingImageUri(item);
  return (
    <Pressable
      onPress={() => { router.push(`/listing/${item.lst_id}` as any); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
      style={[styles.recentCard, { width: CARD_W }]}
    >
      <View style={styles.recentImgWrap}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} contentFit="contain" />
        ) : (
          <LinearGradient colors={[Colors.hero, Colors.heroDark]} style={StyleSheet.absoluteFill} />
        )}
        <View style={[styles.recentBadge, { backgroundColor: isAuction ? "#FF6B6B" : Colors.success }]}>
          <Text style={styles.recentBadgeText}>{isAuction ? "LIVE" : "BUY NOW"}</Text>
        </View>
      </View>
      <View style={styles.recentInfo}>
        <Text style={styles.recentTitle} numberOfLines={1}>{item.lst_title}</Text>
        <Text style={styles.recentCategory} numberOfLines={1}>{item.category?.cat_name || ""}</Text>
        <Text style={styles.recentPrice}>{formatCurrency(isAuction ? (item.lst_current_bid || item.lst_price) : item.lst_price)}</Text>
      </View>
    </Pressable>
  );
}
const MemoRecentCard = memo(RecentCard);

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState("all");
  const [featuredIdx, setFeaturedIdx] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  // API data
  const [featured, setFeatured] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchHome = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    try {
      const res = await apiRequestDirect("GET", "http://13.127.188.130:3002/user/home");
      const rawText = await res.text();
      let data: any = {};
      try { data = JSON.parse(rawText); } catch { data = {}; }
      if (res.ok && data?.data) {
        setFeatured(data.data.featured || []);
        setRecent(data.data.recent?.data || []);
        setCategories(sortCategoriesByPreferredSequence(data.data.categories || []));
      }
    } catch { /* ignore */ }
    finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchHome(); }, [fetchHome]);

  const handleRefresh = useCallback(() => { fetchHome(true); }, [fetchHome]);

  // Filter by search + category
  const query = searchQuery.trim().toLowerCase();

  const filteredFeatured = query
    ? featured.filter((item) => item.lst_title?.toLowerCase().includes(query))
    : featured;

  const filteredRecent = recent.filter((item) => {
    const matchCategory = activeCategory === "all" || item.lst_category_id === activeCategory;
    const matchSearch = !query || item.lst_title?.toLowerCase().includes(query);
    return matchCategory && matchSearch;
  });

  const renderRecent = useCallback(({ item }: { item: any }) => <MemoRecentCard item={item} />, []);
  const keyExtractor = useCallback((item: any) => item.lst_id, []);

  const topPad = insets.top + (insets.top < 20 ? 67 : 0);

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Blue Hero Banner */}
        <View style={styles.heroBanner}>
          <Text style={styles.heroTitle}>Find your next big profit.</Text>
          <Text style={styles.heroSubtitle}>Browse verified dealer-exclusive listings.</Text>
          <View style={[styles.heroSearch, searchFocused && styles.heroSearchFocused]}>
            <Ionicons name="search-outline" size={18} color={searchFocused ? Colors.primary : "rgba(255,255,255,0.5)"} />
            <TextInput
              style={[styles.heroSearchInput, searchFocused && styles.heroSearchInputFocused]}
              placeholder="Search make, model..."
              placeholderTextColor={searchFocused ? Colors.textMuted : "rgba(255,255,255,0.5)"}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={18} color={searchFocused ? Colors.textMuted : "rgba(255,255,255,0.6)"} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsRow}>
            {QUICK_ACTIONS.map((action) => (
              <Pressable
                key={action.id}
                onPress={() => { router.push(action.route as any); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={({ pressed }) => [styles.quickActionCard, { opacity: pressed ? 0.85 : 1 }]}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: action.bg }]}>
                  <Ionicons name={action.icon as any} size={22} color={action.color} />
                </View>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Featured Listings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Listings</Text>
            <Text style={styles.premiumPicks}>PREMIUM PICKS</Text>
          </View>
          {isLoading ? (
            <View style={[styles.featuredCard, { width: width - 48, justifyContent: "center", alignItems: "center", backgroundColor: Colors.card }]}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : featured.length === 0 ? (
            <View style={[styles.featuredCard, { width: width - 48, justifyContent: "center", alignItems: "center", backgroundColor: Colors.card }]}>
              <Ionicons name="star-outline" size={32} color={Colors.textMuted} />
              <Text style={{ fontSize: 14, fontFamily: "Urbanist_500Medium", color: Colors.textMuted, marginTop: 8}}>No featured listings yet</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredScroll}
              decelerationRate="fast"
              snapToInterval={width - 32}
              snapToAlignment="start"
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / (width - 32));
                setFeaturedIdx(idx);
              }}
            >
              {filteredFeatured.map((item, i) => <MemoFeaturedCard key={item.lst_id} item={item} isActive={i === featuredIdx} />)}
            </ScrollView>
          )}
          {/* Dots */}
          {filteredFeatured.length > 1 && (
            <View style={styles.dotsRow}>
              {filteredFeatured.map((_, i) => (
                <View key={i} style={[styles.dot, i === featuredIdx && styles.dotActive]} />
              ))}
            </View>
          )}
        </View>

        {/* Category Chips */}
        <View style={styles.section}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
            <Pressable
              onPress={() => { setActiveCategory("all"); Haptics.selectionAsync(); }}
              style={[styles.chip, activeCategory === "all" && styles.chipActive]}
            >
              <Text style={[styles.chipText, activeCategory === "all" && styles.chipTextActive]}>All</Text>
            </Pressable>
            {categories.map((cat) => (
              <Pressable
                key={cat.cat_id}
                onPress={() => { setActiveCategory(cat.cat_id); Haptics.selectionAsync(); }}
                style={[styles.chip, activeCategory === cat.cat_id && styles.chipActive]}
              >
                <Text style={[styles.chipText, activeCategory === cat.cat_id && styles.chipTextActive]}>{cat.cat_name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Recent Listings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Listings</Text>
          {isLoading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />
          ) : filteredRecent.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 32 }}>
              <Ionicons name="car-outline" size={36} color={Colors.textMuted} />
              <Text style={{ fontSize: 14, fontFamily: "Urbanist_500Medium", color: Colors.textMuted, marginTop: 8 }}>No listings in this category</Text>
            </View>
          ) : (
            <FlatList
              data={filteredRecent}
              renderItem={renderRecent}
              keyExtractor={keyExtractor}
              numColumns={2}
              columnWrapperStyle={styles.recentGrid}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  heroBanner: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: Colors.hero,
    borderRadius: 20,
    padding: 24,
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  heroTitle: { fontSize: 22, fontFamily: "Urbanist_700Bold", color: "#fff", lineHeight: 30 },
  heroSubtitle: { fontSize: 14, fontFamily: "Urbanist_400Regular", color: "rgba(255,255,255,0.8)", marginBottom: 4 },
  heroSearch: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  heroSearchFocused: {
    backgroundColor: "#fff",
  },
  heroSearchInput: { flex: 1, fontSize: 14, fontFamily: "Urbanist_400Regular", color: "#fff", padding: 0 },
  heroSearchInputFocused: { color: Colors.text },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontFamily: "Urbanist_700Bold", color: Colors.text, paddingHorizontal: 16, marginBottom: 14 },
  premiumPicks: { fontSize: 11, fontFamily: "Urbanist_700Bold", color: Colors.primary, letterSpacing: 0.5 },
  quickActionsRow: { flexDirection: "row", paddingHorizontal: 16, gap: 12 },
  quickActionCard: {
    flex: 1, backgroundColor: Colors.card, borderRadius: 16, padding: 14, alignItems: "center", gap: 10,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  quickActionIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  quickActionLabel: { fontSize: 10, fontFamily: "Urbanist_700Bold", color: Colors.text, textAlign: "center", lineHeight: 14 },
  featuredScroll: { paddingHorizontal: 16 },
  featuredCard: {
    height: 200, borderRadius: 16, overflow: "hidden", position: "relative",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 4,
  },
  featuredGradient: { ...StyleSheet.absoluteFillObject, top: "30%" },
  featuredTypeBadge: {
    position: "absolute", top: 12, left: 12,
    backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4,
  },
  featuredTypeBadgeText: { fontSize: 10, fontFamily: "Urbanist_700Bold", letterSpacing: 0.5 },
  featuredCatBadge: {
    position: "absolute", top: 12, right: 12,
    backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4,
  },
  featuredCatBadgeText: { fontSize: 10, fontFamily: "Urbanist_600SemiBold", color: "#fff" },
  featuredBottom: { position: "absolute", bottom: 14, left: 14, right: 14, gap: 2 },
  featuredTitle: { fontSize: 16, fontFamily: "Urbanist_700Bold", color: "#fff" },
  featuredSeller: { fontSize: 12, fontFamily: "Urbanist_400Regular", color: "rgba(255,255,255,0.7)" },
  featuredPriceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 2 },
  featuredPrice: { fontSize: 18, fontFamily: "Urbanist_700Bold", color: "#FFD700" },
  featuredBidCount: { fontSize: 11, fontFamily: "Urbanist_500Medium", color: "rgba(255,255,255,0.6)" },
  dotsRow: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.inputBorder },
  dotActive: { width: 18, backgroundColor: Colors.primary },
  chipsScroll: { paddingHorizontal: 16, gap: 10 },
  chip: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.cardBorder },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 14, fontFamily: "Urbanist_600SemiBold", color: Colors.textSecondary },
  chipTextActive: { color: "#fff" },
  recentGrid: { paddingHorizontal: 16, gap: 12, marginBottom: 12 },
  recentCard: {
    backgroundColor: Colors.card, borderRadius: 14, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  recentImgWrap: { height: 110, position: "relative" },
  recentBadge: { position: "absolute", top: 8, left: 8, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3 },
  recentBadgeText: { fontSize: 9, fontFamily: "Urbanist_700Bold", color: "#fff" },
  recentInfo: { padding: 10, gap: 3 },
  recentTitle: { fontSize: 13, fontFamily: "Urbanist_600SemiBold", color: Colors.text },
  recentCategory: { fontSize: 11, fontFamily: "Urbanist_400Regular", color: Colors.textMuted },
  recentPrice: { fontSize: 14, fontFamily: "Urbanist_700Bold", color: Colors.primary },
});
