import React, { useState, useCallback, useEffect, memo } from "react";
import {
  View, Text, FlatList, Pressable, StyleSheet,
  ActivityIndicator, RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { formatCurrency } from "@/utils/formatters";
import { apiRequestDirect } from "@/lib/auth";

// ── Types ────────────────────────────────────────────────────────────────────

interface HistoryListing {
  lst_id: string;
  lst_title: string;
  lst_price: number;
  lst_type: "AUCTION" | "BUY_NOW";
  lst_status: string;
  images?: { url?: string; file_url?: string }[];
}

interface HistoryItem {
  id: string;
  type: "BID" | "ORDER";
  amount: number;
  status: string;
  created_at: string;
  listing: HistoryListing;
}

// ── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  PLACED:    { label: "Active",    color: Colors.warning, bg: "#FEF3C7", icon: "time-outline" },
  OUTBID:    { label: "Outbid",    color: Colors.danger,  bg: "#FEE2E2", icon: "arrow-down-outline" },
  WON:       { label: "Won",       color: Colors.success, bg: "#D1FAE5", icon: "trophy-outline" },
  LOST:      { label: "Lost",      color: Colors.textMuted, bg: Colors.surface, icon: "close-circle-outline" },
  CONFIRMED: { label: "Confirmed", color: Colors.success, bg: "#D1FAE5", icon: "checkmark-circle-outline" },
  PENDING:   { label: "Pending",   color: Colors.warning, bg: "#FEF3C7", icon: "time-outline" },
  CANCELLED: { label: "Cancelled", color: Colors.danger,  bg: "#FEE2E2", icon: "close-circle-outline" },
};

const DEFAULT_STATUS = { label: "Unknown", color: Colors.textMuted, bg: Colors.surface, icon: "help-circle-outline" };

// ── Helpers ──────────────────────────────────────────────────────────────────

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// ── Card component ───────────────────────────────────────────────────────────

