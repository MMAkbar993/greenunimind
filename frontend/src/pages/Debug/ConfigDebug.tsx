import { config } from "@/config";

const ConfigDebug = () => {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Configuration Debug</h1>
      
      <div className="space-y-4">
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Environment Variables</h2>
          <div className="space-y-2 text-sm font-mono">
            <div><strong>VITE_API_BASE_URL:</strong> {import.meta.env.VITE_API_BASE_URL}</div>
            <div><strong>VITE_NODE_ENV:</strong> {import.meta.env.VITE_NODE_ENV}</div>
            <div><strong>DEV:</strong> {import.meta.env.DEV ? 'true' : 'false'}</div>
            <div><strong>PROD:</strong> {import.meta.env.PROD ? 'true' : 'false'}</div>
          </div>
        </div>
        
        <div className="bg-blue-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Config Object</h2>
          <div className="space-y-2 text-sm font-mono">
            <div><strong>config.apiBaseUrl:</strong> {config.apiBaseUrl}</div>
            <div><strong>config.wsBaseUrl:</strong> {config.wsBaseUrl}</div>
            <div><strong>config.node_env:</strong> {config.node_env}</div>
          </div>
        </div>
        
        <div className="bg-green-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Test API Call</h2>
          <button
            onClick={async () => {
              try {
                console.log('Testing API call with config.apiBaseUrl:', config.apiBaseUrl);
                const response = await fetch(`${config.apiBaseUrl}/users/me`, {
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken') || 'no-token'}`
                  }
                });
                console.log('API Response Status:', response.status);
                console.log('API Response URL:', response.url);
                const responseText = await response.text();
                console.log('API Response Body:', responseText);
                alert(`API call to ${config.apiBaseUrl}/users/me returned status: ${response.status}\nURL: ${response.url}\nResponse: ${responseText.substring(0, 200)}`);
              } catch (error) {
                console.error('API Error:', error);
                alert(`API call failed: ${error}`);
              }
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Test API Call
          </button>
        </div>
        
        <div className="bg-yellow-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">All Environment Variables</h2>
          <pre className="text-xs overflow-auto max-h-40">
            {JSON.stringify(import.meta.env, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default ConfigDebug;
