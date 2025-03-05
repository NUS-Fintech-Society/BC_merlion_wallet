import React, { useState, useEffect } from "react";
import { useAuth } from "../components/AuthProvider"; // Adjust path as needed

const BACKEND_URL = "http://localhost:3000";

export default function LoginScreen() {
  const { user, walletAddress, loading: authLoading, logout, login, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processingCallback, setProcessingCallback] = useState(false);
  const [debugInfo, setDebugInfo] = useState({});

  // Add debug log to track authentication state
  useEffect(() => {
    console.log("Auth State:", { 
      user, 
      walletAddress, 
      isAuthenticated, 
      authLoading, 
      processingCallback 
    });
    
    setDebugInfo({
      user: !!user,
      walletAddress: walletAddress ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}` : null,
      isAuthenticated,
      authLoading,
      processingCallback,
      timestamp: new Date().toISOString()
    });
  }, [user, walletAddress, isAuthenticated, authLoading, processingCallback]);

  const handleLogin = () => {
    setLoading(true);
    
    const nonce = Math.random().toString(36).substring(2, 15);
    const state = Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem("authState", state);
    
    const frontendRedirectUri = window.location.origin + window.location.pathname;
    const authUrl = `http://localhost:5156/singpass/v2/authorize?client_id=my-mock-client-id&redirect_uri=${encodeURIComponent(frontendRedirectUri)}&response_type=code&scope=openid&nonce=${nonce}&state=${state}`;

    window.location.href = authUrl;
  };

  useEffect(() => {
    // Process callback only once
    if (processingCallback) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const state = urlParams.get("state");

    if (code && !isAuthenticated) {
      setProcessingCallback(true);
      setLoading(true);

      const storedState = sessionStorage.getItem("authState");
      if (state && storedState && state !== storedState) {
        setError("Invalid state parameter. Possible CSRF attack.");
        setLoading(false);
        setProcessingCallback(false);
        return;
      }

      sessionStorage.removeItem("authState");

      fetch(`${BACKEND_URL}/singpass/callback?code=${code}`)
        .then(response => {
          if (!response.ok) {
            return response.text().then(text => {
              throw new Error(`Authentication failed: ${text}`);
            });
          }
          return response.json();
        })
        .then(data => {
          console.log("Authentication successful:", data);
          // Store the JWT for Web3Auth to use
          if (data.id_token) {
            localStorage.setItem("id_token", data.id_token);
          }
          // Store user data if needed
          if (data.user) {
            localStorage.setItem("user", JSON.stringify(data.user.payload || data.user));
          }
          // Clean up URL parameters to prevent re-processing
          window.history.replaceState({}, document.title, window.location.pathname);
          // Trigger login in AuthProvider
          setTimeout(() => {
            // Trigger login in AuthProvider
            login().then(() => {
              console.log("Login function completed");
              // Force a page reload to ensure UI updates
              window.location.reload();
            });
          }, 500); // 500ms delay
        })
        .catch(err => {
          console.error("Error during authentication:", err);
          setError(err.message);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [login, isAuthenticated, processingCallback]);

  // Loading state from either component or auth context
  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-blue-500">Loading...</span>
          </div>
          
          {/* Show what step we're in */}
          <p className="text-sm text-gray-600">
            {processingCallback ? "Processing authentication callback..." : "Initializing authentication..."}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-red-500 mb-4 p-6 bg-white rounded-lg shadow-md">
          <p><strong>Error:</strong> {error}</p>
          <button
            onClick={() => window.location.href = window.location.pathname}
            className="mt-4 px-4 py-2 text-white bg-blue-600 rounded-lg shadow hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Debug section - will show current auth state for debugging
  const DebugSection = () => (
    <div className="absolute bottom-4 right-4 p-4 bg-gray-800 text-white rounded-lg opacity-80 text-xs max-w-xs">
      <h3 className="font-bold mb-2">Debug Info:</h3>
      <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
      <div className="mt-2">
        <button 
          onClick={() => console.log("Local Storage:", { 
            id_token: !!localStorage.getItem("id_token"), 
            user: localStorage.getItem("user") 
          })}
          className="bg-gray-600 px-2 py-1 rounded mr-2"
        >
          Log Storage
        </button>
        <button 
          onClick={() => window.location.reload()}
          className="bg-gray-600 px-2 py-1 rounded"
        >
          Reload
        </button>
      </div>
    </div>
  );

  // Authenticated state with wallet
  if (user && walletAddress) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <div className="p-6 bg-white rounded-lg shadow-md max-w-lg w-full">
          <h1 className="text-xl font-bold text-gray-800 mb-4">
            Welcome, {user.sub ? user.sub.split(',')[0].replace('s=', '') : 'User'}!
          </h1>
          
          <div>
            <p><strong>NRIC:</strong> {user.sub ? user.sub.split(',')[0].replace('s=', '') : 'N/A'}</p>
            <p><strong>UUID:</strong> {user.sub ? user.sub.split(',')[1].replace('u=', '') : 'N/A'}</p>
            <p><strong>Wallet Address:</strong> {walletAddress}</p>
          </div>
          
          <div className="mt-4">
            <h2 className="text-lg font-semibold mb-2">User Data:</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60 text-sm">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
          
          <button
            onClick={logout}
            className="mt-4 px-4 py-2 text-white bg-red-600 rounded-lg shadow hover:bg-red-700"
          >
            Logout
          </button>
        </div>
        <DebugSection />
      </div>
    );
  }

  // Not authenticated state
  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="p-6 bg-white rounded-lg shadow-md text-center">
        <h1 className="text-xl font-bold text-gray-800 mb-4">Singpass Web3Auth Demo</h1>
        <button
          onClick={handleLogin}
          className="px-6 py-3 text-white bg-blue-600 rounded-lg shadow hover:bg-blue-700"
        >
          Login with Singpass
        </button>
        
        {/* Manual authentication check for debugging */}
        <div className="mt-4 text-sm text-gray-600">
          <button
            onClick={() => {
              if (localStorage.getItem("id_token")) {
                console.log("Found ID token, triggering login...");
                login().then(() => {
                  console.log("Manual login completed");
                  window.location.reload();
                });
              } else {
                console.log("No ID token found");
              }
            }}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Check Auth Status
          </button>
        </div>
      </div>
      <DebugSection />
    </div>
  );
}