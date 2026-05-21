import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import zxcvbn from 'zxcvbn';
import { useGoogleLogin } from '@react-oauth/google';
import { apiClient } from '../api/client';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordScore, setPasswordScore] = useState(0);
  const [error, setError] = useState('');
  const { register, loginWithToken } = useAuth();
  const navigate = useNavigate();

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    setPasswordScore(zxcvbn(val).score);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (passwordScore < 2) {
      setError('Password is too weak. Please choose a stronger password.');
      return;
    }
    setError('');
    try {
      await register({ username, email, password, password1: password, password2: password });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed.');
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
          setError('Google authentication failed.');
      }
    },
    onError: () => setError('Google Login Failed')
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
        <ThemeToggle />
      </div>
      <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <UserPlus size={48} color="var(--accent-primary)" style={{ marginBottom: '1rem' }} />
          <h2>Create Account</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Sign up to get started with ViewEasy</p>
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
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>Email</label>
            <input type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>Password</label>
            <input type="password" className="input-field" value={password} onChange={handlePasswordChange} required />
            {password && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                  {[...Array(4)].map((_, i) => (
                    <div key={i} style={{ height: '4px', flex: 1, backgroundColor: i < passwordScore ? (passwordScore >= 3 ? 'var(--success)' : 'orange') : 'var(--border-color)', borderRadius: '2px' }} />
                  ))}
                </div>
                <span style={{ color: 'var(--text-secondary)' }}>
                  Strength: {['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'][passwordScore]}
                </span>
              </div>
            )}
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}>
            Register
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
          <button type="button" onClick={() => handleGoogleLogin()} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#fff', color: '#757575', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: '500' }}>
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google logo" style={{ width: '18px', height: '18px' }} />
            Sign in with Google
          </button>
        </div>

        <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
          Already have an account? <Link to="/login" style={{ fontWeight: '500' }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
