import { useEffect, useState } from 'react';

const Callback = () => {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get('code'); // This grabs the ?code=abc123 from the URL

    if (authCode) {
      exchangeCodeForToken(authCode);
    }
  }, []);

  const exchangeCodeForToken = async (code) => {
    try {
      const response = await fetch('http://localhost:5156/singpass/v2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: 'http://localhost:3000/callback',
          client_id: 'mock-client',
        }),
      });

      const data = await response.json();
      console.log('Tokens:', data);

      // Now use the access token to get user profile data
      fetchUserProfile(data.access_token);
    } catch (error) {
      console.error('Token exchange failed:', error);
    }
  };

  const fetchUserProfile = async (accessToken) => {
    try {
      const response = await fetch('http://localhost:5156/myinfo/v3/person', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const profileData = await response.json();
      console.log('User Profile:', profileData);
      setProfile(profileData);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };

  return (
    <div>
      <h2>Authenticating...</h2>
      {profile && (
        <div>
          <h3>Welcome, {profile.name.value}</h3>
          <p>Email: {profile.email.value}</p>
          <p>Phone: {profile.mobileno.value}</p>
        </div>
      )}
    </div>
  );
};

export default Callback;
