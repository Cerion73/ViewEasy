import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { apiClient } from '../api/client';
import { ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const TwoFactorSetup = () => {
  const [qrCodeData, setQrCodeData] = useState(null);
  const [secret, setSecret] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    fetchSetupData();
  }, []);

  const fetchSetupData = async () => {
    try {
      const data = await apiClient('/2fa/setup/');
      setQrCodeData(data.qr_code);
      setSecret(data.secret);
    } catch (err) {
      console.error('Failed to load 2FA setup');
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      await apiClient('/2fa/verify/', { body: { token } });
      toast.success('2FA successfully enabled!');
      setToken('');
    } catch (err) {
      toast.error('Invalid token. Try again.');
    }
  };

  return (
    <div className="card" style={{ maxWidth: '400px', margin: '2rem auto', textAlign: 'center' }}>
      <ShieldCheck size={48} color="var(--accent-primary)" style={{ marginBottom: '1rem' }} />
      <h2>Setup 2FA (TOTP)</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Scan this QR code with Google Authenticator or Authy</p>
      
      {qrCodeData && (
        <div style={{ background: 'white', padding: '1rem', display: 'inline-block', borderRadius: '12px', marginBottom: '1.5rem' }}>
          {/* Render base64 image */}
          <img src={qrCodeData} alt="2FA QR Code" style={{ width: '200px', height: '200px' }} />
        </div>
      )}
      
      {secret && (
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', wordBreak: 'break-all' }}>
          Manual Code: <strong>{secret}</strong>
        </p>
      )}

      <form onSubmit={handleVerify} style={{ display: 'flex', gap: '0.5rem' }}>
        <input 
          type="text" 
          className="input-field" 
          placeholder="Enter 6-digit token" 
          value={token} 
          onChange={(e) => setToken(e.target.value)} 
          maxLength={6}
          required 
        />
        <button type="submit" className="btn-primary">Verify</button>
      </form>
    </div>
  );
};

export default TwoFactorSetup;
