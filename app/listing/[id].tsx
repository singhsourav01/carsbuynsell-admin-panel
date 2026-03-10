import React, { useState, useCallback, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    Pressable,
    StyleSheet,
    Dimensions,
    ActivityIndicator,
    Alert,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { formatCurrency } from "@/utils/formatters";
import { CountdownTimer } from "@/components/CountdownTimer";
import { apiRequestDirect, getToken } from "@/lib/auth";
import { SubscriptionModal } from "@/components/SubscriptionModal";

const { width } = Dimensions.get("window");

export default function ListingDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const insets = useSafeAreaInsets();

    const [listing, setListing] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeImageIdx, setActiveImageIdx] = useState(0);
    const [subVisible, setSubVisible] = useState(false);
    const [pendingAction, setPendingAction] = useState<"bid" | "buy" | null>(null);
    const [bids, setBids] = useState<any[]>([]);

    const fetchListing = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Fetch listing details and bids concurrently
            const [listingRes, bidsRes] = await Promise.all([
                apiRequestDirect("GET", `http://169.254.61.129:8002/user/listings/${id}`),
                apiRequestDirect("GET", `http://169.254.61.129:8002/user/listings/${id}/bids`)
            ]);

            const listingRaw = await listingRes.text();
            let listingData: any = {};
            try { listingData = JSON.parse(listingRaw); } catch { listingData = {}; }

            if (listingRes.ok && listingData?.data) {
                setListing(listingData.data);
            } else {
                setError(listingData?.message || "Failed to load listing");
            }

            if (listingData?.data?.lst_type === "AUCTION" && bidsRes.ok) {
                const bidsRaw = await bidsRes.text();
                let bidsData: any = {};
                try { bidsData = JSON.parse(bidsRaw); } catch { bidsData = {}; }
                if (bidsData?.data) {
                    setBids(bidsData.data);
                }
            }
        } catch {
            setError("Network error. Please check your connection.");
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => { fetchListing(); }, [fetchListing]);

    async function handleBuyNow() {
        const token = await getToken();
        if (!token) {
            Alert.alert("Login Required", "Please log in to purchase this vehicle.");
            return;
        }
        try {
            const res = await apiRequestDirect(
                "POST",
                `http://169.254.61.129 :8002/user/listings/${id}/buy`,
                {},
                true,
            );
            const rawText = await res.text();
            let data: any = {};
            try { data = JSON.parse(rawText); } catch { data = {}; }
            if (res.ok) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert("Purchase Successful!", data?.message || "You have successfully purchased this vehicle.");
            } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                Alert.alert("Purchase Failed", data?.message || "Something went wrong. Please try again.");
            }
        } catch (err) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert("Network Error", "Please check your connection and try again.");
        }
    }

    function handleActionPress(action: "bid" | "buy") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setPendingAction(action);
        setSubVisible(true);
    }


    const isAuction = listing?.lst_type === "AUCTION";
    const images = listing?.images || [];
    const hasImages = images.length > 0;

    if (isLoading) {
        return (
            <View style={[s.center, { paddingTop: insets.top }]}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={s.loadingText}>Loading listing...</Text>
            </View>
        );
    }

    if (error || !listing) {
        return (
            <View style={[s.center, { paddingTop: insets.top }]}>
                <Ionicons name="alert-circle-outline" size={56} color={Colors.danger} />
                <Text style={s.errorTitle}>Something went wrong</Text>
                <Text style={s.errorMsg}>{error || "Listing not found"}</Text>
                <Pressable onPress={fetchListing} style={s.retryBtn}>
                    <Text style={s.retryText}>Retry</Text>
                </Pressable>
                <Pressable onPress={() => router.back()} style={s.backLink}>
                    <Text style={s.backLinkText}>Go Back</Text>
                </Pressable>
            </View>
        );
    }

    const currentPrice = isAuction
        ? Number(listing.lst_current_bid || listing.lst_price || 0)
        : Number(listing.lst_price || 0);

    const specs = [
        { icon: "pricetag-outline", label: "Category", val: listing.category?.cat_name || "—" },
        { icon: "person-outline", label: "Seller", val: listing.seller?.user_full_name || "—" },
        { icon: "eye-outline", label: "Views", val: String(listing.lst_view_count || 0) },
        { icon: "people-outline", label: "Bids", val: String(listing.lst_bid_count || 0) },
        { icon: "calendar-outline", label: "Listed", val: listing.lst_created_at ? new Date(listing.lst_created_at).toLocaleDateString("en-IN") : "—" },
        { icon: "checkmark-circle-outline", label: "Status", val: listing.lst_status || "—" },
    ];

    return (
        <View style={s.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
                {/* Image Section */}
                <View style={s.imageSection}>
                    {hasImages ? (
                        <ScrollView
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            onMomentumScrollEnd={(e) => {
                                const idx = Math.round(e.nativeEvent.contentOffset.x / width);
                                setActiveImageIdx(idx);
                            }}
                        >
                            {images.map((img: any, i: number) => (
                                <Image
                                    key={i}
                                    source={{ uri: img.url || img.file_url }}
                                    style={{ width, height: 320 }}
                                    contentFit="cover"
                                    transition={300}
                                />
                            ))}
                        </ScrollView>
                    ) : (
                        <LinearGradient colors={[Colors.hero, Colors.heroDark]} style={s.imagePlaceholder}>
                            <Ionicons name="car-sport-outline" size={64} color="rgba(255,255,255,0.4)" />
                            <Text style={s.noImageText}>No Image Available</Text>
                        </LinearGradient>
                    )}
                    <LinearGradient colors={["rgba(0,0,0,0.5)", "transparent"]} style={s.topGradient} />

                    {/* Back Button */}
                    <Pressable
                        onPress={() => { router.back(); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                        style={[s.backBtn, { top: insets.top + 8 }]}
                    >
                        <Ionicons name="arrow-back" size={22} color="#fff" />
                    </Pressable>

                    {/* Type Badge */}
                    <View style={[s.typeBadge, { top: insets.top + 8 }]}>
                        <View style={[s.typeDot, { backgroundColor: isAuction ? Colors.danger : Colors.success }]} />
                        <Text style={[s.typeBadgeText, { color: isAuction ? Colors.danger : Colors.success }]}>
                            {isAuction ? "LIVE AUCTION" : "BUY NOW"}
                        </Text>
                    </View>

                    {/* Image Dots */}
                    {images.length > 1 && (
                        <View style={s.dotsRow}>
                            {images.map((_: any, i: number) => (
                                <View key={i} style={[s.dot, i === activeImageIdx && s.dotActive]} />
                            ))}
                        </View>
                    )}
                </View>

                {/* Content */}
                <View style={s.content}>
                    {/* Title + Price Card */}
                    <View style={s.titleCard}>
                        {listing.category?.cat_name && (
                            <View style={s.catBadge}>
                                <Text style={s.catBadgeText}>{listing.category.cat_name}</Text>
                            </View>
                        )}
                        <Text style={s.title}>{listing.lst_title}</Text>

                        <View style={s.priceSection}>
                            <View>
                                <Text style={s.priceLabel}>{isAuction ? "Current Bid" : "Price"}</Text>
                                <Text style={s.priceValue}>{formatCurrency(currentPrice)}</Text>
                            </View>
                            {isAuction && listing.lst_auction_end && (
                                <View style={s.timerWrap}>
                                    <Text style={s.timerLabel}>Ends In</Text>
                                    <CountdownTimer endDate={listing.lst_auction_end} compact />
                                </View>
                            )}
                        </View>

                        {isAuction && (
                            <View style={s.minBidRow}>
                                <Ionicons name="information-circle-outline" size={14} color={Colors.info} />
                                <Text style={s.minBidText}>
                                    Min increment: {formatCurrency(Number(listing.lst_min_increment || 1))}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Seller Card */}
                    <View style={s.sellerCard}>
                        <View style={s.sellerAvatar}>
                            <Ionicons name="person" size={22} color={Colors.primary} />
                        </View>
                        <View style={s.sellerInfo}>
                            <Text style={s.sellerLabel}>Seller</Text>
                            <Text style={s.sellerName}>{listing.seller?.user_full_name || "Unknown"}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                    </View>

                    {/* Description */}
                    {listing.lst_description ? (
                        <View style={s.descCard}>
                            <Text style={s.sectionTitle}>Description</Text>
                            <Text style={s.descText}>{listing.lst_description}</Text>
                        </View>
                    ) : null}

                    {/* Specs Grid */}
                    <View style={s.specsCard}>
                        <Text style={s.sectionTitle}>Details</Text>
                        <View style={s.specsGrid}>
                            {specs.map((spec) => (
                                <View key={spec.label} style={s.specItem}>
                                    <View style={s.specIconWrap}>
                                        <Ionicons name={spec.icon as any} size={18} color={Colors.primary} />
                                    </View>
                                    <Text style={s.specLabel}>{spec.label}</Text>
                                    <Text style={s.specVal}>{spec.val}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Auction End Date */}
                    {isAuction && listing.lst_auction_end && (
                        <View style={s.infoCard}>
                            <Ionicons name="time-outline" size={20} color={Colors.warning} />
                            <View style={{ flex: 1 }}>
                                <Text style={s.infoLabel}>Auction Ends</Text>
                                <Text style={s.infoValue}>
                                    {new Date(listing.lst_auction_end).toLocaleString("en-IN", {
                                        dateStyle: "medium",
                                        timeStyle: "short",
                                    })}
                                </Text>
                            </View>
                        </View>
                    )}
                </View>
                {/* Bid History */}
                {isAuction && bids.length > 0 && (
                    <View style={s.bidsCard}>
                        <Text style={s.sectionTitle}>Bid History</Text>
                        <View style={s.bidsList}>
                            {bids.map((bid: any, idx) => (
                                <View key={bid.bid_id || idx} style={s.bidItem}>
                                    <View style={s.bidderInfo}>
                                        <View style={s.bidderAvatar}>
                                            <Ionicons name="person" size={16} color={Colors.primary} />
                                        </View>
                                        <View>
                                            <Text style={s.bidderName}>{bid.user?.user_full_name || "Unknown Bidder"}</Text>
                                            <Text style={s.bidTime}>
                                                {new Date(bid.bid_time || bid.created_at || new Date()).toLocaleString("en-IN", {
                                                    dateStyle: "short",
                                                    timeStyle: "short"
                                                })}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={s.bidAmount}>{formatCurrency(Number(bid.bid_amount || 0))}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Bottom Action Bar */}
            <View style={[s.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                <View style={s.bottomPrice}>
                    <Text style={s.bottomPriceLabel}>{isAuction ? "Current Bid" : "Price"}</Text>
                    <Text style={s.bottomPriceValue}>{formatCurrency(currentPrice)}</Text>
                </View>
                <Pressable
                    style={({ pressed }) => [s.actionBtn, { opacity: pressed ? 0.85 : 1 }]}
                    onPress={() => handleActionPress(isAuction ? "bid" : "buy")}
                >
                    <LinearGradient
                        colors={isAuction ? ["#FF6B6B", Colors.danger] : [Colors.heroLight, Colors.hero]}
                        style={s.actionBtnGrad}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Ionicons name={isAuction ? "flash" : "pricetag"} size={18} color="#fff" />
                        <Text style={s.actionBtnText}>
                            {isAuction ? "Place Bid" : `Buy Now · ${formatCurrency(currentPrice)}`}
                        </Text>
                    </LinearGradient>
                </Pressable>
            </View>

            <SubscriptionModal
                visible={subVisible}
                onClose={() => { setSubVisible(false); setPendingAction(null); }}
                onSuccess={() => {
                    setSubVisible(false);
                    if (pendingAction === "buy") handleBuyNow();
                    else if (pendingAction === "bid") Alert.alert("Place a Bid", "Bidding coming soon.");
                    setPendingAction(null);
                }}
            />
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    center: { flex: 1, backgroundColor: Colors.background, alignItems: "center", justifyContent: "center", gap: 12 },
    loadingText: { fontSize: 14, fontFamily: "Urbanist_500Medium", color: Colors.textSecondary, marginTop: 8 },
    errorTitle: { fontSize: 20, fontFamily: "Urbanist_700Bold", color: Colors.text, marginTop: 12 },
    errorMsg: { fontSize: 14, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary, textAlign: "center", paddingHorizontal: 40 },
    retryBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 32, paddingVertical: 12, marginTop: 8 },
    retryText: { fontSize: 15, fontFamily: "Urbanist_700Bold", color: "#fff" },
    backLink: { marginTop: 4 },
    backLinkText: { fontSize: 14, fontFamily: "Urbanist_600SemiBold", color: Colors.primary },

    // Image Section
    imageSection: { height: 320, position: "relative", backgroundColor: Colors.surface },
    imagePlaceholder: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center", gap: 8 },
    noImageText: { fontSize: 14, fontFamily: "Urbanist_500Medium", color: "rgba(255,255,255,0.6)" },
    topGradient: { position: "absolute", top: 0, left: 0, right: 0, height: 100 },
    backBtn: {
        position: "absolute", left: 16,
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center",
    },
    typeBadge: {
        position: "absolute", right: 16,
        flexDirection: "row", alignItems: "center", gap: 5,
        backgroundColor: "rgba(255,255,255,0.95)", borderRadius: 10,
        paddingHorizontal: 12, paddingVertical: 6,
        shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
    },
    typeDot: { width: 7, height: 7, borderRadius: 4 },
    typeBadgeText: { fontSize: 11, fontFamily: "Urbanist_700Bold", letterSpacing: 0.5 },
    dotsRow: { position: "absolute", bottom: 14, alignSelf: "center", flexDirection: "row", gap: 6 },
    dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.5)" },
    dotActive: { width: 20, backgroundColor: "#fff" },

    // Content
    content: { padding: 16, gap: 14, marginTop: -20 },
    titleCard: {
        backgroundColor: Colors.card, borderRadius: 20, padding: 20, gap: 12,
        shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
        borderWidth: 1, borderColor: Colors.cardBorder,
    },
    catBadge: { alignSelf: "flex-start", backgroundColor: Colors.primaryLight, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5 },
    catBadgeText: { fontSize: 12, fontFamily: "Urbanist_600SemiBold", color: Colors.primary },
    title: { fontSize: 22, fontFamily: "Urbanist_700Bold", color: Colors.text, lineHeight: 28 },
    priceSection: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
    priceLabel: { fontSize: 12, fontFamily: "Urbanist_400Regular", color: Colors.textMuted, marginBottom: 2 },
    priceValue: { fontSize: 28, fontFamily: "Urbanist_700Bold", color: Colors.primary },
    timerWrap: { alignItems: "flex-end", gap: 2 },
    timerLabel: { fontSize: 11, fontFamily: "Urbanist_400Regular", color: Colors.textMuted },
    minBidRow: {
        flexDirection: "row", alignItems: "center", gap: 6,
        backgroundColor: "#EFF6FF", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    },
    minBidText: { fontSize: 13, fontFamily: "Urbanist_500Medium", color: Colors.textSecondary },

    // Seller
    sellerCard: {
        flexDirection: "row", alignItems: "center", gap: 14,
        backgroundColor: Colors.card, borderRadius: 16, padding: 16,
        borderWidth: 1, borderColor: Colors.cardBorder,
    },
    sellerAvatar: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: Colors.primaryLight, alignItems: "center", justifyContent: "center",
    },
    sellerInfo: { flex: 1, gap: 2 },
    sellerLabel: { fontSize: 11, fontFamily: "Urbanist_400Regular", color: Colors.textMuted },
    sellerName: { fontSize: 16, fontFamily: "Urbanist_700Bold", color: Colors.text },

    // Description
    descCard: {
        backgroundColor: Colors.card, borderRadius: 16, padding: 18, gap: 10,
        borderWidth: 1, borderColor: Colors.cardBorder,
    },
    sectionTitle: { fontSize: 16, fontFamily: "Urbanist_700Bold", color: Colors.text },
    descText: { fontSize: 14, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary, lineHeight: 22 },

    // Specs
    specsCard: {
        backgroundColor: Colors.card, borderRadius: 16, padding: 18, gap: 14,
        borderWidth: 1, borderColor: Colors.cardBorder,
    },
    specsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    specItem: {
        width: (width - 32 - 36 - 10) / 3,
        backgroundColor: Colors.surface, borderRadius: 14, padding: 12, alignItems: "center", gap: 6,
    },
    specIconWrap: {
        width: 36, height: 36, borderRadius: 12,
        backgroundColor: Colors.primaryLight, alignItems: "center", justifyContent: "center",
    },
    specLabel: { fontSize: 10, fontFamily: "Urbanist_400Regular", color: Colors.textMuted },
    specVal: { fontSize: 13, fontFamily: "Urbanist_700Bold", color: Colors.text, textAlign: "center" },

    // Info Card
    infoCard: {
        flexDirection: "row", alignItems: "center", gap: 12,
        backgroundColor: "#FFFBEB", borderRadius: 14, padding: 14,
        borderWidth: 1, borderColor: "#FEF3C7",
    },
    infoLabel: { fontSize: 11, fontFamily: "Urbanist_400Regular", color: Colors.textMuted },
    infoValue: { fontSize: 13, color: Colors.textMuted, marginTop: 4, fontFamily: "Inter-Medium" },
    bidsCard: { paddingHorizontal: 20, marginTop: 16, marginBottom: 20 },
    bidsList: {
        backgroundColor: Colors.card,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
    },
    bidItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.cardBorder,
    },
    bidderInfo: { flexDirection: "row", alignItems: "center", gap: 12 },
    bidderAvatar: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: Colors.primaryLight,
        justifyContent: "center", alignItems: "center",
        borderWidth: 1, borderColor: "rgba(0,186,180,0.2)"
    },
    bidderName: { color: Colors.text, fontSize: 14, fontFamily: "Urbanist_600SemiBold" },
    bidTime: { color: Colors.textMuted, fontSize: 12, marginTop: 2, fontFamily: "Urbanist_400Regular" },
    bidAmount: { color: Colors.success, fontSize: 15, fontFamily: "Urbanist_700Bold" },

    // Bottom Bar
    bottomBar: {
        position: "absolute", bottom: 0, left: 0, right: 0,
        flexDirection: "row", alignItems: "center", gap: 16,
        backgroundColor: Colors.card, paddingHorizontal: 20, paddingTop: 16,
        borderTopWidth: 1, borderTopColor: Colors.cardBorder,
        shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 8,
    },
    bottomPrice: { flex: 1 },
    bottomPriceLabel: { fontSize: 11, fontFamily: "Urbanist_400Regular", color: Colors.textMuted },
    bottomPriceValue: { fontSize: 22, fontFamily: "Urbanist_700Bold", color: Colors.primary },
    actionBtn: { flex: 1, borderRadius: 14, overflow: "hidden" },
    actionBtnGrad: { height: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
    actionBtnText: { fontSize: 15, fontFamily: "Urbanist_700Bold", color: "#fff" },
}); 
