import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

export async function getFCMToken() {
  if (!Device.isDevice) {
    alert("Must use physical device for Push Notifications");
    return null;
  }

  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();

  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } =
      await Notifications.requestPermissionsAsync();

    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    alert("Permission not granted for notifications");
    return null;
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;

  console.log("FCM Token:", token);

  return token;
}