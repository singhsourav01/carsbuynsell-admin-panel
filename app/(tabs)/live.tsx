import React, { useState, useCallback, useRef, memo } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { CountdownTimer } from "@/components/CountdownTimer";
import { SubscriptionModal } from "@/components/SubscriptionModal";
import { formatCurrency } from "@/utils/formatters";
import { apiRequest } from "@/lib/auth";

const { width } = Dimensions.get("window");

interface Auction {
  id: string;
  title: string;
  currentBid: number;
  minIncrement: number;
  bidCount: number;
  auctionEnd: string;
  image: string;
  category: string;
  year: number;
  km: number;
  location: string;
}

interface BidSheetProps {
  auction: Auction | null;
  visible: boolean;
  onClose: () => void;
  onBidSuccess: (newBid: number) => void;
}

function BidSheet({ auction, visible, onClose, onBidSuccess }: BidSheetProps) {
  const [bidAmount, setBidAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const lastBidTime = useRef(0);

  if (!auction) return null;

  const minBid = auction.currentBid + auction.minIncrement;

  const handleBid = async () => {
    const now = Date.now();
    if (now - lastBidTime.current < 2000) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    const amount = parseInt(bidAmount.replace(/,/g, ""), 10);
    if (isNaN(amount) || amount < minBid) {
      Alert.alert("Invalid Bid", `Minimum bid is ${formatCurrency(minBid)}`);
      return;
    }

    lastBidTime.current = now;
    setLoading(true);
    try {
      const res = await apiRequest("POST", `/api/user/live/${auction.id}/bid`, { bidAmount: amount });
      const data = await res.json();
      if (data.success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onBidSuccess(amount);
        onClose();
        setBidAmount("");
      }
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const setQuickBid = (multiplier: number) => {
    setBidAmount(String(auction.currentBid + auction.minIncrement * multiplier));
    Haptics.selectionAsync();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={bidStyles.overlay}>
        <View style={bidStyles.sheet}>
          <View style={bidStyles.grabber} />
          <View style={bidStyles.header}>
            <Text style={bidStyles.sheetTitle}>Place Bid</Text>
            <Pressable onPress={onClose} style={bidStyles.closeBtn}>
              <Ionicons name="close" size={20} color={Colors.textSecondary} />
            </Pressable>
          </View>

          <View style={bidStyles.auctionInfo}>
            <Text style={bidStyles.auctionTitle} numberOfLines={1}>{auction.title}</Text>
            <View style={bidStyles.currentBidRow}>
              <View>
                <Text style={bidStyles.currentBidLabel}>Current Bid</Text>
                <Text style={bidStyles.currentBidValue}>{formatCurrency(auction.currentBid)}</Text>
              </View>
              <View style={bidStyles.timerWrap}>
                <Text style={bidStyles.timerLabel}>Ends in</Text>
                <CountdownTimer endDate={auction.auctionEnd} compact />
              </View>
            </View>
          </View>

          <View style={bidStyles.minBidInfo}>
            <Ionicons name="information-circle-outline" size={14} color={Colors.info} />
            <Text style={bidStyles.minBidText}>Minimum bid: {formatCurrency(minBid)}</Text>
          </View>

          <View style={bidStyles.quickBids}>
            {[1, 2, 3].map((mult) => (
              <Pressable key={mult} onPress={() => setQuickBid(mult)} style={bidStyles.quickBidBtn}>
                <Text style={bidStyles.quickBidText}>+{formatCurrency(auction.minIncrement * mult)}</Text>
              </Pressable>
            ))}
          </View>

          <View style={bidStyles.inputWrap}>
            <Text style={bidStyles.inputSymbol}>₹</Text>
            <TextInput
              style={bidStyles.input}
              value={bidAmount}
              onChangeText={setBidAmount}
              placeholder={String(minBid)}
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              returnKeyType="done"
            />
          </View>

          <Pressable
            style={({ pressed }) => [bidStyles.bidBtn, { opacity: pressed ? 0.85 : 1 }]}
            onPress={handleBid}
            disabled={loading}
          >
            <LinearGradient
              colors={["#FF8C4C", Colors.primary, "#E05020"]}
              style={bidStyles.bidBtnGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Ionicons name="flash" size={16} color="#fff" />
                  <Text style={bidStyles.bidBtnText}>Place Bid</Text>
                </>
              )}
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

interface AuctionCardProps {
  item: Auction;
  onPress: () => void;
}

const AuctionCard = memo(function AuctionCard({ item, onPress }: AuctionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.93 : 1 }]}
    >
      <View style={styles.cardImageWrap}>
        <Image source={{ uri: item.image }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
        <LinearGradient colors={["transparent", "rgba(0,0,0,0.75)"]} style={styles.cardImgGradient} />
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveBadgeText}>LIVE</Text>
        </View>
        <View style={styles.cardTimerOverlay}>
          <CountdownTimer endDate={item.auctionEnd} compact />
        </View>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.cardCategory}>{item.category}</Text>
        </View>
        <View style={styles.cardMeta}>
          <View style={styles.cardMetaItem}>
            <Ionicons name="calendar-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.cardMetaText}>{item.year}</Text>
          </View>
          <View style={styles.cardMetaItem}>
            <Ionicons name="speedometer-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.cardMetaText}>{(item.km / 1000).toFixed(0)}k km</Text>
          </View>
          <View style={styles.cardMetaItem}>
            <Ionicons name="location-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.cardMetaText}>{item.location}</Text>
          </View>
        </View>
        <View style={styles.cardBottom}>
          <View>
            <Text style={styles.bidLabel}>Current Bid</Text>
            <Text style={styles.bidValue}>{formatCurrency(item.currentBid)}</Text>
          </View>
          <View style={styles.bidsCountWrap}>
            <Ionicons name="people-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.bidsCount}>{item.bidCount} bids</Text>
          </View>
          <Pressable onPress={onPress} style={styles.bidNowBtn}>
            <LinearGradient
              colors={["#FF8C4C", Colors.primary]}
              style={styles.bidNowBtnGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="flash" size={14} color="#fff" />
              <Text style={styles.bidNowText}>Bid Now</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
});

export default function LiveScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [bidSheetVisible, setBidSheetVisible] = useState(false);
  const [subModalVisible, setSubModalVisible] = useState(false);
  const [localBids, setLocalBids] = useState<Record<string, number>>({});

  const { data, isLoading, refetch, isRefetching } = useQuery<{ success: boolean; data: { auctions: Auction[] } }>({
    queryKey: ["/api/user/live"],
    refetchInterval: 30000,
  });

  const auctions = (data?.data?.auctions ?? []).map((a) => ({
    ...a,
    currentBid: localBids[a.id] ?? a.currentBid,
  }));

  const handleBidPress = useCallback((auction: Auction) => {
    setSelectedAuction(auction);
    setBidSheetVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const handleBidSuccess = useCallback((auctionId: string, newBid: number) => {
    setLocalBids((prev) => ({ ...prev, [auctionId]: newBid }));
  }, []);

  const keyExtractor = useCallback((item: Auction) => item.id, []);
  const renderItem = useCallback(
    ({ item }: { item: Auction }) => (
      <AuctionCard item={item} onPress={() => handleBidPress(item)} />
    ),
    [handleBidPress],
  );

  const topPadding = insets.top + (insets.top < 20 ? 67 : 0);

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.pageTitle}>Live Auctions</Text>
          <Text style={styles.pageSubtitle}>{auctions.length} vehicles live now</Text>
        </View>
        <View style={styles.liveIndicator}>
          <View style={styles.livePulseDot} />
          <Text style={styles.liveIndicatorText}>LIVE</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading auctions...</Text>
        </View>
      ) : (
        <FlatList
          data={auctions}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isRefetching}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="flash-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No Live Auctions</Text>
              <Text style={styles.emptySubtitle}>Check back soon for upcoming auctions</Text>
            </View>
          }
        />
      )}

      <BidSheet
        auction={selectedAuction}
        visible={bidSheetVisible}
        onClose={() => setBidSheetVisible(false)}
        onBidSuccess={(newBid) => {
          if (selectedAuction) handleBidSuccess(selectedAuction.id, newBid);
        }}
      />

      <SubscriptionModal
        visible={subModalVisible}
        onClose={() => setSubModalVisible(false)}
        onSuccess={() => {
          setSubModalVisible(false);
          if (selectedAuction) setBidSheetVisible(true);
        }}
      />
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
  pageTitle: { fontSize: 24, fontFamily: "Urbanist_700Bold", color: Colors.text },
  pageSubtitle: { fontSize: 14, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary, marginTop: 2 },
  liveIndicator: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#EF444422", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: "#EF444444",
  },
  livePulseDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.danger },
  liveIndicatorText: { fontSize: 11, fontFamily: "Urbanist_700Bold", color: Colors.danger, letterSpacing: 0.5 },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 14, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary },
  list: { paddingHorizontal: 24, paddingBottom: 100, gap: 16 },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  cardImageWrap: { height: 180, position: "relative" },
  cardImgGradient: { ...StyleSheet.absoluteFillObject, top: "40%" },
  liveBadge: {
    position: "absolute", top: 12, left: 12,
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#EF444422", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: "#EF444466",
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.danger },
  liveBadgeText: { fontSize: 10, fontFamily: "Urbanist_700Bold", color: Colors.danger, letterSpacing: 0.5 },
  cardTimerOverlay: { position: "absolute", bottom: 12, right: 12 },
  cardBody: { padding: 16, gap: 10 },
  cardRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitle: { fontSize: 16, fontFamily: "Urbanist_700Bold", color: Colors.text, flex: 1, marginRight: 8 },
  cardCategory: {
    fontSize: 11, fontFamily: "Urbanist_600SemiBold", color: Colors.textSecondary,
    backgroundColor: Colors.surface, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  },
  cardMeta: { flexDirection: "row", gap: 16 },
  cardMetaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  cardMetaText: { fontSize: 12, fontFamily: "Urbanist_400Regular", color: Colors.textMuted },
  cardBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  bidLabel: { fontSize: 11, fontFamily: "Urbanist_400Regular", color: Colors.textMuted },
  bidValue: { fontSize: 18, fontFamily: "Urbanist_700Bold", color: Colors.primary },
  bidsCountWrap: { flexDirection: "row", alignItems: "center", gap: 4 },
  bidsCount: { fontSize: 13, fontFamily: "Urbanist_500Medium", color: Colors.textSecondary },
  bidNowBtn: { borderRadius: 10, overflow: "hidden" },
  bidNowBtnGrad: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 10 },
  bidNowText: { fontSize: 13, fontFamily: "Urbanist_700Bold", color: "#fff" },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 20, fontFamily: "Urbanist_700Bold", color: Colors.text },
  emptySubtitle: { fontSize: 14, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary, textAlign: "center" },
});

const bidStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  sheet: { backgroundColor: Colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, gap: 16, borderWidth: 1, borderColor: Colors.cardBorder },
  grabber: { width: 36, height: 4, backgroundColor: Colors.cardBorder, borderRadius: 2, alignSelf: "center", marginBottom: 8 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sheetTitle: { fontSize: 20, fontFamily: "Urbanist_700Bold", color: Colors.text },
  closeBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center", backgroundColor: Colors.surface, borderRadius: 10 },
  auctionInfo: { backgroundColor: Colors.surface, borderRadius: 14, padding: 14, gap: 10 },
  auctionTitle: { fontSize: 16, fontFamily: "Urbanist_600SemiBold", color: Colors.text },
  currentBidRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  currentBidLabel: { fontSize: 11, fontFamily: "Urbanist_400Regular", color: Colors.textMuted, marginBottom: 2 },
  currentBidValue: { fontSize: 22, fontFamily: "Urbanist_700Bold", color: Colors.primary },
  timerWrap: { alignItems: "flex-end", gap: 4 },
  timerLabel: { fontSize: 11, fontFamily: "Urbanist_400Regular", color: Colors.textMuted },
  minBidInfo: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#3B82F611", borderRadius: 10, padding: 10 },
  minBidText: { fontSize: 13, fontFamily: "Urbanist_500Medium", color: Colors.textSecondary },
  quickBids: { flexDirection: "row", gap: 10 },
  quickBidBtn: { flex: 1, backgroundColor: Colors.surface, borderRadius: 10, borderWidth: 1, borderColor: Colors.cardBorder, alignItems: "center", paddingVertical: 10 },
  quickBidText: { fontSize: 13, fontFamily: "Urbanist_700Bold", color: Colors.primary },
  inputWrap: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.inputBg, borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 14, paddingHorizontal: 16, height: 54 },
  inputSymbol: { fontSize: 18, fontFamily: "Urbanist_700Bold", color: Colors.textSecondary, marginRight: 6 },
  input: { flex: 1, fontSize: 22, fontFamily: "Urbanist_700Bold", color: Colors.text },
  bidBtn: { borderRadius: 14, overflow: "hidden" },
  bidBtnGrad: { height: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  bidBtnText: { fontSize: 16, fontFamily: "Urbanist_700Bold", color: "#fff" },
});
