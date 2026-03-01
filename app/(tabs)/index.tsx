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
import { VehicleCard } from "@/components/VehicleCard";
import { formatCurrency } from "@/utils/formatters";
import { CountdownTimer } from "@/components/CountdownTimer";

const { width } = Dimensions.get("window");

interface HomeData {
  featured: any[];
  categories: any[];
  recent: { data: any[] };
}

function FeaturedCard({ item }: { item: any }) {
  const isAuction = item.type === "AUCTION";
  return (
    <Pressable
      style={[styles.featuredCard, { width: width - 48 }]}
      onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
    >
      <Image source={{ uri: item.image }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
      <LinearGradient colors={["transparent", "rgba(0,0,0,0.85)"]} style={styles.featuredGradient} />
      <View style={styles.featuredContent}>
        <View style={styles.featuredBadge}>
          <Ionicons name={isAuction ? "flash" : "pricetag"} size={10} color={isAuction ? Colors.primary : Colors.success} />
          <Text style={[styles.featuredBadgeText, { color: isAuction ? Colors.primary : Colors.success }]}>
            {isAuction ? "LIVE AUCTION" : "BUY NOW"}
          </Text>
        </View>
        <Text style={styles.featuredTitle}>{item.title}</Text>
        <View style={styles.featuredBottom}>
          <View>
            <Text style={styles.featuredPriceLabel}>{isAuction ? "Current Bid" : "Price"}</Text>
            <Text style={styles.featuredPrice}>{formatCurrency(isAuction ? item.currentBid : item.price)}</Text>
          </View>
          {isAuction && item.auctionEnd && (
            <CountdownTimer endDate={item.auctionEnd} compact />
          )}
        </View>
      </View>
    </Pressable>
  );
}

const MemoFeaturedCard = memo(FeaturedCard);

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState("all");

  const { data, isLoading, refetch, isRefetching } = useQuery<{ success: boolean; data: HomeData }>({
    queryKey: ["/api/user/home"],
  });

  const home = data?.data;

  const filteredRecent = home?.recent.data ?? [];

  const renderRecentItem = useCallback(
    ({ item }: { item: any }) => (
      <VehicleCard
        item={item}
        onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
        size="medium"
      />
    ),
    [],
  );

  const keyExtractor = useCallback((item: any) => item.id, []);

  const topPadding = insets.top + (insets.top < 20 ? 67 : 0);

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good day,</Text>
          <Text style={styles.userName}>{user?.fullName?.split(" ")[0] ?? "Driver"}</Text>
        </View>
        <Pressable style={styles.notifBtn}>
          <Ionicons name="notifications-outline" size={22} color={Colors.text} />
          <View style={styles.notifDot} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.primary}
          />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Search Bar */}
        <Pressable style={styles.searchBar} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
          <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
          <Text style={styles.searchPlaceholder}>Search vehicles, brands...</Text>
        </Pressable>

        {/* Featured */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Featured</Text>
          {isLoading ? (
            <View style={[styles.featuredCard, { width: width - 48, backgroundColor: Colors.card }]}>
              <ActivityIndicator color={Colors.primary} style={{ flex: 1 }} />
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredScroll} decelerationRate="fast" snapToInterval={width - 40}>
              {home?.featured.map((item) => <MemoFeaturedCard key={item.id} item={item} />)}
            </ScrollView>
          )}
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse by Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catsScroll}>
            {home?.categories.map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() => {
                  setActiveCategory(cat.id);
                  Haptics.selectionAsync();
                }}
                style={[styles.catChip, activeCategory === cat.id && styles.catChipActive]}
              >
                <Text style={[styles.catChipText, activeCategory === cat.id && styles.catChipTextActive]}>
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Recent Listings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Listings</Text>
            <Pressable onPress={() => router.push("/(tabs)/live")}>
              <Text style={styles.seeAll}>See all</Text>
            </Pressable>
          </View>
          {isLoading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={filteredRecent}
              renderItem={renderRecentItem}
              keyExtractor={keyExtractor}
              numColumns={2}
              columnWrapperStyle={styles.gridRow}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {/* Sell CTA */}
        <Pressable style={styles.sellCta} onPress={() => router.push("/(tabs)/profile")}>
          <LinearGradient
            colors={["#FF8C4C", Colors.primary]}
            style={styles.sellCtaGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View>
              <Text style={styles.sellCtaTitle}>Sell Your Vehicle</Text>
              <Text style={styles.sellCtaSubtitle}>List it for auction or direct sale</Text>
            </View>
            <Ionicons name="arrow-forward" size={24} color="#fff" />
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  greeting: { fontSize: 14, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary },
  userName: { fontSize: 24, fontFamily: "Urbanist_700Bold", color: Colors.text },
  notifBtn: { position: "relative", padding: 8 },
  notifDot: {
    position: "absolute", top: 8, right: 8,
    width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 24,
    marginBottom: 24,
  },
  searchPlaceholder: { fontSize: 15, fontFamily: "Urbanist_400Regular", color: Colors.textMuted, flex: 1 },
  section: { marginBottom: 28 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontFamily: "Urbanist_700Bold", color: Colors.text, paddingHorizontal: 24, marginBottom: 14 },
  seeAll: { fontSize: 14, fontFamily: "Urbanist_600SemiBold", color: Colors.primary },
  featuredScroll: { paddingHorizontal: 24, gap: 16 },
  featuredCard: { height: 200, borderRadius: 20, overflow: "hidden", position: "relative" },
  featuredGradient: { ...StyleSheet.absoluteFillObject, top: "30%" },
  featuredContent: { position: "absolute", bottom: 16, left: 16, right: 16, gap: 6 },
  featuredBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    alignSelf: "flex-start", backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
  },
  featuredBadgeText: { fontSize: 9, fontFamily: "Urbanist_700Bold", letterSpacing: 0.5 },
  featuredTitle: { fontSize: 18, fontFamily: "Urbanist_700Bold", color: "#fff" },
  featuredBottom: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  featuredPriceLabel: { fontSize: 11, fontFamily: "Urbanist_400Regular", color: "rgba(255,255,255,0.6)" },
  featuredPrice: { fontSize: 20, fontFamily: "Urbanist_700Bold", color: Colors.primary },
  catsScroll: { paddingHorizontal: 24, gap: 10 },
  catChip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, backgroundColor: Colors.card,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  catChipActive: { backgroundColor: "#FF6B2C22", borderColor: Colors.primary },
  catChipText: { fontSize: 14, fontFamily: "Urbanist_600SemiBold", color: Colors.textSecondary },
  catChipTextActive: { color: Colors.primary },
  gridRow: { paddingHorizontal: 24, gap: 12, marginBottom: 12 },
  sellCta: { marginHorizontal: 24, borderRadius: 16, overflow: "hidden", marginBottom: 8 },
  sellCtaGrad: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20 },
  sellCtaTitle: { fontSize: 18, fontFamily: "Urbanist_700Bold", color: "#fff", marginBottom: 4 },
  sellCtaSubtitle: { fontSize: 13, fontFamily: "Urbanist_400Regular", color: "rgba(255,255,255,0.8)" },
});
