import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.nexus.chatstudio',
  appName: 'Nexus',
  webDir: 'dist',
  android: {
    // Local models (Ollama, LM Studio) are reached over plain http on the LAN,
    // which the WebView would otherwise block from an https page.
    allowMixedContent: true,
  },
  server: {
    androidScheme: 'https',
  },
}

export default config
