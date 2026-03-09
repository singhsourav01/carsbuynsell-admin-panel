import React, { useState, useCallback, useEffect, useRef, memo } from "react";
import {
  View, Text, FlatList, Pressable, StyleSheet, Modal,
  TextInput, ActivityIndicator, Alert, RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { CountdownTimer } from "@/components/CountdownTimer";
import { SubscriptionModal } from "@/components/SubscriptionModal";
import { formatCurrency } from "@/utils/formatters";
import { apiRequestDirect } from "@/lib/auth";

function BidSheet({ auction, visible, onClose, onBidSuccess }: { auction: any | null; visible: boolean; onClose: () => void; onBidSuccess: (bid: number) => void }) {
  const [bidAmount, setBidAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const lastBidTime = useRef(0);
  if (!auction) return null;

  const currentBid = Number(auction.lst_current_bid || auction.lst_price || 0);
  const minIncrement = Number(auction.lst_min_increment || 1);
  const minBid = currentBid + minIncrement;

  const handleBid = async () => {
    const now = Date.now();
    if (now - lastBidTime.current < 2000) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); return; }
    const amount = parseInt(bidAmount.replace(/,/g, ""), 10);
    if (isNaN(amount) || amount < minBid) { Alert.alert("Invalid Bid", `Minimum bid is ${formatCurrency(minBid)}`); return; }
    lastBidTime.current = now;
    setLoading(true);
    try {
      const res = await apiRequestDirect("POST", `http://192.168.1.102:8002/user/listings/${auction.lst_id}/bid`, { bidAmount: amount }, true);
      const rawText = await res.text();
      let data: any = {};
      try { data = JSON.parse(rawText); } catch { data = {}; }
      if (res.ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onBidSuccess(amount); onClose(); setBidAmount("");
      } else {
        Alert.alert("Error", data?.message || "Failed to place bid.");
      }
    } catch { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); }
    finally { setLoading(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={bidS.overlay}>
        <View style={bidS.sheet}>
          <View style={bidS.grabber} />
          <View style={bidS.header}>
            <Text style={bidS.title}>Place Bid</Text>
            <Pressable onPress={onClose} style={bidS.closeBtn}><Ionicons name="close" size={20} color={Colors.textSecondary} /></Pressable>
          </View>
          <View style={bidS.auctionInfo}>
            <Text style={bidS.auctionTitle} numberOfLines={1}>{auction.lst_title}</Text>
            <View style={bidS.bidRow}>
              <View><Text style={bidS.bidLabel}>Current Bid</Text><Text style={bidS.bidValue}>{formatCurrency(currentBid)}</Text></View>
              {auction.lst_auction_end && <CountdownTimer endDate={auction.lst_auction_end} compact />}
            </View>
          </View>
          <View style={bidS.minInfo}><Ionicons name="information-circle-outline" size={13} color={Colors.info} /><Text style={bidS.minText}>Min: {formatCurrency(minBid)}</Text></View>
          <View style={bidS.quickRow}>
            {[1, 2, 3].map(m => (
              <Pressable key={m} onPress={() => { setBidAmount(String(currentBid + minIncrement * m)); Haptics.selectionAsync(); }} style={bidS.quickBtn}>
                <Text style={bidS.quickText}>+{formatCurrency(minIncrement * m)}</Text>
              </Pressable>
            ))}
          </View>
          <View style={bidS.inputWrap}>
            <Text style={bidS.rupee}>₹</Text>
            <TextInput style={bidS.input} value={bidAmount} onChangeText={setBidAmount} placeholder={String(minBid)} placeholderTextColor={Colors.textMuted} keyboardType="numeric" returnKeyType="done" />
          </View>
          <Pressable style={({ pressed }) => [bidS.bidBtn, { opacity: pressed ? 0.85 : 1 }]} onPress={handleBid} disabled={loading}>
            <LinearGradient colors={[Colors.heroLight, Colors.hero]} style={bidS.bidBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {loading ? <ActivityIndicator color="#fff" /> : <><Ionicons name="flash" size={16} color="#fff" /><Text style={bidS.bidBtnText}>Place Bid</Text></>}
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const AuctionCard = memo(function AuctionCard({ item, onPress }: { item: any; onPress: () => void }) {
  const imageUri = item.images?.[0]?.url || item.images?.[0]?.file_url;
  const currentBid = Number(item.lst_current_bid || item.lst_price || 0);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, { opacity: pressed ? 0.95 : 1 }]}>
      <View style={styles.imgWrap}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
        ) : (
          <LinearGradient colors={[Colors.hero, Colors.heroDark]} style={StyleSheet.absoluteFill} />
        )}
        <LinearGradient colors={["transparent", "rgba(0,0,0,0.6)"]} style={styles.imgGrad} />
        <View style={styles.liveBadge}><View style={styles.liveDot} /><Text style={styles.liveBadgeText}>LIVE</Text></View>
        {item.lst_auction_end && <View style={styles.timerWrap}><CountdownTimer endDate={item.lst_auction_end} compact /></View>}
      </View>
      <View style={styles.cardBody}>
        <View style={styles.titleRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.lst_title}</Text>
          {item.category?.cat_name && <View style={styles.catTag}><Text style={styles.catTagText}>{item.category.cat_name}</Text></View>}
        </View>
        <View style={styles.metaRow}>
          {item.seller?.user_full_name && <View style={styles.metaItem}><Ionicons name="person-outline" size={12} color={Colors.textMuted} /><Text style={styles.metaText}>{item.seller.user_full_name}</Text></View>}
          {item.lst_bid_count > 0 && <View style={styles.metaItem}><Ionicons name="people-outline" size={12} color={Colors.textMuted} /><Text style={styles.metaText}>{item.lst_bid_count} bids</Text></View>}
        </View>
        <View style={styles.bottomRow}>
          <View><Text style={styles.bidLabel}>Current Bid</Text><Text style={styles.bidValue}>{formatCurrency(currentBid)}</Text></View>
          <Pressable onPress={onPress} style={styles.bidNowBtn}><LinearGradient colors={[Colors.heroLight, Colors.hero]} style={styles.bidNowGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}><Ionicons name="flash" size={13} color="#fff" /><Text style={styles.bidNowText}>Bid Now</Text></LinearGradient></Pressable>
        </View>
      </View>
    </Pressable>
  );
});

