import React, { useState, useRef } from "react";
import {
    View, Text, TextInput, Pressable, StyleSheet,
    ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { apiRequestDirect } from "@/lib/auth";

const OTP_LENGTH = 6;

export default function VerifyOtpScreen() {
    const insets = useSafeAreaInsets();
    const { phone, email } = useLocalSearchParams<{ phone: string; email: string }>();

    // Phone OTP state
    const [phoneOtp, setPhoneOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
    const phoneInputRefs = useRef<(TextInput | null)[]>([]);
    const [phoneLoading, setPhoneLoading] = useState(false);
    const [phoneVerified, setPhoneVerified] = useState(false);
    const [phoneError, setPhoneError] = useState("");
    const [phoneSuccess, setPhoneSuccess] = useState("");

    // Email OTP state
    const [emailOtp, setEmailOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
    const emailInputRefs = useRef<(TextInput | null)[]>([]);
    const [emailLoading, setEmailLoading] = useState(false);
    const [emailVerified, setEmailVerified] = useState(false);
    const [emailError, setEmailError] = useState("");
    const [emailSuccess, setEmailSuccess] = useState("");

    const topPad = insets.top + (insets.top < 20 ? 67 : 0);

    // Phone OTP handlers
    const handlePhoneOtpChange = (value: string, idx: number) => {
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...phoneOtp];
        newOtp[idx] = value.slice(-1);
        setPhoneOtp(newOtp);
        if (value && idx < OTP_LENGTH - 1) phoneInputRefs.current[idx + 1]?.focus();
        if (!value && idx > 0) phoneInputRefs.current[idx - 1]?.focus();
    };

    const handlePhoneKeyPress = (e: any, idx: number) => {
        if (e.nativeEvent.key === "Backspace" && !phoneOtp[idx] && idx > 0) phoneInputRefs.current[idx - 1]?.focus();
    };

    // Email OTP handlers
    const handleEmailOtpChange = (value: string, idx: number) => {
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...emailOtp];
        newOtp[idx] = value.slice(-1);
        setEmailOtp(newOtp);
        if (value && idx < OTP_LENGTH - 1) emailInputRefs.current[idx + 1]?.focus();
        if (!value && idx > 0) emailInputRefs.current[idx - 1]?.focus();
    };

    const handleEmailKeyPress = (e: any, idx: number) => {
        if (e.nativeEvent.key === "Backspace" && !emailOtp[idx] && idx > 0) emailInputRefs.current[idx - 1]?.focus();
    };

    // Verify phone OTP
    const handleVerifyPhone = async () => {
        const otpValue = phoneOtp.join("");
        if (otpValue.length < OTP_LENGTH) {
            setPhoneError("Please enter all 6 digits");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }
        setPhoneError("");
        setPhoneLoading(true);
        try {
            const res = await apiRequestDirect("POST", "http://localhost:8000/auth/verify-phone", {
                otp: otpValue,
                phone,
            });
            const data = await res.json();
            if (res.ok) {
                setPhoneVerified(true);
                setPhoneSuccess(data?.message || "Phone verified successfully!");
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
                setPhoneError(data?.message || data?.error || "Invalid OTP. Please try again.");
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
        } catch {
            setPhoneError("Verification failed. Please try again.");
        } finally {
            setPhoneLoading(false);
        }
    };

    // Verify email OTP
    const handleVerifyEmail = async () => {
        const otpValue = emailOtp.join("");
        if (otpValue.length < OTP_LENGTH) {
            setEmailError("Please enter all 6 digits");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }
        setEmailError("");
        setEmailLoading(true);
        try {
            const res = await apiRequestDirect("POST", "http://localhost:8000/auth/verify-email", {
                otp: otpValue,
                email,
            });
            const data = await res.json();
            if (res.ok) {
                setEmailVerified(true);
                setEmailSuccess(data?.message || "Email verified successfully!");
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
                setEmailError(data?.message || data?.error || "Invalid OTP. Please try again.");
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
        } catch {
            setEmailError("Verification failed. Please try again.");
        } finally {
            setEmailLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={[styles.root, { paddingTop: topPad }]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <ScrollView contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 32 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

                {/* Logo */}
                <View style={styles.logoArea}>
                    <View style={styles.logoBox}><Ionicons name="car" size={34} color="#fff" /></View>
                    <Text style={styles.appTitle}>Verify OTP</Text>
                    <Text style={styles.appSubtitle}>Verify your phone and email to continue</Text>
                </View>

                {/* Both verified message */}
                {phoneVerified && emailVerified ? (
                    <View style={styles.allDoneBox}>
                        <Ionicons name="checkmark-done-circle" size={22} color={Colors.success} />
                        <Text style={styles.allDoneText}>Both phone and email verified successfully!</Text>
                    </View>
                ) : null}

                {/* ─── Phone OTP Section ─── */}
                <View style={[styles.card, phoneVerified && styles.cardVerified]}>
                    <View style={styles.sectionHeader}>
                        <View style={[styles.iconCircle, phoneVerified && styles.iconCircleDone]}>
                            {phoneVerified
                                ? <Ionicons name="checkmark" size={18} color="#fff" />
                                : <Ionicons name="phone-portrait-outline" size={18} color={Colors.primary} />
                            }
                        </View>
                        <View style={styles.sectionHeaderText}>
                            <Text style={styles.sectionLabel}>PHONE VERIFICATION</Text>
                            <Text style={styles.sectionSub}>{phoneVerified ? "Verified" : "OTP sent to your mobile number"}</Text>
                        </View>
                    </View>

                    {/* Prefilled phone */}
                    <View style={styles.prefilledRow}>
                        <Ionicons name="call-outline" size={16} color={Colors.textSecondary} />
                        <Text style={styles.prefilledValue}>{phone}</Text>
                        <View style={styles.prefilledBadge}><Text style={styles.prefilledBadgeText}>Prefilled</Text></View>
                    </View>

                    {!phoneVerified ? (
                        <>
                            {/* Phone error */}
                            {phoneError ? (
                                <View style={styles.errorBox}>
                                    <Ionicons name="alert-circle-outline" size={14} color={Colors.danger} />
                                    <Text style={styles.errorText}>{phoneError}</Text>
                                </View>
                            ) : null}

                            {/* Phone OTP input */}
                            <Text style={styles.otpLabel}>Enter 6-digit OTP</Text>
                            <View style={styles.otpRow}>
                                {Array(OTP_LENGTH).fill(0).map((_, idx) => (
                                    <TextInput
                                        key={`phone-${idx}`}
                                        ref={(el) => { phoneInputRefs.current[idx] = el; }}
                                        style={[styles.otpBox, phoneOtp[idx] ? styles.otpBoxFilled : {}]}
                                        value={phoneOtp[idx]}
                                        onChangeText={(v) => handlePhoneOtpChange(v, idx)}
                                        onKeyPress={(e) => handlePhoneKeyPress(e, idx)}
                                        keyboardType="numeric"
                                        maxLength={1}
                                        returnKeyType={idx === OTP_LENGTH - 1 ? "done" : "next"}
                                        onSubmitEditing={idx === OTP_LENGTH - 1 ? handleVerifyPhone : undefined}
                                        textAlign="center"
                                        selectTextOnFocus
                                    />
                                ))}
                            </View>

                            {/* Verify phone button */}
                            <Pressable
                                style={({ pressed }) => [styles.verifyBtn, { opacity: pressed ? 0.85 : 1 }]}
                                onPress={handleVerifyPhone}
                                disabled={phoneLoading}
                            >
                                {phoneLoading
                                    ? <ActivityIndicator color="#fff" />
                                    : <Text style={styles.verifyBtnText}>VERIFY PHONE</Text>
                                }
                            </Pressable>
                        </>
                    ) : (
                        <View style={styles.verifiedBadge}>
                            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                            <Text style={styles.verifiedText}>{phoneSuccess}</Text>
                        </View>
                    )}
                </View>

                {/* ─── Email OTP Section ─── */}
                <View style={[styles.card, emailVerified && styles.cardVerified]}>
                    <View style={styles.sectionHeader}>
                        <View style={[styles.iconCircle, emailVerified && styles.iconCircleDone]}>
                            {emailVerified
                                ? <Ionicons name="checkmark" size={18} color="#fff" />
                                : <Ionicons name="mail-outline" size={18} color={Colors.primary} />
                            }
                        </View>
                        <View style={styles.sectionHeaderText}>
                            <Text style={styles.sectionLabel}>EMAIL VERIFICATION</Text>
                            <Text style={styles.sectionSub}>{emailVerified ? "Verified" : "OTP sent to your email address"}</Text>
                        </View>
                    </View>

                    {/* Prefilled email */}
                    <View style={styles.prefilledRow}>
                        <Ionicons name="mail-outline" size={16} color={Colors.textSecondary} />
                        <Text style={styles.prefilledValue} numberOfLines={1}>{email}</Text>
                        <View style={styles.prefilledBadge}><Text style={styles.prefilledBadgeText}>Prefilled</Text></View>
                    </View>

                    {!emailVerified ? (
                        <>
                            {/* Email error */}
                            {emailError ? (
                                <View style={styles.errorBox}>
                                    <Ionicons name="alert-circle-outline" size={14} color={Colors.danger} />
                                    <Text style={styles.errorText}>{emailError}</Text>
                                </View>
                            ) : null}

                            {/* Email OTP input */}
                            <Text style={styles.otpLabel}>Enter 6-digit OTP</Text>
                            <View style={styles.otpRow}>
                                {Array(OTP_LENGTH).fill(0).map((_, idx) => (
                                    <TextInput
                                        key={`email-${idx}`}
                                        ref={(el) => { emailInputRefs.current[idx] = el; }}
                                        style={[styles.otpBox, emailOtp[idx] ? styles.otpBoxFilled : {}]}
                                        value={emailOtp[idx]}
                                        onChangeText={(v) => handleEmailOtpChange(v, idx)}
                                        onKeyPress={(e) => handleEmailKeyPress(e, idx)}
                                        keyboardType="numeric"
                                        maxLength={1}
                                        returnKeyType={idx === OTP_LENGTH - 1 ? "done" : "next"}
                                        onSubmitEditing={idx === OTP_LENGTH - 1 ? handleVerifyEmail : undefined}
                                        textAlign="center"
                                        selectTextOnFocus
                                    />
                                ))}
                            </View>

                            {/* Verify email button */}
                            <Pressable
                                style={({ pressed }) => [styles.verifyBtn, { opacity: pressed ? 0.85 : 1 }]}
                                onPress={handleVerifyEmail}
                                disabled={emailLoading}
                            >
                                {emailLoading
                                    ? <ActivityIndicator color="#fff" />
                                    : <Text style={styles.verifyBtnText}>VERIFY EMAIL</Text>
                                }
                            </Pressable>
                        </>
                    ) : (
                        <View style={styles.verifiedBadge}>
                            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                            <Text style={styles.verifiedText}>{emailSuccess}</Text>
                        </View>
                    )}
                </View>

                <Text style={styles.footer}>Powered by <Text style={styles.footerBold}>Raj Motors</Text></Text>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.background },
    container: { flexGrow: 1, paddingHorizontal: 24, alignItems: "center" },

    // Logo
    logoArea: { alignItems: "center", marginBottom: 24, marginTop: 12 },
    logoBox: {
        width: 80, height: 80, borderRadius: 22, backgroundColor: Colors.navy,
        alignItems: "center", justifyContent: "center", marginBottom: 14,
        shadowColor: Colors.navy, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.22, shadowRadius: 14, elevation: 7,
    },
    appTitle: { fontSize: 26, fontFamily: "Urbanist_700Bold", color: Colors.text, marginBottom: 2 },
    appSubtitle: { fontSize: 14, fontFamily: "Urbanist_400Regular", color: Colors.textSecondary, textAlign: "center" },

    // All-done banner
    allDoneBox: {
        flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#ECFDF5",
        borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#A7F3D0", width: "100%", marginBottom: 14,
    },
    allDoneText: { flex: 1, fontSize: 14, fontFamily: "Urbanist_600SemiBold", color: Colors.success },

    // Error / success inline
    errorBox: {
        flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "#FEF2F2",
        borderRadius: 10, padding: 11, borderWidth: 1, borderColor: "#FECACA", width: "100%",
    },
    errorText: { flex: 1, fontSize: 13, fontFamily: "Urbanist_500Medium", color: Colors.danger },

    // Card
    card: {
        width: "100%", backgroundColor: Colors.card, borderRadius: 20, padding: 22,
        shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 16,
        elevation: 4, marginBottom: 16, gap: 14,
    },
    cardVerified: { borderWidth: 1.5, borderColor: Colors.success + "55" },

    // Section Header
    sectionHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
    iconCircle: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primaryLight,
        alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.primary + "33",
    },
    iconCircleDone: { backgroundColor: Colors.success, borderColor: Colors.success },
    sectionHeaderText: { flex: 1, gap: 2 },
    sectionLabel: { fontSize: 12, fontFamily: "Urbanist_700Bold", color: Colors.textSecondary, letterSpacing: 1 },
    sectionSub: { fontSize: 12, fontFamily: "Urbanist_400Regular", color: Colors.textMuted },

    // Prefilled row
    prefilledRow: {
        flexDirection: "row", alignItems: "center", gap: 10,
        backgroundColor: Colors.inputBg, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.inputBorder,
        height: 54, paddingHorizontal: 14,
    },
    prefilledValue: { flex: 1, fontSize: 15, fontFamily: "Urbanist_500Medium", color: Colors.text },
    prefilledBadge: {
        backgroundColor: Colors.primaryLight, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
        borderWidth: 1, borderColor: Colors.primary + "33",
    },
    prefilledBadgeText: { fontSize: 10, fontFamily: "Urbanist_600SemiBold", color: Colors.primary },

    // Verified badge
    verifiedBadge: {
        flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#ECFDF5",
        borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#A7F3D0",
    },
    verifiedText: { flex: 1, fontSize: 13, fontFamily: "Urbanist_500Medium", color: Colors.success },

    // OTP
    otpLabel: { fontSize: 12, fontFamily: "Urbanist_600SemiBold", color: Colors.textSecondary },
    otpRow: { flexDirection: "row", gap: 8, justifyContent: "center" },
    otpBox: {
        width: 44, height: 52, borderRadius: 12, backgroundColor: Colors.inputBg,
        borderWidth: 1.5, borderColor: Colors.inputBorder, fontSize: 22, fontFamily: "Urbanist_700Bold", color: Colors.text,
    },
    otpBoxFilled: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },

    // Verify button
    verifyBtn: {
        height: 54, borderRadius: 14, backgroundColor: Colors.actionBtn,
        alignItems: "center", justifyContent: "center", width: "100%",
    },
    verifyBtnText: { fontSize: 14, fontFamily: "Urbanist_700Bold", color: "#fff", letterSpacing: 1.5 },

    // Footer
    footer: { fontSize: 13, fontFamily: "Urbanist_400Regular", color: Colors.textMuted, marginTop: 8, marginBottom: 8 },
    footerBold: { fontFamily: "Urbanist_700Bold", color: Colors.text },
});
