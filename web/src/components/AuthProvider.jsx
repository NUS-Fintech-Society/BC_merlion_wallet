import React, { createContext, useContext, useState, useEffect } from "react";
import { Web3AuthNoModal } from "@web3auth/no-modal";
import { AuthAdapter } from "@web3auth/auth-adapter";
import { WALLET_ADAPTERS, WEB3AUTH_NETWORK } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [web3authProvider, setWeb3authProvider] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [authError, setAuthError] = useState(null);

  const chainConfig = {
    chainNamespace: "eip155",
    chainId: "0xaa36a7",
    rpcTarget: "https://rpc.ankr.com/eth_sepolia",
    displayName: "Ethereum Sepolia Testnet",
    ticker: "ETH",
    tickerName: "Ethereum",
  };

  const privateKeyProvider = new EthereumPrivateKeyProvider({
    config: { chainConfig },
  });

  const WEB3AUTH_CLIENT_ID = "BBEEhKVDXyzDULCcrDJx-edxC3eyKtabRQfcZlwWUPvJ1KGlJvkBP-l6c_NzInLcumgXvEEFYuTWw9qix_wYFIk";
  const WEB3AUTH_VERIFIER_ID = "mockpass-verifier";

  const login = async () => {
    // Skip if in process of logging in
    if (loading && initialized) return;
    
    console.log("Starting login process...");
    setLoading(true);
    setAuthError(null);
    
    const id_token = localStorage.getItem("id_token");
    const userData = localStorage.getItem("user");
    
    console.log("ID token exists:", !!id_token);
    console.log("User data exists:", !!userData);
    
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        console.log("Loaded user from localStorage:", parsedUser);
      } catch (e) {
        console.error("Error parsing user data:", e);
        localStorage.removeItem("user");
      }
    }

    if (id_token) {
      try {
        console.log("Initializing Web3Auth...");
        const web3auth = new Web3AuthNoModal({
          clientId: WEB3AUTH_CLIENT_ID,
          web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
          chainConfig: chainConfig,
          privateKeyProvider,
        });

        const authAdapter = new AuthAdapter({
          adapterSettings: {
            loginConfig: {
              mockpass: {
                verifier: WEB3AUTH_VERIFIER_ID,
                typeOfLogin: "jwt",
                clientId: WEB3AUTH_CLIENT_ID,
                verifierSubIdentifier: "sub",
              },
            },
          },
        });

        web3auth.configureAdapter(authAdapter);
        await web3auth.init();
        console.log("Web3Auth initialized successfully");
        
        console.log("Connecting to Web3Auth with token...");
        const provider = await web3auth.connectTo(WALLET_ADAPTERS.AUTH, {
          loginProvider: "jwt",
          extraLoginOptions: {
            id_token: id_token,
            verifierIdField: "sub",
          },
        });
        
        if (provider) {
          console.log("Connected to provider, getting accounts...");
          const accounts = await provider.request({ method: "eth_accounts" });
          console.log("Retrieved accounts:", accounts);
          
          if (accounts && accounts.length > 0) {
            setWalletAddress(accounts[0]);
            setWeb3authProvider(provider);
            console.log("Wallet address set:", accounts[0]);
            
            // If we have a provider but no user data, try to get user info from Web3Auth
            if (!userData) {
              console.log("Getting user info from Web3Auth...");
              const userInfo = await web3auth.getUserInfo();
              console.log("Retrieved user info:", userInfo);
              setUser(userInfo);
              localStorage.setItem("user", JSON.stringify(userInfo));
            }
            
            return true; // Successfully authenticated
          } else {
            console.error("No accounts found from provider");
            setAuthError("No wallet accounts found");
          }
        } else {
          console.error("Failed to connect to provider");
          setAuthError("Failed to connect to Web3Auth provider");
        }
      } catch (error) {
        console.error("Web3Auth Authentication Failed:", error);
        setAuthError(error.message || "Web3Auth authentication failed");
        // Clear invalid tokens if authentication fails
        return false;
      }
    } else {
      console.log("No ID token found, skipping Web3Auth");
    }
    
    setLoading(false);
    return !!walletAddress && !!user; // Return auth state
  };

  // Initialize auth state only once
  useEffect(() => {
    if (!initialized) {
      console.log("Initializing auth state...");
      login().then(result => {
        console.log("Initial auth check result:", result);
        setInitialized(true);
        setLoading(false);
      });
    }
  }, [initialized]);

  const logout = async () => {
    try {
      if (web3authProvider) {
        await web3authProvider.disconnect();
        console.log("Disconnected from Web3Auth provider");
      }
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      setUser(null);
      setWeb3authProvider(null);
      setWalletAddress(null);
      localStorage.removeItem("id_token");
      localStorage.removeItem("user");
      console.log("Logged out successfully");
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        provider: web3authProvider, 
        walletAddress, 
        loading, 
        logout,
        login,
        authError,
        isAuthenticated: !!user && !!walletAddress,
        initialized
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);