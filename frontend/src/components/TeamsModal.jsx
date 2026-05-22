import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Users, Mail, UserPlus, Shield } from 'lucide-react';
import { apiClient } from '../api/client';
import toast from 'react-hot-toast';

const TeamsModal = ({ isOpen, onClose }) => {
  const [teams, setTeams] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const navigate = useNavigate();

  const fetchTeams = async () => {
    try {
      const t = await apiClient('/tasks/teams/');
      setTeams(t.results || t || []);
      const i = await apiClient('/tasks/invitations/');
      setInvitations(i.results || i || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isOpen) fetchTeams();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    try {
      await apiClient('/tasks/teams/', { body: { name: newTeamName } });
      setNewTeamName('');
      toast.success('Team created!');
      fetchTeams();
    } catch (err) {
      toast.error('Failed to create team');
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !selectedTeamId) return;
    try {
      await apiClient('/tasks/invitations/', { 
        body: { team: selectedTeamId, email: inviteEmail } 
      });
      setInviteEmail('');
      toast.success('Invitation sent!');
      fetchTeams();
    } catch (err) {
      toast.error('Failed to send invitation');
    }
  };

  const handleAcceptInvite = async (inviteId) => {
    try {
      await apiClient(`/tasks/invitations/${inviteId}/accept/`, { method: 'POST' });
      toast.success('Joined team!');
      fetchTeams();
    } catch (err) {
      toast.error('Failed to accept invite');
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '600px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users /> Manage Teams
          </h2>
          <button onClick={onClose} className="btn-icon" style={{ padding: '0.25rem' }}>
            <X size={24} />
          </button>
        </div>

        {/* Invitations Section */}
        {invitations.length > 0 && (
          <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Pending Invitations</h3>
            {invitations.map(inv => (
              <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                <div>
                  <span style={{ fontWeight: '500' }}>{inv.team_name}</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginLeft: '0.5rem' }}>invited by {inv.invited_by_name}</span>
                </div>
                {inv.status === 'pending' ? (
                  <button onClick={() => handleAcceptInvite(inv.id)} className="btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}>
                    Accept
                  </button>
                ) : (
                  <span style={{ color: 'var(--success)', fontSize: '0.85rem' }}>{inv.status}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Create Team Form */}
        <form onSubmit={handleCreateTeam} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <input type="text" className="input-field" value={newTeamName} onChange={e => setNewTeamName(e.target.value)} placeholder="New Team Name" style={{ flex: 1 }} />
          <button type="submit" className="btn-primary">Create Team</button>
        </form>

        {/* Teams List & Invite */}
        {teams.length > 0 && (
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Your Teams</h3>
            {teams.map(team => (
              <div key={team.id} style={{ marginBottom: '1.5rem', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem' }}>
                <h4 
                  style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', cursor: 'pointer', color: 'var(--accent-primary)', textDecoration: 'underline' }}
                  onClick={() => {
                    onClose();
                    navigate(`/teams/${team.id}`);
                  }}
                >
                  {team.name}
                </h4>
                
                <div style={{ marginBottom: '1rem' }}>
                  {team.memberships.map(m => (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                      <Shield size={14} color="var(--accent-primary)" />
                      <span>{m.username} ({m.email})</span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'capitalize' }}>- {m.role}</span>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleInvite} style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="email" className="input-field" placeholder="Email to invite" required
                    onChange={(e) => { setInviteEmail(e.target.value); setSelectedTeamId(team.id); }} 
                    style={{ flex: 1, padding: '0.5rem' }} 
                  />
                  <button type="submit" className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem' }}>
                    <Mail size={16} /> Invite
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default TeamsModal;
