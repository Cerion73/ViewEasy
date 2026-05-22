import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { User, Save, Shield, Mail, Camera, Trophy, Flame, Calendar, Activity, BarChart2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user: authUser, setUser: setAuthUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState(null);
  
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    bio: '',
    avatar: null,
    points: 0,
    streak_count: 0,
    cluster: 'Novice',
    date_joined: null
  });

  const [email, setEmail] = useState(''); // Read only for now

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Fetch user data and stats concurrently
        const [userData, statsData] = await Promise.all([
          apiClient('/auth/user/'),
          apiClient('/users/me/profile_stats/')
        ]);
        
        setFormData({
          username: userData.username || '',
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          bio: userData.bio || '',
          avatar: userData.avatar || null,
          points: userData.points || 0,
          streak_count: userData.streak_count || 0,
          cluster: userData.cluster || 'Novice',
          date_joined: userData.date_joined || null
        });
        setEmail(userData.email || '');
        setStats(statsData);
      } catch (err) {
        toast.error('Failed to load profile data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append('avatar', file);

    try {
      toast.loading('Uploading avatar...', { id: 'avatar' });
      const response = await apiClient('/auth/user/', {
        method: 'PATCH',
        body: data,
        // Omit Content-Type to let the browser set the boundary for multipart/form-data
        headers: {} 
      });
      setFormData(prev => ({ ...prev, avatar: response.avatar }));
      setAuthUser(prev => ({ ...prev, avatar: response.avatar }));
      toast.success('Avatar updated!', { id: 'avatar' });
    } catch (err) {
      toast.error('Avatar upload failed.', { id: 'avatar' });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    // We only send text fields here, avatar is handled separately
    const payload = {
      username: formData.username,
      first_name: formData.first_name,
      last_name: formData.last_name,
      bio: formData.bio
    };

    try {
      await apiClient('/auth/user/', {
        method: 'PATCH',
        body: payload
      });
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error('Failed to update profile. Username might be taken.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <Navigation />
      
      <div style={{ maxWidth: '900px', margin: '2rem auto' }}>
        
        {/* Gamification Banner */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)', padding: '1.5rem', borderRadius: '12px', color: '#B31250', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Flame size={32} />
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Current Streak</div>
              <div style={{ fontSize: '1.8rem', fontWeight: '900' }}>{formData.streak_count} Days</div>
            </div>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #F6D365 0%, #FDA085 100%)', padding: '1.5rem', borderRadius: '12px', color: '#A04300', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Trophy size={32} />
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Points Earned</div>
              <div style={{ fontSize: '1.8rem', fontWeight: '900' }}>{formData.points}</div>
            </div>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #84FAB0 0%, #8FD3F4 100%)', padding: '1.5rem', borderRadius: '12px', color: '#005C45', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Activity size={32} />
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>User Cluster</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '900' }}>{formData.cluster}</div>
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '3rem', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '3rem', paddingBottom: '2rem', borderBottom: '1px solid var(--border-color)' }}>
            
            {/* Avatar with Upload */}
            <div style={{ position: 'relative' }}>
              <div style={{ width: '120px', height: '120px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '3rem', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', overflow: 'hidden', backgroundImage: formData.avatar ? `url(${formData.avatar})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
                {!formData.avatar && (formData.username ? formData.username.charAt(0).toUpperCase() : <User size={48} />)}
              </div>
              <label style={{ position: 'absolute', bottom: '0', right: '0', background: 'var(--accent-secondary)', color: 'white', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '3px solid var(--bg-secondary)', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', transition: 'transform 0.2s' }} className="hover-scale">
                <Camera size={20} />
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
              </label>
            </div>

            <div>
              <h1 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0' }}>{formData.first_name || formData.username || 'Welcome!'} {formData.last_name}</h1>
              <p style={{ margin: 0, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Mail size={16} /> {email || 'Loading...'}</span>
                {formData.date_joined && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={16} /> Joined {new Date(formData.date_joined).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
                  </span>
                )}
              </p>
            </div>
          </div>

          <form onSubmit={handleSave}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-secondary)' }}>First Name</label>
                <input 
                  type="text" 
                  name="first_name"
                  value={formData.first_name} 
                  onChange={handleChange}
                  className="input-field" 
                  placeholder="John"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Last Name</label>
                <input 
                  type="text" 
                  name="last_name"
                  value={formData.last_name} 
                  onChange={handleChange}
                  className="input-field" 
                  placeholder="Doe"
                />
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Username</label>
              <input 
                type="text" 
                name="username"
                value={formData.username} 
                onChange={handleChange}
                className="input-field" 
                placeholder="johndoe"
              />
            </div>

            <div style={{ marginBottom: '3rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Bio / About Me</label>
              <textarea 
                name="bio"
                value={formData.bio} 
                onChange={handleChange}
                className="input-field" 
                placeholder="Tell us a little bit about yourself..."
                style={{ minHeight: '150px', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield size={16} /> Your email is private and cannot be changed here.
              </p>
              <button 
                type="submit" 
                className="btn-primary" 
                disabled={loading || saving}
                style={{ padding: '0.75rem 2rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Save size={20} /> {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>

        </div>

        {/* Analytics Section */}
        {stats && (
          <div style={{ marginTop: '2rem', backgroundColor: 'var(--bg-secondary)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.4rem' }}>
              <BarChart2 size={24} color="var(--accent-primary)" /> Task Analytics Averages
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem 1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Daily</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{stats.daily}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem 1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Weekly</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--accent-secondary)' }}>{stats.weekly}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem 1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Monthly</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#4caf50' }}>{stats.monthly}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem 1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Quarterly</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#ff9800' }}>{stats.quarterly}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem 1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Yearly</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#e91e63' }}>{stats.yearly}</div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Profile;
