import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../api/client';
import html2canvas from 'html2canvas';
import { Share2, Download, Mail, Link, BarChart2 } from 'lucide-react';
import toast from 'react-hot-toast';

const AnalyticsDashboard = () => {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState('this_week');
  const [cardTheme, setCardTheme] = useState(0);
  const cardRef = useRef(null);

  const themes = [
    'linear-gradient(135deg, #2d1f40 0%, #1a1a2e 100%)', // Original Purple
    'linear-gradient(135deg, #1f4037 0%, #1a2a22 100%)', // Dark Forest
    'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)', // Midnight Blue
    'linear-gradient(135deg, #cb2d3e 0%, #4a1118 100%)', // Crimson Dark
    'linear-gradient(135deg, #4b6cb7 0%, #182848 100%)', // Ocean Dark
    'linear-gradient(135deg, #111111 0%, #333333 100%)', // Graphite
  ];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiClient('/analytics/tasks/stats/');
        setStats(data || {});
      } catch (err) {
        console.error('Failed to fetch analytics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2, // High resolution
        backgroundColor: '#1a1a1a', // Match dark theme
        useCORS: true
      });
      
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `ViewEasy_Unwrapped_${activeSlide}.png`;
      link.click();
      toast.success('Card downloaded! You can now attach it to any social media post.');
    } catch (err) {
      toast.error('Failed to capture card.');
    }
  };

  const shareLinks = (platform) => {
    const text = `I just checked my ViewEasy Analytics stats! ${stats[activeSlide]?.commentary} 🔥 Organize your life at ViewEasy.`;
    const url = encodeURIComponent(window.location.origin);
    const encodedText = encodeURIComponent(text);

    const links = {
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      reddit: `https://reddit.com/submit?url=${url}&title=${encodedText}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      email: `mailto:?subject=My ViewEasy Unwrapped&body=${encodedText} %0A%0A ${url}`,
      whatsapp: `https://api.whatsapp.com/send?text=${encodedText} ${url}`
    };

    window.open(links[platform], '_blank');
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Analytics...</div>;

  const order = ['today', 'this_week', 'this_month', 'this_quarter', 'half_year', 'this_year'];
  const activeData = stats[activeSlide];

  return (
    <div style={{ marginTop: '3rem', backgroundColor: 'var(--bg-secondary)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
      <style>
        {`
          .analytics-container {
            display: flex;
            gap: 2rem;
          }
          @media (max-width: 768px) {
            .analytics-container {
              flex-direction: column;
            }
          }
        `}
      </style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BarChart2 size={24} color="var(--accent-primary)" /> ViewEasy Analytics
        </h2>
        
        {/* Timeframe Selector */}
        <select 
          className="input-field" 
          value={activeSlide} 
          onChange={(e) => setActiveSlide(e.target.value)}
          style={{ width: 'auto', padding: '0.5rem 1rem' }}
        >
          {order.map(key => stats[key] && (
            <option key={key} value={key}>{stats[key].title}</option>
          ))}
        </select>
      </div>

      <div className="analytics-container">
        {/* The Card */}
        <div 
          ref={cardRef}
          style={{ 
            flex: '1', 
            minWidth: '280px', 
            maxWidth: '100%', 
            background: themes[cardTheme],
            borderRadius: '16px',
            padding: '2rem',
            color: 'white',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Decorative shapes */}
          <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '150px', height: '150px', background: 'var(--accent-primary)', filter: 'blur(50px)', opacity: 0.3, borderRadius: '50%' }}></div>
          <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '100px', height: '100px', background: 'var(--accent-secondary)', filter: 'blur(40px)', opacity: 0.3, borderRadius: '50%' }}></div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', position: 'relative', zIndex: 1 }}>
            <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, letterSpacing: '1px' }}>{activeData?.title}</h3>
            {/* Watermark */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.9 }}>
              <img src="/logo.png" alt="ViewEasy Logo" style={{ width: '24px', height: '24px', borderRadius: '4px' }} />
              <span style={{ fontWeight: 'bold', letterSpacing: '1px' }}>ViewEasy</span>
            </div>
          </div>

          <div style={{ position: 'relative', zIndex: 1, marginBottom: '2rem' }}>
            <p style={{ fontSize: '1.8rem', fontWeight: '800', lineHeight: 1.3, marginBottom: '1.5rem', color: '#e0d4ff' }}>
              "{activeData?.commentary}"
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', position: 'relative', zIndex: 1 }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '0.85rem', color: '#aab', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.25rem' }}>Created</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{activeData?.total}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '0.85rem', color: '#aab', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.25rem' }}>Completed</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4caf50' }}>{activeData?.completed}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '0.85rem', color: '#aab', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.25rem' }}>In Progress</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2196f3' }}>{activeData?.stuck}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '0.85rem', color: '#aab', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.25rem' }}>Abandoned</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f44336' }}>{activeData?.abandoned}</div>
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '1.5rem', justifyContent: 'center' }}>
          <div>
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1.2rem' }}>Share Your Analytics!</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Download your personalized stat card to attach to a post, or share a quick text summary directly to your favorite socials.
            </p>
            
            {/* Theme Picker */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Select Card Theme</h4>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {themes.map((theme, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setCardTheme(idx)}
                    style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      background: theme,
                      border: cardTheme === idx ? '2px solid var(--accent-primary)' : '2px solid transparent',
                      cursor: 'pointer',
                      padding: 0,
                      boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                    }}
                    title={`Theme ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
            
            <button onClick={handleDownloadImage} style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '1.5rem', background: themes[cardTheme], color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
              <Download size={20} /> Download Image Card
            </button>
            
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button onClick={() => shareLinks('twitter')} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', fontWeight: 'bold', background: themes[cardTheme], color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }} title="Share to X">
                𝕏
              </button>
              <button onClick={() => shareLinks('linkedin')} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', fontWeight: 'bold', background: themes[cardTheme], color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }} title="Share to LinkedIn">
                in
              </button>
              <button onClick={() => shareLinks('facebook')} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', fontWeight: 'bold', background: themes[cardTheme], color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }} title="Share to Facebook">
                f
              </button>
              <button onClick={() => shareLinks('email')} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: themes[cardTheme], color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }} title="Share via Email">
                <Mail size={20} />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AnalyticsDashboard;