export default function LiveScreen() {
  const insets = useSafeAreaInsets();
  const [selectedAuction, setSelectedAuction] = useState<any>(null);
  const [bidVisible, setBidVisible] = useState(false);
  const [subVisible, setSubVisible] = useState(false);
  const [localBids, setLocalBids] = useState<Record<string, number>>({});
  const topPad = insets.top + (insets.top < 20 ? 67 : 0);

  // API data
  const [auctions, setAuctions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAuctions = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    try {
      const res = await apiRequestDirect("GET", "http://192.168.1.102:8002/user/listings?type=AUCTION");
      const rawText = await res.text();
      let data: any = {};
      try { data = JSON.parse(rawText); } catch { data = {}; }
      if (res.ok) {
        const items = data?.data?.data || data?.data?.listings || (Array.isArray(data?.data) ? data.data : []);
        setAuctions(items);
      }
    } catch { /* ignore */ }
    finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAuctions(); }, [fetchAuctions]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => fetchAuctions(), 30000);
    return () => clearInterval(interval);
  }, [fetchAuctions]);

  const handleRefresh = useCallback(() => { fetchAuctions(true); }, [fetchAuctions]);

  // Apply local bid overrides
  const displayAuctions = auctions.map(a => ({
    ...a,
    lst_current_bid: localBids[a.lst_id] ?? a.lst_current_bid,
  }));

  const handlePress = useCallback((a: any) => { router.push(`/listing/${a.lst_id}` as any); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }, []);
  const keyExtractor = useCallback((item: any) => item.lst_id, []);
  const renderItem = useCallback(({ item }: { item: any }) => <AuctionCard item={item} onPress={() => handlePress(item)} />, [handlePress]);

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.pageTitle}>Live Auctions</Text>
          <Text style={styles.pageSub}>{displayAuctions.length} auction{displayAuctions.length !== 1 ? "s" : ""} live now</Text>
        </View>
        <View style={styles.liveIndicator}><View style={styles.livePulse} /><Text style={styles.liveText}>LIVE</Text></View>
      </View>
      {isLoading ? <View style={styles.loadWrap}><ActivityIndicator size="large" color={Colors.primary} /></View> : (
        <FlatList data={displayAuctions} renderItem={renderItem} keyExtractor={keyExtractor}
          contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />}
          ListEmptyComponent={<View style={styles.empty}><Ionicons name="flash-outline" size={48} color={Colors.textMuted} /><Text style={styles.emptyTitle}>No Live Auctions</Text><Text style={styles.emptySub}>Check back soon</Text></View>}
        />
      )}
      <BidSheet auction={selectedAuction} visible={bidVisible} onClose={() => setBidVisible(false)} onBidSuccess={(bid) => { if (selectedAuction) setLocalBids(p => ({ ...p, [selectedAuction.lst_id]: bid })); }} />
      <SubscriptionModal visible={subVisible} onClose={() => setSubVisible(false)} onSuccess={() => { setSubVisible(false); if (selectedAuction) setBidVisible(true); }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 16 },
  pageTitle: { fontSize: 24, fontFamily: "Urbanist_700Bold", color: Colors.text },
  pageSub: { fontSize: 13, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary, marginTop: 2 },
  liveIndicator: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FEF2F2", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: "#FECACA" },
  livePulse: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.danger },
  liveText: { fontSize: 11, fontFamily: "Urbanist_700Bold", color: Colors.danger, letterSpacing: 0.5 },
  loadWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { paddingHorizontal: 16, paddingBottom: 100, gap: 16 },
  card: { backgroundColor: Colors.card, borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: Colors.cardBorder, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  imgWrap: { height: 170, position: "relative" },
  imgGrad: { ...StyleSheet.absoluteFillObject, top: "40%" },
  liveBadge: { position: "absolute", top: 12, left: 12, flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#FEF2F2", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: "#FECACA" },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.danger },
  liveBadgeText: { fontSize: 10, fontFamily: "Urbanist_700Bold", color: Colors.danger, letterSpacing: 0.5 },
  timerWrap: { position: "absolute", bottom: 12, right: 12 },
  cardBody: { padding: 16, gap: 10 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitle: { flex: 1, fontSize: 16, fontFamily: "Urbanist_700Bold", color: Colors.text, marginRight: 8 },
  catTag: { backgroundColor: Colors.primaryLight, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  catTagText: { fontSize: 11, fontFamily: "Urbanist_600SemiBold", color: Colors.primary },
  metaRow: { flexDirection: "row", gap: 16 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, fontFamily: "Urbanist_400Regular", color: Colors.textMuted },
  bottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  bidLabel: { fontSize: 11, fontFamily: "Urbanist_400Regular", color: Colors.textMuted },
  bidValue: { fontSize: 18, fontFamily: "Urbanist_700Bold", color: Colors.primary },
  bidNowBtn: { borderRadius: 10, overflow: "hidden" },
  bidNowGrad: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 10 },
  bidNowText: { fontSize: 13, fontFamily: "Urbanist_700Bold", color: "#fff" },
  empty: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 20, fontFamily: "Urbanist_700Bold", color: Colors.text },
  emptySub: { fontSize: 14, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary },
});

