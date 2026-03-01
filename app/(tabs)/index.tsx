import React, { useState, useCallback, memo } from "react";
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
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/utils/formatters";
import { CountdownTimer } from "@/components/CountdownTimer";

const { width } = Dimensions.get("window");
const CARD_W = (width - 48 - 12) / 2;

interface HomeData {
  featured: any[];
  categories: any[];
  recent: { data: any[] };
}

// Quick action buttons like in screenshot
const QUICK_ACTIONS = [
  { id: "live", icon: "hammer-outline", label: "VIEW LIVE\nAUCTIONS", color: "#FF6B6B", bg: "#FFF0F0", route: "/(tabs)/live" },
  { id: "buynow", icon: "flash-outline", label: "BUY NOW\nCARS", color: "#4361EE", bg: "#EEF2FF", route: "/(tabs)/buynow" },
  { id: "deals", icon: "handshake-outline", label: "MY\nDEALS", color: "#F59E0B", bg: "#FFFBEB", route: "/(tabs)/deals" },
] as const;

function FeaturedCard({ item, isActive }: { item: any; isActive: boolean }) {
  const isAuction = item.type === "AUCTION";
  return (
    <View style={[styles.featuredCard, { width: width - 48 }]}>
      <Image source={{ uri: item.image }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
      <LinearGradient colors={["transparent", "rgba(0,0,0,0.75)"]} style={styles.featuredGradient} />
      <View style={styles.featuredTypeBadge}>
        <Text style={[styles.featuredTypeBadgeText, { color: isAuction ? "#FFD700" : Colors.success }]}>
          {isAuction ? "LIVE AUCTION" : "BUY NOW"}
        </Text>
      </View>
      <View style={styles.featuredBottom}>
        <Text style={styles.featuredTitle} numberOfLines={1}>{item.title}</Text>
        <View style={styles.featuredPriceRow}>
          <Text style={styles.featuredPrice}>{formatCurrency(isAuction ? item.currentBid : item.price)}</Text>
          {isAuction && item.auctionEnd && <CountdownTimer endDate={item.auctionEnd} compact />}
        </View>
      </View>
    </View>
  );
}
const MemoFeaturedCard = memo(FeaturedCard);

function RecentCard({ item }: { item: any }) {
  const isAuction = item.type === "AUCTION";
  return (
    <Pressable
      onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
      style={[styles.recentCard, { width: CARD_W }]}
    >
      <View style={styles.recentImgWrap}>
        <Image source={{ uri: item.image }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
        <View style={[styles.recentBadge, { backgroundColor: isAuction ? "#FF6B6B" : Colors.success }]}>
          <Text style={styles.recentBadgeText}>{isAuction ? "LIVE" : "BUY NOW"}</Text>
        </View>
      </View>
      <View style={styles.recentInfo}>
        <Text style={styles.recentTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.recentPrice}>{formatCurrency(isAuction ? item.currentBid : item.price)}</Text>
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

  const { data, isLoading, refetch, isRefetching } = useQuery<{ success: boolean; data: HomeData }>({
    queryKey: ["/api/user/home"],
  });

  const home = data?.data;
  const topPad = insets.top + (insets.top < 20 ? 67 : 0);

  const renderRecent = useCallback(({ item }: { item: any }) => <MemoRecentCard item={item} />, []);
  const keyExtractor = useCallback((item: any) => item.id, []);

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Blue Hero Banner */}
        <View style={styles.heroBanner}>
          <Text style={styles.heroTitle}>Find your next big profit.</Text>
          <Text style={styles.heroSubtitle}>Browse 100+ verified dealer-exclusive listings.</Text>
          <View style={styles.heroSearch}>
            <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
            <Text style={styles.heroSearchText}>Search make, model...</Text>
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

        {/* Featured Cars */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Cars</Text>
            <Text style={styles.premiumPicks}>PREMIUM PICKS</Text>
          </View>
          {isLoading ? (
            <View style={[styles.featuredCard, { width: width - 48, justifyContent: "center", alignItems: "center", backgroundColor: Colors.card }]}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredScroll}
              decelerationRate="fast"
              snapToInterval={width - 40}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / (width - 40));
                setFeaturedIdx(idx);
              }}
            >
              {home?.featured.map((item, i) => <MemoFeaturedCard key={item.id} item={item} isActive={i === featuredIdx} />)}
            </ScrollView>
          )}
          {/* Dots */}
          {home?.featured && home.featured.length > 1 && (
            <View style={styles.dotsRow}>
              {home.featured.map((_, i) => (
                <View key={i} style={[styles.dot, i === featuredIdx && styles.dotActive]} />
              ))}
            </View>
          )}
        </View>

        {/* Category Chips */}
        <View style={styles.section}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
            {home?.categories.map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() => { setActiveCategory(cat.id); Haptics.selectionAsync(); }}
                style={[styles.chip, activeCategory === cat.id && styles.chipActive]}
              >
                <Text style={[styles.chipText, activeCategory === cat.id && styles.chipTextActive]}>{cat.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Recent Listings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Listings</Text>
          {isLoading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={home?.recent.data ?? []}
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
  heroSearchText: { fontSize: 14, fontFamily: "Urbanist_400Regular", color: "rgba(255,255,255,0.7)" },
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
  featuredScroll: { paddingHorizontal: 16, gap: 16 },
  featuredCard: {
    height: 190, borderRadius: 16, overflow: "hidden", position: "relative",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 4,
  },
  featuredGradient: { ...StyleSheet.absoluteFillObject, top: "30%" },
  featuredTypeBadge: {
    position: "absolute", top: 12, left: 12,
    backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4,
  },
  featuredTypeBadgeText: { fontSize: 10, fontFamily: "Urbanist_700Bold", letterSpacing: 0.5 },
  featuredBottom: { position: "absolute", bottom: 14, left: 14, right: 14, gap: 4 },
  featuredTitle: { fontSize: 16, fontFamily: "Urbanist_700Bold", color: "#fff" },
  featuredPriceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  featuredPrice: { fontSize: 18, fontFamily: "Urbanist_700Bold", color: "#FFD700" },
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
  recentInfo: { padding: 10, gap: 4 },
  recentTitle: { fontSize: 12, fontFamily: "Urbanist_600SemiBold", color: Colors.text },
  recentPrice: { fontSize: 14, fontFamily: "Urbanist_700Bold", color: Colors.primary },
});
