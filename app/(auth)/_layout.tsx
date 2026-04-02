import { Stack } from "expo-router";
import { Colors } from "@/constants/colors";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="verify-otp" />
      <Stack.Screen name="verify-phone" />
      <Stack.Screen name="verify-email" />
      <Stack.Screen name="pending" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="verify-reset-otp" />
      <Stack.Screen name="reset-password" />
    </Stack>
  );
}
