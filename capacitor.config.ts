import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.catalystwells.app',
  appName: 'Catalyst Wellbeing',
  // webDir: 'out', // Not needed when using server.url
  server: {
    url: 'https://catalystwells.netlify.app',
    cleartext: true,
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#3b82f6",
      showSpinner: false,
      androidSpinnerStyle: "small",
      spinnerColor: "#ffffff"
    }
  }
};

export default config;
