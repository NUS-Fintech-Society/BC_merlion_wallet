import { Button } from "@/components/ui/button";
import { PrivyProvider, usePrivy } from "@privy-io/react-auth";
import { createConfig, WagmiProvider } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCallback } from "react";
import { mainnet, sepolia } from "viem/chains";
import { http } from "wagmi";
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";

export const config = createConfig({
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
});

const queryClient = new QueryClient();

function App() {
  return (
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: window.location.origin,
      }}
    >
      <Web3Provider />
    </Auth0Provider>
  );
}

function Web3Provider() {
  // Get auth details from Auth0
  const { getAccessTokenSilently, isLoading, isAuthenticated } = useAuth0();

  // Wrap getAccessTokenSilently as necessary (explained below)
  const getCustomToken = useCallback(
    () => getAccessTokenSilently(),
    [isAuthenticated, getAccessTokenSilently]
  );
  return (
    <PrivyProvider
      appId={import.meta.env.VITE_PRIVY_APP_ID}
      config={{
        loginMethods: ["email", "wallet"],
        appearance: {
          theme: "light",
          accentColor: "#676FFF",
          logo: "https://your-logo-url",
        },
        embeddedWallets: {
          createOnLogin: "users-without-wallets",
        },
        customAuth: {
          isLoading,
          getCustomAccessToken: getCustomToken,
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          <LoginButton />
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}

function LoginButton() {
  const { ready, authenticated, login } = usePrivy();
  const disableLogin = !ready || (ready && authenticated);

  return (
    <Button disabled={disableLogin} onClick={login}>
      Log in
    </Button>
  );
}

export default App;
