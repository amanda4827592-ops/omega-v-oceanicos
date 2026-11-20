import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { StandaloneVerifier } from './StandaloneVerifier.tsx';
import './App.css';
import './tokens.css';
import './verifier.css';

const isVerifierRoute = window.location.pathname === '/verify' || window.location.pathname === '/verifier';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isVerifierRoute ? <StandaloneVerifier onBack={() => { window.location.href = '/'; }} /> : <App />}
  </React.StrictMode>
);
