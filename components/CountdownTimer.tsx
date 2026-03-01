import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors } from "@/constants/colors";
import { formatCountdown } from "@/utils/formatters";

interface CountdownTimerProps {
  endDate: string;
  compact?: boolean;
  onExpire?: () => void;
}

export const CountdownTimer = React.memo(function CountdownTimer({ endDate, compact = false, onExpire }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(() => formatCountdown(endDate));

  const tick = useCallback(() => {
    const next = formatCountdown(endDate);
    setTimeLeft(next);
    if (next.expired && onExpire) onExpire();
  }, [endDate, onExpire]);

  useEffect(() => {
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [tick]);

  if (timeLeft.expired) {
    return <View style={styles.expiredBadge}><Text style={styles.expiredText}>ENDED</Text></View>;
  }

  if (compact) {
    return (
      <View style={styles.compactWrap}>
        <Text style={styles.compactTime}>{timeLeft.hours}:{timeLeft.minutes}:{timeLeft.seconds}</Text>
      </View>
    );
  }

  return (
    <View style={styles.timerRow}>
      <TimeUnit value={timeLeft.hours} label="HRS" />
      <Text style={styles.colon}>:</Text>
      <TimeUnit value={timeLeft.minutes} label="MIN" />
      <Text style={styles.colon}>:</Text>
      <TimeUnit value={timeLeft.seconds} label="SEC" />
    </View>
  );
});

function TimeUnit({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.unit}>
      <View style={styles.unitBox}><Text style={styles.unitValue}>{value}</Text></View>
      <Text style={styles.unitLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  timerRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  unit: { alignItems: "center", gap: 3 },
  unitBox: { backgroundColor: Colors.primaryLight, borderRadius: 8, width: 44, height: 40, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.primary + "33" },
  unitValue: { fontSize: 16, fontFamily: "Urbanist_700Bold", color: Colors.primary },
  unitLabel: { fontSize: 9, fontFamily: "Urbanist_600SemiBold", color: Colors.textMuted, letterSpacing: 0.5 },
  colon: { fontSize: 18, fontFamily: "Urbanist_700Bold", color: Colors.primary, marginBottom: 14 },
  compactWrap: { backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  compactTime: { fontSize: 11, fontFamily: "Urbanist_700Bold", color: "#FFD700" },
  expiredBadge: { backgroundColor: "#FEF2F2", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  expiredText: { fontSize: 10, fontFamily: "Urbanist_700Bold", color: Colors.danger, letterSpacing: 0.5 },
});
