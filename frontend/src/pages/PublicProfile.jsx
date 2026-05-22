import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import Navigation from '../components/Navigation';
import { User, MessageCircle, Calendar, Star, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

const PublicProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiClient(`/users/${id}/`);
        setProfile(res);
      } catch (err) {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  const handleMessage = async () => {
    try {
      const res = await apiClient('/dm/conversations/', {
        method: 'POST',
        body: { user_id: profile.id }
      });
      navigate('/messages', { state: { conversationId: res.id } });
    } catch (err) {
      toast.error('Failed to start conversation');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#0f172a', color: '#f8fafc' }}>
        <Navigation />
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#0f172a', color: '#f8fafc' }}>
        <Navigation />
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>User not found.</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#0f172a', color: '#f8fafc' }}>
      <Navigation />
      <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: '#1e293b', borderRadius: '16px', padding: '3rem', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', border: '1px solid #334155' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '3rem' }}>
            <div style={{ width: '120px', height: '120px', borderRadius: '50%', backgroundColor: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)', overflow: 'hidden' }}>
              {profile.avatar ? (
                <img src={profile.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <User size={60} color="white" />
              )}
            </div>
            
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '2.5rem', margin: '0 0 0.5rem 0', fontWeight: '700', color: 'white' }}>
                {profile.username || profile.email.split('@')[0]}
              </h1>
              <p style={{ color: '#94a3b8', fontSize: '1.1rem', margin: '0 0 1.5rem 0' }}>{profile.email}</p>
              
              <button 
                onClick={handleMessage}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s' }}
              >
                <MessageCircle size={20} />
                Send Message
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div style={{ backgroundColor: '#0f172a', padding: '1.5rem', borderRadius: '12px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <Calendar size={16} /> Date Joined
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: '600', color: 'white' }}>
                {new Date(profile.date_joined).toLocaleDateString()}
              </div>
            </div>

            <div style={{ backgroundColor: '#0f172a', padding: '1.5rem', borderRadius: '12px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <Star size={16} /> Points Earned
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f59e0b' }}>
                {profile.points || 0}
              </div>
            </div>

            <div style={{ backgroundColor: '#0f172a', padding: '1.5rem', borderRadius: '12px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <TrendingUp size={16} /> Current Streak
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981' }}>
                {profile.streak_count || 0} Days
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;
