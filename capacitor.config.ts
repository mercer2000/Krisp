import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.myopenbrain.app",
  appName: "MyOpenBrain",
  webDir: "out",
  server: {
    // Point at the live server — no static build needed
    url: "https://myopenbrain.com",
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#ffffff",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    StatusBar: {
      style: "default",
    },
  },
  ios: {
    contentInset: "always",
    preferredContentMode: "mobile",
  },
  android: {
    backgroundColor: "#ffffff",
  },
};

export default config;
