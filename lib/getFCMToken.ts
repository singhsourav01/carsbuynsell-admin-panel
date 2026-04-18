import messaging from "@react-native-firebase/messaging";

export async function getFCMToken() {
  try {
    const authStatus = await messaging().requestPermission();

    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      console.log("Notification permission denied");
      return null;
    }

    const token = await messaging().getToken();

    console.log("Firebase FCM Token:", token);

    return token;
  } catch (error) {
    console.log("FCM TOKEN ERROR:", error);
    return null;
  }
}