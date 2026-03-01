import React, { memo } from "react";
import { View, Text, Pressable, StyleSheet, Dimensions } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@/constants/colors";
import { formatCurrency } from "@/utils/formatters";
import { CountdownTimer } from "./CountdownTimer";

const { width } = Dimensions.get("window");

interface VehicleCardProps {
  item: {
    id: string;
    title: string;
    type: "AUCTION" | "BUY_NOW";
    currentBid?: number;
    price?: number;
    image: string;
    auctionEnd?: string;
    bidCount?: number;
  };
  onPress: () => void;
  size?: "small" | "medium" | "large";
}

export const VehicleCard = memo(function VehicleCard({ item, onPress, size = "medium" }: VehicleCardProps) {
  const isAuction = item.type === "AUCTION";
  const displayPrice = isAuction ? item.currentBid ?? 0 : item.price ?? 0;
  const cardWidth = size === "large" ? width - 48 : size === "small" ? 160 : (width - 48) / 2;
  const imageHeight = size === "large" ? 180 : size === "small" ? 100 : 120;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, { width: cardWidth, opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}
    >
      <View style={[styles.imageWrap, { height: imageHeight }]}>
        <Image
          source={{ uri: item.image }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={300}
        />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.7)"]}
          style={styles.imgGradient}
        />
        <View style={styles.typeBadge}>
          <Ionicons
            name={isAuction ? "flash" : "pricetag"}
            size={10}
            color={isAuction ? Colors.primary : Colors.success}
          />
          <Text style={[styles.typeBadgeText, { color: isAuction ? Colors.primary : Colors.success }]}>
            {isAuction ? "LIVE" : "BUY NOW"}
          </Text>
        </View>
        {isAuction && item.auctionEnd && size !== "small" && (
          <View style={styles.timerOverlay}>
            <CountdownTimer endDate={item.auctionEnd} compact />
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
        <View style={styles.priceRow}>
          <View>
            <Text style={styles.priceLabel}>{isAuction ? "Current Bid" : "Price"}</Text>
            <Text style={styles.price}>{formatCurrency(displayPrice)}</Text>
          </View>
          {isAuction && item.bidCount !== undefined && (
            <View style={styles.bidsBadge}>
              <Ionicons name="people" size={11} color={Colors.textMuted} />
              <Text style={styles.bidsText}>{item.bidCount}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  imageWrap: { position: "relative", overflow: "hidden" },
  imgGradient: { ...StyleSheet.absoluteFillObject, top: "40%" },
  typeBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  typeBadgeText: { fontSize: 9, fontFamily: "Urbanist_700Bold", letterSpacing: 0.5 },
  timerOverlay: { position: "absolute", bottom: 8, left: 8 },
  info: { padding: 12, gap: 6 },
  title: { fontSize: 13, fontFamily: "Urbanist_600SemiBold", color: Colors.text },
  priceRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  priceLabel: { fontSize: 10, fontFamily: "Urbanist_400Regular", color: Colors.textMuted, marginBottom: 2 },
  price: { fontSize: 15, fontFamily: "Urbanist_700Bold", color: Colors.primary },
  bidsBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Colors.surface, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  bidsText: { fontSize: 12, fontFamily: "Urbanist_600SemiBold", color: Colors.textSecondary },
});
