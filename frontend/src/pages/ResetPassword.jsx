import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import { apiClient } from '../api/client';

const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await apiClient('/auth/password/reset/', {
        body: { email }
      });
      setMessage('Password reset e-mail has been sent.');
    } catch (err) {
      setError(err.message || 'Failed to send reset email.');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
        <ThemeToggle />
      </div>
      <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <KeyRound size={48} color="var(--accent-primary)" style={{ marginBottom: '1rem' }} />
          <h2>Reset Password</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Enter your email to receive a reset link</p>
        </div>

        {error && (
          <div style={{ backgroundColor: 'var(--danger)', color: 'white', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}
        
        {message && (
          <div style={{ backgroundColor: 'var(--success)', color: 'white', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>Email</label>
            <input type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}>
            Send Reset Link
          </button>
        </form>

        <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
          Remember your password? <Link to="/login" style={{ fontWeight: '500' }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
