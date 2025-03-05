import React from 'react';
import { AuthProvider } from './components/AuthProvider';
import LoginScreen from './components/LoginScreen';

function App() {
  return (
    <AuthProvider>
      <LoginScreen />
      {/* Rest of your app components */}
    </AuthProvider>
  );
}

export default App;