import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.triviaverse.app",
  appName: "Triviaverse",
  webDir: "out",
  server: {
    androidScheme: "https",
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
