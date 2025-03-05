const express = require("express");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const jwkToPem = require("jwk-to-pem");
const jose = require("node-jose"); // Required for decrypting `id_token`

const app = express();
const PORT = 3000;
const jwksPath = path.resolve(__dirname, "./oidc-v2-rp-public.json"); // ✅ Ensure the file exists
const jwks = JSON.parse(fs.readFileSync(jwksPath, "utf8"));

app.use(express.json());


// Enable CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// Load the private key for signing and decryption
const keysPath = path.resolve(__dirname, "./oidc-v2-rp-secret.json");
let privateKeyJson;

try {
  privateKeyJson = JSON.parse(fs.readFileSync(keysPath, "utf8"));
  console.log("✅ Loaded private key JSON");
} catch (error) {
  console.error("❌ Failed to load private key file:", error.message);
  process.exit(1);
}

// Extract the signing key (ES512 key for signing client assertion)
const signingKey = privateKeyJson.keys.find(k => k.use === "sig");
if (!signingKey) {
  console.error("❌ No signing key found in JSON");
  process.exit(1);
}
const privateKeyPem = jwkToPem(signingKey, { private: true });

// Extract the encryption key (for decrypting `id_token`)
const decryptionKeyJson = privateKeyJson.keys.find(k => k.use === "enc");
if (!decryptionKeyJson) {
  console.error("❌ No decryption key found in JSON");
  process.exit(1);
}

// Load the public key for verifying `id_token`
const publicKeysPath = path.resolve(__dirname, "./oidc-v2-rp-public.json");
let publicKeyJson;

try {
  publicKeyJson = JSON.parse(fs.readFileSync(publicKeysPath, "utf8"));
  console.log("✅ Loaded public key JSON");
} catch (error) {
  console.error("❌ Failed to load public key file:", error.message);
  process.exit(1);
}

// Extract the verification key (ES512 key for verifying `id_token`)
const verificationKey = publicKeyJson.keys.find(k => k.use === "sig");
if (!verificationKey) {
  console.error("❌ No verification key found in public key JSON");
  process.exit(1);
}
const publicKeyPem = jwkToPem(verificationKey); // Convert JWK to PEM


app.get("/.well-known/jwks.json", (req, res) => {
  res.json(jwks);
});

// Singpass Callback Route
app.get("/singpass/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send("❌ No authorization code received");

  console.log("🔹 Authorization code received:", code);

  try {
    // Create a JWT client assertion for token exchange
    const now = Math.floor(Date.now() / 1000);
    const clientAssertion = jwt.sign(
      {
        iss: "my-mock-client-id",
        sub: "my-mock-client-id",
        aud: "http://localhost:5156/singpass/v2", // MockPass expects this
        jti: Math.random().toString(36).substring(2),
        exp: now + 300,
        iat: now
      },
      privateKeyPem,
      {
        algorithm: "ES512",
        header: { kid: signingKey.kid }
      }
    );

    // Prepare token exchange request
    const formData = new URLSearchParams();
    formData.append("code", code);
    formData.append("client_id", "my-mock-client-id");
    formData.append("client_assertion_type", "urn:ietf:params:oauth:client-assertion-type:jwt-bearer");
    formData.append("client_assertion", clientAssertion);
    // IMPORTANT: Use the frontend URL as redirect_uri to match what was used in authorization request
    formData.append("redirect_uri", "http://localhost:3000"); // Changed to match frontend
    formData.append("grant_type", "authorization_code");

    // Exchange code for tokens
    const tokenResponse = await axios.post(
      "http://localhost:5156/singpass/v2/token",
      formData.toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      }
    );

    const { id_token } = tokenResponse.data;
    if (!id_token) return res.status(500).send("❌ ID token not received");

    const keystore = jose.JWK.createKeyStore();
    keystore.add(decryptionKeyJson, "json").then(async (key) => {
      try {
        const decrypted = await jose.JWE.createDecrypt(key).decrypt(id_token);
        const decryptedToken = decrypted.plaintext.toString();

        console.log("🔹 Decrypted token:", decryptedToken);

        try {
          const decodedToken = jwt.decode(decryptedToken, { complete: true });
          
          res.json({
            message: "✅ Authentication successful!",
            id_token: decryptedToken,
            user: decodedToken,
          });
          

        } catch (verifyError) {
          console.error("❌ Failed to verify decrypted ID Token:", verifyError);
          res.status(500).send(`❌ Failed to verify decrypted ID Token: ${verifyError.message}`);
        }

      } catch (decryptError) {
        console.error("❌ Failed to decrypt ID Token:", decryptError);
        res.status(500).send(`❌ Failed to decrypt ID Token: ${decryptError.message}`);
      }
    });
  } catch (error) {
    console.error("❌ Error exchanging token:");

    if (error.response) {
      console.error("🔴 Response data:", error.response.data);
      console.error("🔴 Response status:", error.response.status);
      return res.status(error.response.status).send(`❌ Token exchange failed: ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      console.error("🔴 No response received");
      return res.status(500).send("❌ Token exchange failed: No response from authentication server");
    } else {
      console.error("🔴 Request setup error:", error.message);
      return res.status(500).send(`❌ Token exchange failed: ${error.message}`);
    }
  }
});

// Start Express server
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
  console.log(`🔄 Callback URL: http://localhost:${PORT}/singpass/callback`);
});
