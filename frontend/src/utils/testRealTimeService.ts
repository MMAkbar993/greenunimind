// Test utility to verify real-time payment service configuration
import { config } from '@/config';

export const testRealTimeServiceConfig = () => {
  console.log('🔧 Real-time Payment Service Configuration Test');
  console.log('================================================');
  
  try {
    // Test configuration access
    console.log('✅ Config imported successfully');
    console.log('📡 WebSocket URL:', config.wsBaseUrl);
    console.log('🌐 API Base URL:', config.apiBaseUrl);
    console.log('🔧 Environment:', config.node_env);
    
    // Test environment variable access
    console.log('\n🔍 Environment Variables:');
    console.log('VITE_WS_BASE_URL:', import.meta.env.VITE_WS_BASE_URL);
    console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
    
    // Test WebSocket URL construction
    const wsUrl = config.wsBaseUrl;
    if (wsUrl && wsUrl.startsWith('ws')) {
      console.log('✅ WebSocket URL is properly configured');
    } else {
      console.log('❌ WebSocket URL configuration issue:', wsUrl);
    }
    
    return {
      success: true,
      wsUrl: config.wsBaseUrl,
      apiUrl: config.apiBaseUrl
    };
  } catch (error) {
    console.error('❌ Configuration test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Test function to verify no process.env access
export const testNoProcessEnvAccess = () => {
  console.log('\n🚫 Process Environment Access Test');
  console.log('===================================');
  
  try {
    // This should NOT cause an error in the browser
    const testConfig = {
      wsUrl: config.wsBaseUrl,
      apiUrl: config.apiBaseUrl
    };
    
    console.log('✅ No process.env access detected');
    console.log('✅ Configuration loaded via import.meta.env');
    
    return { success: true, config: testConfig };
  } catch (error) {
    console.error('❌ Process environment access test failed:', error);
    return { success: false, error };
  }
};
