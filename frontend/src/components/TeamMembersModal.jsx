import React, { useState, useEffect } from 'react';
import { X, Users, Mail, Shield, UserPlus, Crown, UserMinus } from 'lucide-react';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const TeamMembersModal = ({ isOpen, onClose, team }) => {
  const { user } = useAuth();
  const [teamData, setTeamData] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');

  const fetchTeam = async () => {
    try {
      const res = await apiClient(`/tasks/teams/${team.id}/`);
      setTeamData(res);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isOpen && team) fetchTeam();
  }, [isOpen, team]);

  if (!isOpen || !team) return null;

  const members = teamData?.memberships || [];
  const isOwner = teamData?.owner === user?.id;

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    try {
      await apiClient('/tasks/invitations/', {
        body: { team: team.id, email: inviteEmail, role: inviteRole }
      });
      setInviteEmail('');
      toast.success('Invitation sent!');
      fetchTeam();
    } catch (err) {
      const msg = err?.response?.data?.email?.[0] || err?.response?.data?.detail || 'Failed to send invitation';
      toast.error(typeof msg === 'string' ? msg : 'Failed to send invitation');
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'manager': return '#8b5cf6';
      case 'editor': return '#3b82f6';
      case 'viewer': return '#64748b';
      default: return '#64748b';
    }
  };

  const getRoleIcon = (role) => {
    if (role === 'manager') return <Crown size={14} />;
    return <Shield size={14} />;
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={22} /> Team Members
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {team.name} · {members.length} member{members.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ padding: '0.25rem' }}>
            <X size={24} />
          </button>
        </div>

        {/* Members List */}
        <div style={{ marginBottom: '1.5rem' }}>
          {members.map(m => (
            <div key={m.id} style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
              borderRadius: '10px', marginBottom: '6px',
              backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
              transition: 'background 0.15s'
            }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: `linear-gradient(135deg, ${getRoleColor(m.role)}, ${getRoleColor(m.role)}dd)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 'bold', fontSize: '16px', flexShrink: 0
              }}>
                {(m.username || m.email)?.[0]?.toUpperCase() || '?'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: '500', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {m.username || m.email}
                  {m.id === user?.id && (
                    <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--accent-primary)', color: 'white' }}>You</span>
                  )}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {m.email}
                </div>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600',
                color: getRoleColor(m.role), backgroundColor: `${getRoleColor(m.role)}15`,
                border: `1px solid ${getRoleColor(m.role)}30`, textTransform: 'capitalize'
              }}>
                {getRoleIcon(m.role)} {m.role}
              </div>
            </div>
          ))}
        </div>

        {/* Invite Section */}
        <div style={{
          padding: '1.25rem', borderRadius: '10px',
          backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)'
        }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
            <UserPlus size={18} /> Invite Member
          </h3>
          <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="email"
                className="input-field"
                placeholder="Enter email address"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                required
                style={{ flex: 1 }}
              />
              <select
                className="input-field"
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value)}
                style={{ width: '120px' }}
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                <option value="manager">Manager</option>
              </select>
            </div>
            <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '0.6rem' }}>
              <Mail size={16} /> Send Invitation
            </button>
          </form>
        </div>

        {/* Close button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button onClick={onClose} style={{
            padding: '0.6rem 1.5rem', borderRadius: '8px', backgroundColor: 'transparent',
            color: 'var(--text-primary)', border: '1px solid var(--border-color)', cursor: 'pointer'
          }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamMembersModal;
