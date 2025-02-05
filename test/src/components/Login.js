
const handleLogin = () => {
    const clientId = "mock-client";
    const redirectUri = "http://localhost:3000/callback"; // This must match the redirect_uri you configure with MockPass
    const authUrl = "http://localhost:5156/singpass/v2/authorize";
    const nonce = generateNonce(); // Generate a random nonce
    const state = generateState();

    // Redirecting the user to MockPass for authentication
    window.location.href = `${authUrl}?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid&nonce=${nonce}&state=${state}`;
  
};
  
// Function to generate a random nonce
const generateNonce = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// Function to generate a random state
const generateState = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

const Login = () => {
  return (
    <div>
      <h1>Welcome to My App</h1>
      <button onClick={handleLogin}>Login with Singpass (MockPass)</button>
    </div>
  );
};
  
  export default Login;