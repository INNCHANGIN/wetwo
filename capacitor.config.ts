import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wetwo.app',
  appName: 'we-two',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    allowNavigation: [
      '*.supabase.co'
    ]
  }
};

export default config;
