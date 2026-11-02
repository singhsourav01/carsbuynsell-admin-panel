import React, { useEffect, useState } from "react";
import { Modal, View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@/constants/colors";

interface Props {
  visible: boolean;
  title?: string;
  priceLabel?: string;
  loading?: boolean;
  onCancel: () => void;
  onBuy: () => void;
}

/**
 * Two-step purchase confirmation.
 * Step 1: "Are you sure you want to buy the vehicle?" — Yes / Cancel.
 * Step 2 (after Yes): the Buy Now button is shown so the user can continue the purchase.
 */
export function BuyConfirmModal({ visible, title, priceLabel, loading, onCancel, onBuy }: Props) {
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!visible) setConfirmed(false);
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={s.backdrop}>
        <View style={s.card}>
          <View style={s.iconWrap}>
            <Ionicons name={confirmed ? "pricetag" : "help-circle"} size={30} color={Colors.hero} />
          </View>
          {!!title && <Text style={s.vehicle} numberOfLines={2}>{title}</Text>}
          {!!priceLabel && <Text style={s.price}>{priceLabel}</Text>}

          {!confirmed ? (
            <>
              <Text style={s.question}>Are you sure you want to buy the vehicle?</Text>
              <View style={s.row}>
                <Pressable style={[s.btn, s.cancelBtn]} onPress={onCancel}>
                  <Text style={s.cancelText}>Cancel</Text>
                </Pressable>
                <Pressable style={[s.btn, s.yesBtn]} onPress={() => setConfirmed(true)}>
                  <Text style={s.yesText}>Yes</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <Text style={s.question}>Tap Buy Now to continue your purchase.</Text>
              <Pressable
                style={({ pressed }) => [s.buyWrap, { opacity: pressed || loading ? 0.85 : 1 }]}
                onPress={onBuy}
                disabled={loading}
              >
                <LinearGradient
                  colors={[Colors.heroLight, Colors.hero]}
                  style={s.buyGrad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="pricetag" size={18} color="#fff" />
                      <Text style={s.buyText}>Buy Now</Text>
                    </>
                  )}
                </LinearGradient>
              </Pressable>
              <Pressable onPress={onCancel} style={s.linkBtn}>
                <Text style={s.cancelText}>Cancel</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: Colors.overlay, justifyContent: "center", alignItems: "center", padding: 24 },
  card: { width: "100%", maxWidth: 360, backgroundColor: Colors.card, borderRadius: 20, padding: 22, alignItems: "center" },
  iconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primaryLight, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  vehicle: { fontSize: 15, fontWeight: "700", color: Colors.text, textAlign: "center" },
  price: { fontSize: 18, fontWeight: "800", color: Colors.hero, marginTop: 4 },
  question: { fontSize: 15, color: Colors.textSecondary, textAlign: "center", marginTop: 14, marginBottom: 18 },
  row: { flexDirection: "row", gap: 12, width: "100%" },
  btn: { flex: 1, height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  cancelBtn: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.inputBorder },
  cancelText: { fontSize: 15, fontWeight: "600", color: Colors.textSecondary },
  yesBtn: { backgroundColor: Colors.hero },
  yesText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  buyWrap: { width: "100%", borderRadius: 12, overflow: "hidden" },
  buyGrad: { height: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  buyText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  linkBtn: { marginTop: 12, padding: 6 },
});