const ActivityCard = memo(function ActivityCard({ item }: { item: HistoryItem }) {
  const cfg = STATUS_CONFIG[item.status] || DEFAULT_STATUS;
  const isBid = item.type === "BID";
  const image = item.listing.images?.[0];
  const imageUri = image?.url || image?.file_url;

  return (
    <Pressable
      style={({ pressed }) => [s.card, { opacity: pressed ? 0.95 : 1 }]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/listing/${item.listing.lst_id}?viewOnly=true`);
      }}
    >
      {/* Image section - LEFT */}
      <View style={s.cardImageWrap}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
        ) : (
          <LinearGradient colors={[Colors.hero, Colors.heroDark]} style={[StyleSheet.absoluteFill, s.cardImagePlaceholder]}>
            <Ionicons name="car-sport-outline" size={24} color="rgba(255,255,255,0.5)" />
          </LinearGradient>
        )}
        {/* Type badge - TOP RIGHT of image */}
        <View style={[s.typeBadge, { backgroundColor: isBid ? Colors.danger : Colors.success }]}>
          <Ionicons name={isBid ? "flash" : "pricetag"} size={8} color="#fff" />
          <Text style={s.typeBadgeText}>{isBid ? "LIVE BID" : "BUY NOW"}</Text>
        </View>
      </View>

      {/* Content section - RIGHT */}
      <View style={s.cardBody}>
        <Text style={s.cardTitle} numberOfLines={1}>{item.listing.lst_title}</Text>

        <View style={s.bidRow}>
          <Text style={s.bidLabel}>{isBid ? "Your Bid" : "Amount"}</Text>
          <Text style={s.bidValue}>{formatCurrency(item.amount)}</Text>
        </View>

        <View style={s.statusRow}>
          <View style={[s.statusBadge, { backgroundColor: cfg.bg }]}>
            <Ionicons name={cfg.icon as any} size={10} color={cfg.color} />
            <Text style={[s.statusText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
          <Text style={s.timeText}>{getRelativeTime(item.created_at)}</Text>
        </View>
      </View>

      {/* Arrow indicator */}
      <View style={s.arrowWrap}>
        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
      </View>
    </Pressable>
  );
});

// ── Main screen ──────────────────────────────────────────────────────────────

export default function DealsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = insets.top + (insets.top < 20 ? 67 : 0);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchHistory = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await apiRequestDirect(
        "GET",
        "http://13.127.188.130:3002/user/users/me/order-history",
        undefined,
        true,
      );
      const raw = await res.text();
      let data: any = {};
      try { data = JSON.parse(raw); } catch { data = {}; }
      if (res.ok && data?.data?.history) {
        setHistory(data.data.history);
      }
    } catch (err) {
      console.error("[DEALS] Fetch error:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchHistory(true);
  }, [fetchHistory]);

  // Stats
  const bids = history.filter(h => h.type === "BID");
  const orders = history.filter(h => h.type === "ORDER");
  const activeBids = bids.filter(b => b.status === "PLACED").length;
  const totalSpent = orders
    .filter(o => o.status === "CONFIRMED")
    .reduce((sum, o) => sum + o.amount, 0);

  const keyExtractor = useCallback((item: HistoryItem) => item.id, []);
  const renderItem = useCallback(({ item }: { item: HistoryItem }) => <ActivityCard item={item} />, []);

  return (
    <View style={[s.container, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.pageTitle}>Your Activity</Text>
        <Text style={s.pageSub}>Track your bids, purchases, and deals.</Text>
      </View>

      {/* Stats */}
      {/* {!isLoading && history.length > 0 && (
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <View style={[s.statIcon, { backgroundColor: "#EEF2FF" }]}>
              <Ionicons name="flash-outline" size={16} color={Colors.primary} />
            </View>
            <Text style={s.statVal}>{activeBids}</Text>
            <Text style={s.statLabel}>Active Bids</Text>
          </View>
          <View style={[s.statCard, s.statMid]}>
            <View style={[s.statIcon, { backgroundColor: "#D1FAE5" }]}>
              <Ionicons name="bag-check-outline" size={16} color={Colors.success} />
            </View>
            <Text style={s.statVal}>{orders.length}</Text>
            <Text style={s.statLabel}>Purchases</Text>
          </View>
          <View style={s.statCard}>
            <View style={[s.statIcon, { backgroundColor: "#FEF3C7" }]}>
              <Ionicons name="wallet-outline" size={16} color={Colors.warning} />
            </View>
            <Text style={[s.statVal, totalSpent > 999999 && { fontSize: 14 }]}>
              {formatCurrency(totalSpent)}
            </Text>
            <Text style={s.statLabel}>Total Spent</Text>
          </View>
        </View>
      )} */}

      {/* Section label */}
      {!isLoading && history.length > 0 && (
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>RECENT ACTIVITY</Text>
          <Text style={s.sectionCount}>{history.length} items</Text>
        </View>
      )}

      {/* List */}
      {isLoading ? (
        <View style={s.loadWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={s.loadText}>Loading activity...</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <View style={s.emptyIconWrap}>
                <Ionicons name="document-text-outline" size={48} color={Colors.textMuted} />
              </View>
              <Text style={s.emptyTitle}>No Activity Yet</Text>
              <Text style={s.emptySub}>
                Your bids and purchases will appear here once you start exploring vehicles.
              </Text>
              <Pressable
                style={s.emptyBtn}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/(tabs)/live"); }}
              >
                <Ionicons name="flash" size={14} color="#fff" />
                <Text style={s.emptyBtnText}>Explore Auctions</Text>
              </Pressable>
            </View>
          }
        />
      )}
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  pageTitle: { fontSize: 26, fontFamily: "Urbanist_700Bold", color: Colors.text },
  pageSub: { fontSize: 13, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary, marginTop: 3 },

  // Stats (commented out but kept for reference)
  statsRow: {
    flexDirection: "row", marginHorizontal: 20, marginBottom: 16,
    backgroundColor: Colors.card, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.cardBorder, overflow: "hidden",
  },
  statCard: { flex: 1, alignItems: "center", paddingVertical: 14, gap: 4 },
  statMid: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: Colors.cardBorder },
  statIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  statVal: { fontSize: 18, fontFamily: "Urbanist_700Bold", color: Colors.text },
  statLabel: { fontSize: 11, fontFamily: "Urbanist_400Regular", color: Colors.textMuted },

  // Section
  sectionHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, marginBottom: 12,
  },
  sectionTitle: { fontSize: 12, fontFamily: "Urbanist_700Bold", color: Colors.textMuted, letterSpacing: 0.8 },
  sectionCount: { fontSize: 12, fontFamily: "Urbanist_400Regular", color: Colors.textMuted },

  // Card - Horizontal layout
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardImageWrap: {
    width: 85,
    height: 85,
    position: "relative",
    backgroundColor: Colors.surface,
  },
  cardImagePlaceholder: { alignItems: "center", justifyContent: "center" },
  typeBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  typeBadgeText: { fontSize: 7, fontFamily: "Urbanist_700Bold", color: "#fff", letterSpacing: 0.3 },

  // Card body - RIGHT side
  cardBody: { flex: 1, paddingVertical: 10, paddingHorizontal: 12, gap: 4 },
  cardTitle: { fontSize: 14, fontFamily: "Urbanist_700Bold", color: Colors.text },

  // Bid row
  bidRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  bidLabel: { fontSize: 11, fontFamily: "Urbanist_400Regular", color: Colors.textMuted },
  bidValue: { fontSize: 14, fontFamily: "Urbanist_700Bold", color: Colors.primary },

  // Status row
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusText: { fontSize: 10, fontFamily: "Urbanist_700Bold" },
  timeText: { fontSize: 10, fontFamily: "Urbanist_400Regular", color: Colors.textMuted },

  // Arrow
  arrowWrap: { paddingRight: 12 },

  // Loading
  loadWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadText: { fontSize: 14, fontFamily: "Urbanist_500Medium", color: Colors.textSecondary },

  // List
  list: { paddingHorizontal: 20, paddingBottom: 100, gap: 10 },

  // Empty
  empty: { alignItems: "center", paddingTop: 80, gap: 12, paddingHorizontal: 40 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 24, backgroundColor: Colors.surface,
    alignItems: "center", justifyContent: "center", marginBottom: 4,
  },
  emptyTitle: { fontSize: 20, fontFamily: "Urbanist_700Bold", color: Colors.text },
  emptySub: { fontSize: 14, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary, textAlign: "center", lineHeight: 22 },
  emptyBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12, marginTop: 8,
  },
  emptyBtnText: { fontSize: 14, fontFamily: "Urbanist_700Bold", color: "#fff" },
});
