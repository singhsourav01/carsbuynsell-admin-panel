import React, { useState, useCallback, memo } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { SubscriptionModal } from "@/components/SubscriptionModal";
import { formatCurrency } from "@/utils/formatters";
import { apiRequest } from "@/lib/auth";

interface Vehicle {
  id: string;
  title: string;
  price: number;
  image: string;
  category: string;
  year: number;
  km: number;
  location: string;
  fuel: string;
  transmission: string;
}

interface VehicleDetailSheetProps {
  vehicle: Vehicle | null;
  visible: boolean;
  onClose: () => void;
  onBuy: () => void;
}

function VehicleDetailSheet({ vehicle, visible, onClose, onBuy }: VehicleDetailSheetProps) {
  const [loading, setLoading] = useState(false);

  if (!vehicle) return null;

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const res = await apiRequest("POST", `/api/user/buy-now/${vehicle.id}/purchase`, {});
      const data = await res.json();
      if (data.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onBuy();
        onClose();
        Alert.alert("Success!", "Purchase initiated. Our team will contact you shortly.");
      }
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const specs = [
    { icon: "calendar-outline", label: "Year", value: String(vehicle.year) },
    { icon: "speedometer-outline", label: "Mileage", value: `${(vehicle.km / 1000).toFixed(0)}k km` },
    { icon: "location-outline", label: "Location", value: vehicle.location },
    { icon: "flame-outline", label: "Fuel", value: vehicle.fuel },
    { icon: "settings-outline", label: "Trans.", value: vehicle.transmission },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={detailStyles.overlay}>
        <View style={detailStyles.sheet}>
          <View style={detailStyles.grabber} />
          <View style={detailStyles.imageWrap}>
            <Image source={{ uri: vehicle.image }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
            <LinearGradient colors={["transparent", "rgba(0,0,0,0.6)"]} style={StyleSheet.absoluteFill} />
            <Pressable onPress={onClose} style={detailStyles.closeBtn}>
              <Ionicons name="close" size={20} color="#fff" />
            </Pressable>
            <View style={detailStyles.priceBadge}>
              <Text style={detailStyles.priceBadgeLabel}>Buy Now</Text>
              <Text style={detailStyles.priceBadgeValue}>{formatCurrency(vehicle.price)}</Text>
            </View>
          </View>
          <View style={detailStyles.content}>
            <Text style={detailStyles.vehicleTitle}>{vehicle.title}</Text>
            <View style={detailStyles.categoryTag}>
              <Text style={detailStyles.categoryTagText}>{vehicle.category}</Text>
            </View>
            <View style={detailStyles.specs}>
              {specs.map((spec) => (
                <View key={spec.label} style={detailStyles.specItem}>
                  <Ionicons name={spec.icon as any} size={18} color={Colors.primary} />
                  <View>
                    <Text style={detailStyles.specLabel}>{spec.label}</Text>
                    <Text style={detailStyles.specValue}>{spec.value}</Text>
                  </View>
                </View>
              ))}
            </View>
            <Pressable
              style={({ pressed }) => [detailStyles.purchaseBtn, { opacity: pressed ? 0.85 : 1 }]}
              onPress={handlePurchase}
              disabled={loading}
            >
              <LinearGradient
                colors={["#FF8C4C", Colors.primary, "#E05020"]}
                style={detailStyles.purchaseBtnGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Ionicons name="pricetag" size={16} color="#fff" />
                    <Text style={detailStyles.purchaseBtnText}>Buy Now · {formatCurrency(vehicle.price)}</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const BuyNowCard = memo(function BuyNowCard({ item, onPress }: { item: Vehicle; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.93 : 1 }]}
    >
      <View style={styles.cardImgWrap}>
        <Image source={{ uri: item.image }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
        <LinearGradient colors={["transparent", "rgba(0,0,0,0.65)"]} style={styles.cardImgGrad} />
        <View style={styles.buyNowBadge}>
          <Ionicons name="pricetag" size={10} color={Colors.success} />
          <Text style={styles.buyNowBadgeText}>BUY NOW</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <View style={styles.cardMeta}>
          <Text style={styles.cardMetaText}>{item.year} · {(item.km / 1000).toFixed(0)}k km · {item.fuel}</Text>
        </View>
        <View style={styles.cardBottom}>
          <Text style={styles.cardPrice}>{formatCurrency(item.price)}</Text>
          <View style={styles.cardLocation}>
            <Ionicons name="location-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.cardLocationText}>{item.location}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
});

export default function BuyNowScreen() {
  const insets = useSafeAreaInsets();
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [subModalVisible, setSubModalVisible] = useState(false);

  const { data, isLoading, refetch, isRefetching } = useQuery<{ success: boolean; data: { vehicles: Vehicle[] } }>({
    queryKey: ["/api/user/buy-now"],
  });

  const vehicles = data?.data?.vehicles ?? [];

  const handlePress = useCallback((vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setDetailVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const keyExtractor = useCallback((item: Vehicle) => item.id, []);
  const renderItem = useCallback(
    ({ item }: { item: Vehicle }) => <BuyNowCard item={item} onPress={() => handlePress(item)} />,
    [handlePress],
  );

  const topPadding = insets.top + (insets.top < 20 ? 67 : 0);

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Buy Now</Text>
        <Text style={styles.pageSubtitle}>{vehicles.length} vehicles available</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={vehicles}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isRefetching}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="car-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No Vehicles Available</Text>
              <Text style={styles.emptySubtitle}>Check back soon for new listings</Text>
            </View>
          }
        />
      )}

      <VehicleDetailSheet
        vehicle={selectedVehicle}
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
        onBuy={() => {}}
      />

      <SubscriptionModal
        visible={subModalVisible}
        onClose={() => setSubModalVisible(false)}
        onSuccess={() => {
          setSubModalVisible(false);
          if (selectedVehicle) setDetailVisible(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 24, paddingBottom: 16 },
  pageTitle: { fontSize: 24, fontFamily: "Urbanist_700Bold", color: Colors.text },
  pageSubtitle: { fontSize: 14, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary, marginTop: 2 },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { paddingHorizontal: 24, paddingBottom: 100, gap: 16 },
  card: { backgroundColor: Colors.card, borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: Colors.cardBorder },
  cardImgWrap: { height: 160, position: "relative" },
  cardImgGrad: { ...StyleSheet.absoluteFillObject, top: "40%" },
  buyNowBadge: {
    position: "absolute", top: 12, left: 12,
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#22C55E22", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: "#22C55E44",
  },
  buyNowBadgeText: { fontSize: 10, fontFamily: "Urbanist_700Bold", color: Colors.success, letterSpacing: 0.5 },
  cardBody: { padding: 16, gap: 8 },
  cardTitle: { fontSize: 16, fontFamily: "Urbanist_700Bold", color: Colors.text },
  cardMeta: {},
  cardMetaText: { fontSize: 13, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary },
  cardBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardPrice: { fontSize: 20, fontFamily: "Urbanist_700Bold", color: Colors.primary },
  cardLocation: { flexDirection: "row", alignItems: "center", gap: 4 },
  cardLocationText: { fontSize: 13, fontFamily: "Urbanist_400Regular", color: Colors.textMuted },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 20, fontFamily: "Urbanist_700Bold", color: Colors.text },
  emptySubtitle: { fontSize: 14, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary },
});

const detailStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  sheet: { backgroundColor: Colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "90%", borderWidth: 1, borderColor: Colors.cardBorder },
  grabber: { width: 36, height: 4, backgroundColor: Colors.cardBorder, borderRadius: 2, alignSelf: "center", marginTop: 12 },
  imageWrap: { height: 220, position: "relative", marginTop: 8 },
  closeBtn: { position: "absolute", top: 12, right: 12, width: 36, height: 36, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 18, alignItems: "center", justifyContent: "center" },
  priceBadge: { position: "absolute", bottom: 16, right: 16, backgroundColor: "rgba(0,0,0,0.7)", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.primary + "44" },
  priceBadgeLabel: { fontSize: 11, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary, textAlign: "right" },
  priceBadgeValue: { fontSize: 22, fontFamily: "Urbanist_700Bold", color: Colors.primary },
  content: { padding: 24, gap: 16 },
  vehicleTitle: { fontSize: 22, fontFamily: "Urbanist_700Bold", color: Colors.text },
  categoryTag: { alignSelf: "flex-start", backgroundColor: Colors.surface, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: Colors.cardBorder },
  categoryTagText: { fontSize: 12, fontFamily: "Urbanist_600SemiBold", color: Colors.textSecondary },
  specs: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  specItem: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.surface, borderRadius: 12, padding: 10, flex: 1, minWidth: "40%" },
  specLabel: { fontSize: 10, fontFamily: "Urbanist_400Regular", color: Colors.textMuted },
  specValue: { fontSize: 13, fontFamily: "Urbanist_700Bold", color: Colors.text },
  purchaseBtn: { borderRadius: 14, overflow: "hidden" },
  purchaseBtnGrad: { height: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  purchaseBtnText: { fontSize: 16, fontFamily: "Urbanist_700Bold", color: "#fff" },
});
