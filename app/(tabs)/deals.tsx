import React, { useCallback, memo } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { formatCurrency, formatDate } from "@/utils/formatters";

interface Deal {
  id: string;
  vehicle: string;
  vehicleImage: string;
  status: "WON" | "PENDING_PAYMENT" | "COMPLETED" | "LOST";
  price: number;
  date: string;
  type: "AUCTION" | "BUY_NOW";
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: string }> = {
  WON: { label: "Won", color: Colors.success, bg: "#22C55E22", border: "#22C55E44", icon: "trophy" },
  PENDING_PAYMENT: { label: "Payment Due", color: Colors.warning, bg: "#F59E0B22", border: "#F59E0B44", icon: "time" },
  COMPLETED: { label: "Completed", color: Colors.info, bg: "#3B82F622", border: "#3B82F644", icon: "checkmark-circle" },
  LOST: { label: "Lost", color: Colors.textMuted, bg: Colors.surface, border: Colors.cardBorder, icon: "close-circle" },
};

const DealCard = memo(function DealCard({ item }: { item: Deal }) {
  const config = STATUS_CONFIG[item.status];
  const isAuction = item.type === "AUCTION";

  return (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={styles.vehicleImgWrap}>
          <Image source={{ uri: item.vehicleImage }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
        </View>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Text style={styles.vehicleName} numberOfLines={1}>{item.vehicle}</Text>
          <View style={[styles.statusBadge, { backgroundColor: config.bg, borderColor: config.border }]}>
            <Ionicons name={config.icon as any} size={11} color={config.color} />
            <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
          </View>
        </View>
        <Text style={styles.cardMeta}>{isAuction ? "Auction" : "Direct Purchase"} · {formatDate(item.date)}</Text>
        <Text style={styles.dealPrice}>{formatCurrency(item.price)}</Text>
        {item.status === "PENDING_PAYMENT" && (
          <Pressable style={styles.payNowBtn}>
            <Text style={styles.payNowText}>Complete Payment</Text>
            <Ionicons name="arrow-forward" size={13} color={Colors.primary} />
          </Pressable>
        )}
      </View>
    </View>
  );
});

export default function DealsScreen() {
  const insets = useSafeAreaInsets();

  const { data, isLoading, refetch, isRefetching } = useQuery<{ success: boolean; data: { myDeals: Deal[] } }>({
    queryKey: ["/api/user/deals"],
  });

  const deals = data?.data?.myDeals ?? [];
  const wonCount = deals.filter((d) => d.status === "WON" || d.status === "COMPLETED").length;
  const pendingCount = deals.filter((d) => d.status === "PENDING_PAYMENT").length;
  const totalValue = deals.filter((d) => d.status === "WON" || d.status === "COMPLETED").reduce((sum, d) => sum + d.price, 0);

  const keyExtractor = useCallback((item: Deal) => item.id, []);
  const renderItem = useCallback(({ item }: { item: Deal }) => <DealCard item={item} />, []);

  const topPadding = insets.top + (insets.top < 20 ? 67 : 0);

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>My Deals</Text>
        <Text style={styles.pageSubtitle}>{deals.length} total transactions</Text>
      </View>

      {!isLoading && deals.length > 0 && (
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{wonCount}</Text>
            <Text style={styles.statLabel}>Won</Text>
          </View>
          <View style={[styles.statCard, styles.statCardMiddle]}>
            <Text style={[styles.statValue, { color: Colors.warning }]}>{pendingCount}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { fontSize: 14 }]}>{formatCurrency(totalValue)}</Text>
            <Text style={styles.statLabel}>Total Value</Text>
          </View>
        </View>
      )}

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={deals}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isRefetching}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No Deals Yet</Text>
              <Text style={styles.emptySubtitle}>Your won auctions and purchases will appear here</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 24, paddingBottom: 16 },
  pageTitle: { fontSize: 24, fontFamily: "Urbanist_700Bold", color: Colors.text },
  pageSubtitle: { fontSize: 14, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary, marginTop: 2 },
  statsRow: { flexDirection: "row", marginHorizontal: 24, marginBottom: 20, backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.cardBorder, overflow: "hidden" },
  statCard: { flex: 1, alignItems: "center", paddingVertical: 16, gap: 4 },
  statCardMiddle: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: Colors.cardBorder },
  statValue: { fontSize: 20, fontFamily: "Urbanist_700Bold", color: Colors.primary },
  statLabel: { fontSize: 12, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { paddingHorizontal: 24, paddingBottom: 100, gap: 12 },
  card: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  cardLeft: { width: 90 },
  vehicleImgWrap: { width: 90, height: "100%", minHeight: 90, position: "relative" },
  cardBody: { flex: 1, padding: 14, gap: 6 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  vehicleName: { flex: 1, fontSize: 15, fontFamily: "Urbanist_700Bold", color: Colors.text },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  statusText: { fontSize: 10, fontFamily: "Urbanist_700Bold" },
  cardMeta: { fontSize: 12, fontFamily: "Urbanist_400Regular", color: Colors.textMuted },
  dealPrice: { fontSize: 16, fontFamily: "Urbanist_700Bold", color: Colors.primary },
  payNowBtn: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", marginTop: 4 },
  payNowText: { fontSize: 13, fontFamily: "Urbanist_600SemiBold", color: Colors.primary },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 20, fontFamily: "Urbanist_700Bold", color: Colors.text },
  emptySubtitle: { fontSize: 14, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary, textAlign: "center", paddingHorizontal: 40 },
});
