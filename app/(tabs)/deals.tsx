import React, { useCallback, memo } from "react";
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { formatCurrency, formatDate } from "@/utils/formatters";

interface Deal { id: string; vehicle: string; vehicleImage: string; status: "WON" | "PENDING_PAYMENT" | "COMPLETED" | "LOST"; price: number; date: string; type: string; }

const STATUS: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  WON:             { label: "Won",           color: Colors.success, bg: "#D1FAE5", icon: "trophy" },
  PENDING_PAYMENT: { label: "Payment Due",   color: Colors.warning, bg: "#FEF3C7", icon: "time" },
  COMPLETED:       { label: "Completed",     color: Colors.info,    bg: "#DBEAFE", icon: "checkmark-circle" },
  LOST:            { label: "Lost",          color: Colors.textMuted, bg: Colors.surface, icon: "close-circle" },
};

const DealCard = memo(function DealCard({ item }: { item: Deal }) {
  const cfg = STATUS[item.status];
  return (
    <View style={styles.card}>
      <View style={styles.imgWrap}>
        <Image source={{ uri: item.vehicleImage }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
      </View>
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.vehicleName} numberOfLines={1}>{item.vehicle}</Text>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <Ionicons name={cfg.icon as any} size={11} color={cfg.color} />
            <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>
        <Text style={styles.meta}>{item.type === "AUCTION" ? "Auction" : "Direct Purchase"} · {formatDate(item.date)}</Text>
        <Text style={styles.price}>{formatCurrency(item.price)}</Text>
        {item.status === "PENDING_PAYMENT" && (
          <Pressable style={styles.payBtn}><Text style={styles.payBtnText}>Complete Payment</Text><Ionicons name="arrow-forward" size={12} color={Colors.primary} /></Pressable>
        )}
      </View>
    </View>
  );
});

export default function DealsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = insets.top + (insets.top < 20 ? 67 : 0);
  const { data, isLoading, refetch, isRefetching } = useQuery<{ success: boolean; data: { myDeals: Deal[] } }>({ queryKey: ["/api/user/deals"] });
  const deals = data?.data?.myDeals ?? [];
  const won = deals.filter(d => d.status === "WON" || d.status === "COMPLETED").length;
  const pending = deals.filter(d => d.status === "PENDING_PAYMENT").length;
  const total = deals.filter(d => d.status === "WON" || d.status === "COMPLETED").reduce((s, d) => s + d.price, 0);
  const keyExtractor = useCallback((item: Deal) => item.id, []);
  const renderItem = useCallback(({ item }: { item: Deal }) => <DealCard item={item} />, []);

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>My Deals</Text>
        <Text style={styles.pageSub}>{deals.length} total transactions</Text>
      </View>
      {!isLoading && deals.length > 0 && (
        <View style={styles.statsRow}>
          <View style={styles.statCard}><Text style={styles.statVal}>{won}</Text><Text style={styles.statLabel}>Won</Text></View>
          <View style={[styles.statCard, styles.statMid]}><Text style={[styles.statVal, { color: Colors.warning }]}>{pending}</Text><Text style={styles.statLabel}>Pending</Text></View>
          <View style={styles.statCard}><Text style={[styles.statVal, { fontSize: 14 }]}>{formatCurrency(total)}</Text><Text style={styles.statLabel}>Total Value</Text></View>
        </View>
      )}
      {isLoading ? <View style={styles.loadWrap}><ActivityIndicator size="large" color={Colors.primary} /></View> : (
        <FlatList data={deals} renderItem={renderItem} keyExtractor={keyExtractor}
          contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}
          onRefresh={refetch} refreshing={isRefetching}
          ListEmptyComponent={<View style={styles.empty}><Ionicons name="document-text-outline" size={48} color={Colors.textMuted} /><Text style={styles.emptyTitle}>No Deals Yet</Text><Text style={styles.emptySub}>Your deals will appear here</Text></View>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  pageTitle: { fontSize: 24, fontFamily: "Urbanist_700Bold", color: Colors.text },
  pageSub: { fontSize: 13, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary, marginTop: 2 },
  statsRow: { flexDirection: "row", marginHorizontal: 16, marginBottom: 16, backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.cardBorder, overflow: "hidden" },
  statCard: { flex: 1, alignItems: "center", paddingVertical: 16, gap: 4 },
  statMid: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: Colors.cardBorder },
  statVal: { fontSize: 20, fontFamily: "Urbanist_700Bold", color: Colors.primary },
  statLabel: { fontSize: 12, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary },
  loadWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { paddingHorizontal: 16, paddingBottom: 100, gap: 12 },
  card: { flexDirection: "row", backgroundColor: Colors.card, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: Colors.cardBorder, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  imgWrap: { width: 88, minHeight: 90, position: "relative" },
  body: { flex: 1, padding: 14, gap: 5 },
  topRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  vehicleName: { flex: 1, fontSize: 15, fontFamily: "Urbanist_700Bold", color: Colors.text },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 10, fontFamily: "Urbanist_700Bold" },
  meta: { fontSize: 12, fontFamily: "Urbanist_400Regular", color: Colors.textMuted },
  price: { fontSize: 16, fontFamily: "Urbanist_700Bold", color: Colors.primary },
  payBtn: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", marginTop: 2 },
  payBtnText: { fontSize: 12, fontFamily: "Urbanist_600SemiBold", color: Colors.primary },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 20, fontFamily: "Urbanist_700Bold", color: Colors.text },
  emptySub: { fontSize: 14, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary, textAlign: "center", paddingHorizontal: 40 },
});
