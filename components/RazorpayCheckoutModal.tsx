import React, { useRef } from "react";
import { Modal, SafeAreaView, StyleSheet, TouchableOpacity, Text, View, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { CreateOrderResult, RazorpayPaymentResult } from "@/lib/subscription";
import { Colors } from "@/constants/colors";

interface RazorpayCheckoutModalProps {
  visible: boolean;
  order: CreateOrderResult | null;
  onSuccess: (data: RazorpayPaymentResult) => void;
  onClose: (errorMsg?: string) => void;
}

/**
 * RazorpayCheckoutModal — Uses a WebView to load an inline checkout page.
 * 
 * Key fix: We use `baseUrl` so the WebView treats the page as if it were loaded
 * from an HTTP origin. Razorpay's checkout.js refuses to run on about:blank origins.
 * We set baseUrl to "https://checkout.razorpay.com" so the SDK loads correctly.
 */
export function RazorpayCheckoutModal({ visible, order, onSuccess, onClose }: RazorpayCheckoutModalProps) {
  const webviewRef = useRef<WebView>(null);

  if (!visible || !order) return null;

  // Escape values for safe injection into HTML
  const safeKeyId = (order.key_id || "").replace(/"/g, '\\"');
  const safeOrderId = (order.razorpay_order_id || "").replace(/"/g, '\\"');
  const safeCurrency = (order.currency || "INR").replace(/"/g, '\\"');
  const safeAmount = Number(order.amount) || 0;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <title>Secure Payment</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          height: 100vh; background-color: #f8f9fa;
        }
        .spinner {
          width: 44px; height: 44px;
          border: 4px solid #f3f3f3; border-top: 4px solid ${Colors.primary};
          border-radius: 50%; animation: spin 0.8s linear infinite;
          margin-bottom: 16px;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .text { color: #666; font-size: 16px; font-weight: 500; }
        .error { color: #dc3545; font-size: 14px; margin-top: 12px; text-align: center; padding: 0 20px; display: none; }
        .retry-btn {
          margin-top: 12px; padding: 10px 24px; background: ${Colors.primary};
          color: #fff; border: none; border-radius: 8px; font-size: 14px;
          font-weight: 600; cursor: pointer; display: none;
        }
      </style>
    </head>
    <body>
      <div class="spinner" id="spinner"></div>
      <div class="text" id="statusText">Connecting to Razorpay...</div>
      <div class="error" id="errorText"></div>
      <button class="retry-btn" id="retryBtn" onclick="loadAndPay()">Retry</button>

      <script>
        var sdkLoaded = false;
        var paymentStarted = false;
        var lastFailError = '';

        function sendMessage(obj) {
          try {
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage(JSON.stringify(obj));
            }
          } catch(e) {}
        }

        function showError(msg) {
          document.getElementById('spinner').style.display = 'none';
          document.getElementById('statusText').style.display = 'none';
          var errEl = document.getElementById('errorText');
          errEl.textContent = msg;
          errEl.style.display = 'block';
          document.getElementById('retryBtn').style.display = 'inline-block';
        }

        function loadAndPay() {
          // Reset UI
          document.getElementById('spinner').style.display = 'block';
          document.getElementById('statusText').style.display = 'block';
          document.getElementById('statusText').textContent = 'Loading payment gateway...';
          document.getElementById('errorText').style.display = 'none';
          document.getElementById('retryBtn').style.display = 'none';

          if (sdkLoaded) {
            startPayment();
            return;
          }

          // Dynamically load Razorpay SDK
          var script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = function() {
            sdkLoaded = true;
            document.getElementById('statusText').textContent = 'Opening payment...';
            startPayment();
          };
          script.onerror = function() {
            showError('Failed to load Razorpay SDK. Please check your internet connection and try again.');
            sendMessage({ status: 'sdk_error', error: 'Failed to load Razorpay SDK' });
          };
          document.head.appendChild(script);
        }

        function startPayment() {
          if (paymentStarted) return;

          if (typeof Razorpay === 'undefined') {
            showError('Razorpay SDK not available. Please check your internet connection.');
            return;
          }

          paymentStarted = true;

          try {
            var options = {
              key: "${safeKeyId}",
              amount: ${safeAmount},
              currency: "${safeCurrency}",
              name: "CarsbuyNsell",
              description: "Vehicle Access Subscription",
              order_id: "${safeOrderId}",
              prefill: {
                name: "CarsbuyNsell User",
                email: "user@example.com",
                contact: "9999999999"
              },
              theme: { color: "${Colors.primary}" },
              handler: function(response) {
                // Final success — send to React Native and close
                lastFailError = '';
                sendMessage({
                  status: "success",
                  data: {
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_order_id: response.razorpay_order_id || "${safeOrderId}",
                    razorpay_signature: response.razorpay_signature
                  }
                });
              },
              modal: {
                ondismiss: function() {
                  // User closed the Razorpay checkout modal.
                  // If there was a previous failure, include the error message.
                  paymentStarted = false;
                  if (lastFailError) {
                    sendMessage({ status: "failed", error: lastFailError });
                  } else {
                    sendMessage({ status: "cancelled" });
                  }
                  lastFailError = '';
                },
                escape: true,
                backdropclose: false
              }
            };

            var rzp = new Razorpay(options);

            rzp.on('payment.failed', function(response) {
              // IMPORTANT: Do NOT close the modal here!
              // payment.failed fires for EVERY failed attempt (e.g. card declined),
              // but the user can still retry with another method (UPI, wallet, etc).
              // We just store the last error. If the user dismisses the modal,
              // ondismiss will send this error to React Native.
              var errMsg = (response.error && response.error.description) || "Payment failed at gateway";
              lastFailError = errMsg;
              console.log('[RZP] Intermediate payment failure (user can retry):', errMsg);
            });

            rzp.open();
          } catch(e) {
            paymentStarted = false;
            var errorMsg = e && e.message ? e.message : "Unknown error";
            showError("Checkout error: " + errorMsg);
            sendMessage({
              status: "failed",
              error: "Checkout initialization failed: " + errorMsg
            });
          }
        }

        // Start loading when page is ready
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
          setTimeout(loadAndPay, 100);
        } else {
          document.addEventListener('DOMContentLoaded', function() {
            setTimeout(loadAndPay, 100);
          });
        }
      </script>
    </body>
    </html>
  `;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={() => onClose()}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Secure Payment</Text>
          <TouchableOpacity onPress={() => onClose()} style={styles.closeButton}>
            <Text style={styles.closeText}>✕ Cancel</Text>
          </TouchableOpacity>
        </View>
        <WebView
          ref={webviewRef}
          source={{
            html: htmlContent,
            // CRITICAL: Set baseUrl so the WebView has an HTTP origin.
            // Without this, Razorpay SDK refuses to load on about:blank origins.
            baseUrl: "https://razorpay.com",
          }}
          onMessage={(event) => {
            try {
              const res = JSON.parse(event.nativeEvent.data);
              console.log("[RZP-WebView] Received message:", JSON.stringify(res));
              if (res.status === "success" && res.data) {
                // Final payment success — verify on backend
                onSuccess(res.data);
              } else if (res.status === "cancelled") {
                // User dismissed without any payment attempt failing
                onClose();
              } else if (res.status === "failed") {
                // User dismissed AFTER a payment attempt failed
                // (this only fires when user closes the modal, not on intermediate failures)
                onClose(res.error || "Payment failed");
              } else if (res.status === "sdk_error") {
                // SDK failed to load — user can retry inside WebView
                console.warn("[RZP-WebView] SDK load error:", res.error);
              }
            } catch (e) {
              console.error("[RZP-WebView] Parse error:", e);
              onClose("Internal bridge error");
            }
          }}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error("[RZP-WebView] WebView error:", nativeEvent);
          }}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error("[RZP-WebView] HTTP error:", nativeEvent.statusCode);
          }}
          originWhitelist={["*"]}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          mixedContentMode="always"
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          javaScriptCanOpenWindowsAutomatically={true}
          setSupportMultipleWindows={false}
          cacheEnabled={false}
          thirdPartyCookiesEnabled={true}
          sharedCookiesEnabled={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Preparing payment...</Text>
            </View>
          )}
          style={styles.webview}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    height: 54,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "#fff",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#333",
  },
  closeButton: { padding: 8 },
  closeText: { color: Colors.primary, fontWeight: "600", fontSize: 15 },
  webview: { flex: 1 },
  loadingOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
    fontSize: 15,
  },
});
