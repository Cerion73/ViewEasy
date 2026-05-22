import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import { useGoogleLogin } from '@react-oauth/google';
import { apiClient } from '../api/client';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [verifyPassword, setVerifyPassword] = useState('');
  const [pendingGoogleToken, setPendingGoogleToken] = useState(null);

  const { login, loginWithToken } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(username, password);
      // For a real app, if 2FA is needed, redirect to a 2FA prompt instead
      navigate('/dashboard');
    } catch (err) {
      setError('Login failed. Please check your credentials.');
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
          const response = await apiClient('/auth/google/', {
              body: { access_token: tokenResponse.access_token }
          });
          await loginWithToken();
          navigate('/dashboard');
      } catch (err) {
          if (err.message && err.message.includes('requires_password_verification')) {
              setPendingGoogleToken(tokenResponse.access_token);
              setShowPasswordModal(true);
          } else {
              setError('Google authentication failed.');
          }
      }
    },
    onError: () => setError('Google Login Failed')
  });

  const handleVerifyGooglePassword = async (e) => {
      e.preventDefault();
      setError('');
      try {
          await apiClient('/auth/google/', {
              body: { access_token: pendingGoogleToken, password: verifyPassword }
          });
          setShowPasswordModal(false);
          await loginWithToken();
          navigate('/dashboard');
      } catch (err) {
          setError('Invalid password. Please try again.');
      }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
        <ThemeToggle />
      </div>
      <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <LogIn size={48} color="var(--accent-primary)" style={{ marginBottom: '1rem' }} />
          <h2>Welcome Back</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Sign in to continue to ViewEasy</p>
        </div>

        {error && (
          <div style={{ backgroundColor: 'var(--danger)', color: 'white', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>Username</label>
            <input type="text" className="input-field" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>Password</label>
            <input type="password" className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <div style={{ textAlign: 'right', marginTop: '0.25rem' }}>
              <Link to="/reset-password" style={{ fontSize: '0.8rem', color: 'var(--accent-primary)' }}>Forgot Password?</Link>
            </div>
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}>
            Sign In
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
          <button type="button" onClick={() => handleGoogleLogin()} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#fff', color: '#757575', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: '500' }}>
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google logo" style={{ width: '18px', height: '18px' }} />
            Sign in with Google
          </button>
        </div>

        <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
          Don't have an account? <Link to="/register" style={{ fontWeight: '500' }}>Sign Up</Link>
        </p>
      </div>

      {/* Password Verification Modal */}
      {showPasswordModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>Verify Password</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              An account with this email already exists. Please enter your ViewEasy password to securely link your Google account.
            </p>
            {error && (
              <div style={{ backgroundColor: 'var(--danger)', color: 'white', padding: '0.5rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}
            <form onSubmit={handleVerifyGooglePassword}>
              <input 
                type="password" 
                className="input-field" 
                value={verifyPassword} 
                onChange={e => setVerifyPassword(e.target.value)} 
                placeholder="Your ViewEasy Password" 
                required 
                style={{ width: '100%', marginBottom: '1rem' }} 
              />
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" onClick={() => { setShowPasswordModal(false); setError(''); }} className="btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  Verify & Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
