import React, { useState, useCallback, memo } from "react";
import {
  View, Text, FlatList, Pressable, StyleSheet, Modal,
  ActivityIndicator, Alert,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { formatCurrency } from "@/utils/formatters";
import { apiRequest } from "@/lib/auth";

interface Vehicle { id: string; title: string; price: number; image: string; category: string; year: number; km: number; location: string; fuel: string; transmission: string; }

function DetailSheet({ v, visible, onClose }: { v: Vehicle | null; visible: boolean; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  if (!v) return null;
  const specs = [
    { icon: "calendar-outline", label: "Year", val: String(v.year) },
    { icon: "speedometer-outline", label: "Mileage", val: `${(v.km/1000).toFixed(0)}k km` },
    { icon: "location-outline", label: "Location", val: v.location },
    { icon: "flame-outline", label: "Fuel", val: v.fuel },
    { icon: "settings-outline", label: "Trans.", val: v.transmission },
  ];
  const handleBuy = async () => {
    setLoading(true);
    try {
      const res = await apiRequest("POST", `/api/user/buy-now/${v.id}/purchase`, {});
      const data = await res.json();
      if (data.success) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); onClose(); Alert.alert("Initiated!", "Our team will contact you shortly."); }
    } catch {} finally { setLoading(false); }
  };
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={detS.overlay}>
        <View style={detS.sheet}>
          <View style={detS.grabber} />
          <View style={detS.imgWrap}>
            <Image source={{ uri: v.image }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
            <LinearGradient colors={["transparent", "rgba(0,0,0,0.6)"]} style={StyleSheet.absoluteFill} />
            <Pressable onPress={onClose} style={detS.closeBtn}><Ionicons name="close" size={20} color="#fff" /></Pressable>
            <View style={detS.priceBadge}>
              <Text style={detS.priceBadgeLabel}>Buy Now</Text>
              <Text style={detS.priceBadgeVal}>{formatCurrency(v.price)}</Text>
            </View>
          </View>
          <View style={detS.content}>
            <Text style={detS.vTitle}>{v.title}</Text>
            <View style={detS.catTag}><Text style={detS.catTagText}>{v.category}</Text></View>
            <View style={detS.specs}>
              {specs.map(s => (
                <View key={s.label} style={detS.specItem}>
                  <Ionicons name={s.icon as any} size={18} color={Colors.primary} />
                  <View><Text style={detS.specLabel}>{s.label}</Text><Text style={detS.specVal}>{s.val}</Text></View>
                </View>
              ))}
            </View>
            <Pressable style={({ pressed }) => [detS.buyBtn, { opacity: pressed ? 0.85 : 1 }]} onPress={handleBuy} disabled={loading}>
              <LinearGradient colors={[Colors.heroLight, Colors.hero]} style={detS.buyBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {loading ? <ActivityIndicator color="#fff" /> : <><Ionicons name="pricetag" size={16} color="#fff" /><Text style={detS.buyBtnText}>Buy Now · {formatCurrency(v.price)}</Text></>}
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const VCard = memo(function VCard({ item, onPress }: { item: Vehicle; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, { opacity: pressed ? 0.95 : 1 }]}>
      <View style={styles.imgWrap}>
        <Image source={{ uri: item.image }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
        <View style={styles.badge}><Ionicons name="pricetag" size={9} color="#fff" /><Text style={styles.badgeText}>BUY NOW</Text></View>
      </View>
      <View style={styles.body}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.cardMeta}>{item.year} · {(item.km/1000).toFixed(0)}k km · {item.fuel}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatCurrency(item.price)}</Text>
          <View style={styles.locRow}><Ionicons name="location-outline" size={12} color={Colors.textMuted} /><Text style={styles.locText}>{item.location}</Text></View>
        </View>
      </View>
    </Pressable>
  );
});

export default function BuyNowScreen() {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<Vehicle | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const topPad = insets.top + (insets.top < 20 ? 67 : 0);
  const { data, isLoading, refetch, isRefetching } = useQuery<{ success: boolean; data: { vehicles: Vehicle[] } }>({ queryKey: ["/api/user/buy-now"] });
  const vehicles = data?.data?.vehicles ?? [];
  const handlePress = useCallback((v: Vehicle) => { setSelected(v); setDetailVisible(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }, []);
  const keyExtractor = useCallback((item: Vehicle) => item.id, []);
  const renderItem = useCallback(({ item }: { item: Vehicle }) => <VCard item={item} onPress={() => handlePress(item)} />, [handlePress]);

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Buy Now</Text>
        <Text style={styles.pageSub}>{vehicles.length} vehicles available</Text>
      </View>
      {isLoading ? <View style={styles.loadWrap}><ActivityIndicator size="large" color={Colors.primary} /></View> : (
        <FlatList data={vehicles} renderItem={renderItem} keyExtractor={keyExtractor}
          contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}
          onRefresh={refetch} refreshing={isRefetching}
          ListEmptyComponent={<View style={styles.empty}><Ionicons name="car-outline" size={48} color={Colors.textMuted} /><Text style={styles.emptyTitle}>No Vehicles</Text><Text style={styles.emptySub}>Check back soon for new listings</Text></View>}
        />
      )}
      <DetailSheet v={selected} visible={detailVisible} onClose={() => setDetailVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  pageTitle: { fontSize: 24, fontFamily: "Urbanist_700Bold", color: Colors.text },
  pageSub: { fontSize: 13, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary, marginTop: 2 },
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
  locRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  locText: { fontSize: 12, fontFamily: "Urbanist_400Regular", color: Colors.textMuted },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 20, fontFamily: "Urbanist_700Bold", color: Colors.text },
  emptySub: { fontSize: 14, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary },
});

const detS = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { backgroundColor: Colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "90%", borderWidth: 1, borderColor: Colors.cardBorder },
  grabber: { width: 36, height: 4, backgroundColor: Colors.cardBorder, borderRadius: 2, alignSelf: "center", marginTop: 12 },
  imgWrap: { height: 210, position: "relative", marginTop: 8 },
  closeBtn: { position: "absolute", top: 12, right: 12, width: 36, height: 36, backgroundColor: "rgba(0,0,0,0.45)", borderRadius: 18, alignItems: "center", justifyContent: "center" },
  priceBadge: { position: "absolute", bottom: 14, right: 14, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.primary + "55" },
  priceBadgeLabel: { fontSize: 11, fontFamily: "Urbanist_400Regular", color: "rgba(255,255,255,0.7)", textAlign: "right" },
  priceBadgeVal: { fontSize: 22, fontFamily: "Urbanist_700Bold", color: "#FFD700" },
  content: { padding: 20, gap: 14 },
  vTitle: { fontSize: 22, fontFamily: "Urbanist_700Bold", color: Colors.text },
  catTag: { alignSelf: "flex-start", backgroundColor: Colors.primaryLight, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4 },
  catTagText: { fontSize: 12, fontFamily: "Urbanist_600SemiBold", color: Colors.primary },
  specs: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  specItem: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.surface, borderRadius: 12, padding: 10, flex: 1, minWidth: "40%" },
  specLabel: { fontSize: 10, fontFamily: "Urbanist_400Regular", color: Colors.textMuted },
  specVal: { fontSize: 13, fontFamily: "Urbanist_700Bold", color: Colors.text },
  buyBtn: { borderRadius: 14, overflow: "hidden" },
  buyBtnGrad: { height: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  buyBtnText: { fontSize: 16, fontFamily: "Urbanist_700Bold", color: "#fff" },
});
