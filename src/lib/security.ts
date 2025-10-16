// src/lib/security.ts
class SecurityConfig {
  private static validateEnvironment() {
    const requiredEnvVars = [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
      'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      'NEXT_PUBLIC_FIREBASE_APP_ID'
    ];

    const missing = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    console.log('✅ Environment variables validated successfully');
  }

  static ensureSecureConfig() {
    if (typeof window !== 'undefined') {
      this.validateEnvironment();
    }
  }
}

// Initialize security on app start
SecurityConfig.ensureSecureConfig();

export { SecurityConfig };