const bidS = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { backgroundColor: Colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, gap: 16, borderWidth: 1, borderColor: Colors.cardBorder },
  grabber: { width: 36, height: 4, backgroundColor: Colors.cardBorder, borderRadius: 2, alignSelf: "center", marginBottom: 8 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 20, fontFamily: "Urbanist_700Bold", color: Colors.text },
  closeBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center", backgroundColor: Colors.surface, borderRadius: 10 },
  auctionInfo: { backgroundColor: Colors.surface, borderRadius: 14, padding: 14, gap: 10 },
  auctionTitle: { fontSize: 16, fontFamily: "Urbanist_600SemiBold", color: Colors.text },
  bidRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  bidLabel: { fontSize: 11, fontFamily: "Urbanist_400Regular", color: Colors.textMuted, marginBottom: 2 },
  bidValue: { fontSize: 22, fontFamily: "Urbanist_700Bold", color: Colors.primary },
  minInfo: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#EFF6FF", borderRadius: 10, padding: 10 },
  minText: { fontSize: 13, fontFamily: "Urbanist_500Medium", color: Colors.textSecondary },
  quickRow: { flexDirection: "row", gap: 10 },
  quickBtn: { flex: 1, backgroundColor: Colors.primaryLight, borderRadius: 10, borderWidth: 1, borderColor: Colors.primary + "33", alignItems: "center", paddingVertical: 10 },
  quickText: { fontSize: 12, fontFamily: "Urbanist_700Bold", color: Colors.primary },
  inputWrap: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.inputBg, borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 14, paddingHorizontal: 16, height: 54 },
  rupee: { fontSize: 18, fontFamily: "Urbanist_700Bold", color: Colors.textSecondary, marginRight: 6 },
  input: { flex: 1, fontSize: 22, fontFamily: "Urbanist_700Bold", color: Colors.text },
  bidBtn: { borderRadius: 14, overflow: "hidden" },
  bidBtnGrad: { height: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  bidBtnText: { fontSize: 16, fontFamily: "Urbanist_700Bold", color: "#fff" },
});
