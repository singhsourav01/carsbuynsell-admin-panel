import messaging, {
  FirebaseMessagingTypes,
} from "@react-native-firebase/messaging";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { apiRequestDirect } from "@/lib/auth";

const ANDROID_CHANNEL_ID = "default";
// Channel the notification service sends to (android.notification.channelId).
// Android only shows high-importance pop-ups if this channel exists on the device.
const SERVER_CHANNEL_ID = "carsbuynsell_notifications";
const DEFAULT_NOTIFICATION_TITLE = "CarsbuyNsell";
const FALLBACK_DEVICE_REGISTRATION_URL =
  "http://65.2.10.30:3002/user/user-device";

export interface PushRegistration {
  userId: string;
  accessToken?: string | null;
  refreshToken?: string | null;
}

export interface RegisterOptions {
  requestPermission?: boolean;
}

let isNotificationHandlerConfigured = false;

function getDeviceRegistrationUrl(): string {
  return (
    process.env.EXPO_PUBLIC_DEVICE_API_URL || FALLBACK_DEVICE_REGISTRATION_URL
  );
}

export function configureNotificationHandler(): void {
  if (Platform.OS === "web" || isNotificationHandlerConfigured) return;
  isNotificationHandlerConfigured = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function ensureNotificationChannel(): Promise<void> {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: "Default",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    sound: "default",
  });
  await Notifications.setNotificationChannelAsync(SERVER_CHANNEL_ID, {
    name: "Auctions & listings",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    sound: "default",
  });
}

// App start and login can both ask at once; share one request so the system
// dialog is only shown once.
let pendingPermissionRequest: Promise<boolean> | null = null;

export function requestNotificationPermission(): Promise<boolean> {
  if (!pendingPermissionRequest) {
    pendingPermissionRequest = askNotificationPermission().finally(() => {
      pendingPermissionRequest = null;
    });
  }
  return pendingPermissionRequest;
}

async function askNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web" || !Device.isDevice) return false;

  await ensureNotificationChannel();

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  // Android can report "denied" before the user was ever asked; only give up
  // when the system won't show the prompt again ("Don't allow" twice / blocked).
  if (!current.canAskAgain) return false;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function getFCMToken(): Promise<string | null> {
  if (Platform.OS === "web" || !Device.isDevice) {
    console.log("[push] Push notifications require a physical device");
    return null;
  }

  try {
    const token = await messaging().getToken();
    console.log("[push] FCM token:", token);
    return token;
  } catch (error) {
    console.log("[push] Unable to get FCM token:", error);
    return null;
  }
}

export async function registerDeviceWithBackend(
  params: PushRegistration & { fcmToken: string },
): Promise<void> {
  if (Platform.OS === "web") return;

  const payload = {
    uld_user_id: params.userId,
    uld_fcm_token: params.fcmToken,
    uld_device_name: Device.modelName || Device.deviceName || "Unknown Device",
    uld_device_type: Platform.OS === "ios" ? "IOS" : "ANDROID",
    uld_access_token: params.accessToken || "",
    uld_refresh_token: params.refreshToken || "",
  };

  try {
    const res = await apiRequestDirect(
      "POST",
      getDeviceRegistrationUrl(),
      payload,
    );
    const body = await res.text();
    console.log("[push] Device registration:", res.status, body);
  } catch (error) {
    console.log("[push] Device registration failed:", error);
  }
}

export async function registerForPushNotifications(
  params: PushRegistration,
  options: RegisterOptions = {},
): Promise<string | null> {
  if (Platform.OS === "web" || !Device.isDevice) return null;

  if (options.requestPermission) {
    const granted = await requestNotificationPermission();
    // Register the token anyway: if the user enables notifications later in
    // Settings, pushes start arriving without needing to log in again.
    if (!granted) console.log("[push] Notification permission not granted");
  }

  const token = await getFCMToken();
  if (!token) return null;

  await registerDeviceWithBackend({ ...params, fcmToken: token });
  return token;
}

function getNotificationContent(
  message: FirebaseMessagingTypes.RemoteMessage,
): { title: string; body: string; data: Record<string, unknown> } {
  const data = message.data || {};
  const title =
    message.notification?.title ||
    data.title ||
    data.subject ||
    DEFAULT_NOTIFICATION_TITLE;
  const body =
    message.notification?.body ||
    data.body ||
    data.message ||
    data.description ||
    "";

  return { title: String(title), body: String(body), data };
}

export async function showLocalNotification(
  message: FirebaseMessagingTypes.RemoteMessage,
): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    await ensureNotificationChannel();
    const { title, body, data } = getNotificationContent(message);

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: "default",
      },
      trigger:
        Platform.OS === "android" ? { channelId: ANDROID_CHANNEL_ID } : null,
    });
  } catch (error) {
    console.log("[push] Unable to display notification:", error);
  }
}

export function setupPushNotificationListeners(
  params: PushRegistration,
): () => void {
  if (Platform.OS === "web") return () => {};

  configureNotificationHandler();

  const unsubscribeMessage = messaging().onMessage(async (message) => {
    console.log("[push] Foreground message:", message);
    await showLocalNotification(message);
  });

  const unsubscribeTokenRefresh = messaging().onTokenRefresh(async (token) => {
    console.log("[push] FCM token refreshed:", token);
    await registerDeviceWithBackend({ ...params, fcmToken: token });
  });

  const unsubscribeOpened = messaging().onNotificationOpenedApp((message) => {
    console.log("[push] Notification opened app:", message);
  });

  messaging()
    .getInitialNotification()
    .then((message) => {
      if (message) console.log("[push] App opened from notification:", message);
    })
    .catch((error) => {
      console.log("[push] getInitialNotification failed:", error);
    });

  return () => {
    unsubscribeMessage();
    unsubscribeTokenRefresh();
    unsubscribeOpened();
  };
}

configureNotificationHandler();
ensureNotificationChannel().catch((error) => {
  console.log("[push] Unable to create notification channel:", error);
});

if (Platform.OS !== "web") {
  try {
    messaging().setBackgroundMessageHandler(async (message) => {
      console.log("[push] Background message:", message);

      // Notification payloads are shown by the system. Data-only messages
      // need to be rendered manually.
      if (!message.notification) {
        await showLocalNotification(message);
      }
    });
  } catch (error) {
    console.log("[push] Unable to register background message handler:", error);
  }
}
