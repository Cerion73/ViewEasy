import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTeam } from '../context/TeamContext';
import { LogOut, Calendar, LayoutDashboard, Users, Plus, Trash2, User, Mail, Search, ArrowLeft, MessageSquare } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import TeamsModal from './TeamsModal';
import TaskModal from './TaskModal';
import TeamMembersModal from './TeamMembersModal';
import { apiClient } from '../api/client';

const Navigation = ({ onTaskCreated }) => {
  const { user, logout } = useAuth();
  const { activeTeam, switchToPersonal } = useTeam();
  const navigate = useNavigate();
  const [isTeamsModalOpen, setIsTeamsModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      switchToPersonal();
      logout();
    }
  };

  const handleBackToPersonal = () => {
    switchToPersonal();
    navigate('/dashboard');
  };

  const ProfileMenu = () => (
    <div style={{ position: 'relative' }}>
      <button 
        onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} 
        style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', border: 'none', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}
        title="Profile Menu"
      >
        {user?.username ? user.username.charAt(0).toUpperCase() : <User size={18} />}
      </button>

      {isProfileMenuOpen && (
        <>
          <div 
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }} 
            onClick={() => setIsProfileMenuOpen(false)} 
          />
          <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', minWidth: '180px', zIndex: 1000, overflow: 'hidden' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{user?.username || 'User'}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{user?.email || ''}</div>
            </div>
            <NavLink 
              to="/profile" 
              onClick={() => setIsProfileMenuOpen(false)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', textDecoration: 'none', color: 'var(--text-primary)', transition: 'background 0.2s' }}
            >
              <User size={16} /> My Profile
            </NavLink>
            <button 
              onClick={() => { setIsProfileMenuOpen(false); handleLogout(); }} 
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', backgroundColor: 'transparent', border: 'none', borderTop: '1px solid var(--border-color)', color: 'var(--danger)', cursor: 'pointer', textAlign: 'left', fontWeight: '600', transition: 'background 0.2s' }}
            >
              <LogOut size={16} /> Log out
            </button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <>
      <style>
        {`
          .desktop-nav {
            display: flex;
            gap: 1rem;
            background-color: var(--bg-secondary);
            padding: 0.5rem;
            border-radius: 12px;
            border: 1px solid var(--border-color);
          }
          .team-banner {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.4rem 1rem;
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            border-radius: 10px;
            color: white;
            font-size: 0.85rem;
            font-weight: 600;
            margin-right: 0.5rem;
            box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
          }
          .team-banner button {
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            cursor: pointer;
            padding: 0.25rem 0.5rem;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 4px;
            transition: background 0.2s;
          }
          .team-banner button:hover {
            background: rgba(255,255,255,0.35);
          }
          .mobile-bottom-bar {
            display: none;
          }
          
          @media (max-width: 768px) {
            .desktop-nav {
              display: none !important;
            }
            .desktop-actions {
              display: none !important;
            }
            .mobile-top-actions {
              display: flex !important;
            }
            
            .mobile-bottom-bar {
              display: flex;
              position: fixed;
              bottom: 0;
              left: 0;
              right: 0;
              height: 70px;
              background-color: var(--bg-secondary);
              border-top: 1px solid var(--border-color);
              z-index: 1000;
              justify-content: space-around;
              align-items: center;
              padding: 0 0.5rem;
              padding-bottom: env(safe-area-inset-bottom);
              box-shadow: 0 -4px 20px rgba(0,0,0,0.1);
            }
            
            .mobile-tab {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 4px;
              color: var(--text-secondary);
              text-decoration: none;
              font-size: 0.7rem;
              flex: 1;
              height: 100%;
            }
            .mobile-tab.active {
              color: var(--accent-primary);
            }
            
            .mobile-fab {
              background: var(--accent-primary);
              color: white;
              border-radius: 50%;
              width: 50px;
              height: 50px;
              display: flex;
              align-items: center;
              justify-content: center;
              transform: translateY(-20px);
              box-shadow: 0 4px 10px rgba(99, 102, 241, 0.4);
              border: none;
              cursor: pointer;
            }
            
            body {
              padding-bottom: 90px;
            }
          }
        `}
      </style>

      {/* Top Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <img src="/logo.png" alt="ViewEasy Logo" style={{ width: '48px', height: '48px', borderRadius: '8px' }} />
          
          {/* Team Mode Banner */}
          {activeTeam && (
            <div className="team-banner">
              <Users size={16} />
              <span>{activeTeam.name}</span>
              <button onClick={handleBackToPersonal}>
                <ArrowLeft size={12} /> Personal
              </button>
              <button onClick={() => navigate(`/teams/${activeTeam.id}`)}>
                <MessageSquare size={12} /> Chat
              </button>
            </div>
          )}
          
          {/* Desktop Navigation */}
          <nav className="desktop-nav">
            <NavLink to="/dashboard" style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '8px',
              textDecoration: 'none', color: isActive ? 'white' : 'var(--text-secondary)',
              backgroundColor: isActive ? 'var(--accent-primary)' : 'transparent', fontWeight: isActive ? '600' : 'normal',
              transition: 'all 0.2s'
            })}>
              <LayoutDashboard size={18} /> {activeTeam ? 'Team Board' : 'Kanban Board'}
            </NavLink>
            <NavLink to="/planner" style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '8px',
              textDecoration: 'none', color: isActive ? 'white' : 'var(--text-secondary)',
              backgroundColor: isActive ? 'var(--accent-primary)' : 'transparent', fontWeight: isActive ? '600' : 'normal',
              transition: 'all 0.2s'
            })}>
              <Calendar size={18} /> {activeTeam ? 'Team Planner' : 'Daily Planner'}
            </NavLink>
            <NavLink to="/trash" style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '8px',
              textDecoration: 'none', color: isActive ? 'white' : 'var(--text-secondary)',
              backgroundColor: isActive ? 'var(--accent-primary)' : 'transparent', fontWeight: isActive ? '600' : 'normal',
              transition: 'all 0.2s'
            })}>
              <Trash2 size={18} /> Trash Bin
            </NavLink>
          </nav>
        </div>

        {/* Desktop Actions */}
        <div className="desktop-actions" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
{!activeTeam && (
              <>
                <NavLink to="/discover" style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '8px',
                  textDecoration: 'none', color: isActive ? 'white' : 'var(--text-primary)',
                  backgroundColor: isActive ? 'var(--accent-primary)' : 'transparent',
                  fontWeight: isActive ? '600' : 'normal',
                  transition: 'all 0.2s'
                })}>
                  <Search size={18} /> Discover
                </NavLink>
                <NavLink to="/messages" style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '8px',
                  textDecoration: 'none', color: isActive ? 'white' : 'var(--text-primary)',
                  backgroundColor: isActive ? 'var(--accent-primary)' : 'transparent',
                  fontWeight: isActive ? '600' : 'normal',
                  transition: 'all 0.2s'
                })}>
                  <Mail size={18} /> Messages
                </NavLink>
                <button onClick={() => setIsTeamsModalOpen(true)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
                  <Users size={18} /> Teams
                </button>
              </>
            )}
          {activeTeam && (
            <button onClick={() => setIsMembersModalOpen(true)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
              <Users size={18} /> Members
            </button>
          )}
          <button onClick={() => setIsTaskModalOpen(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
            <Plus size={18} /> New Task
          </button>
          <ThemeToggle />
          <ProfileMenu />
        </div>
        
        {/* Mobile Top Actions */}
        <div className="mobile-top-actions" style={{ display: 'none', gap: '1rem', alignItems: 'center' }}>
          <ThemeToggle />
          <ProfileMenu />
        </div>
      </header>

      {/* Mobile Bottom Tab Bar */}
      <nav className="mobile-bottom-bar">
        <NavLink to="/dashboard" className={({ isActive }) => `mobile-tab ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={24} />
          <span>{activeTeam ? 'Board' : 'Kanban'}</span>
        </NavLink>
        
        <NavLink to="/planner" className={({ isActive }) => `mobile-tab ${isActive ? 'active' : ''}`}>
          <Calendar size={24} />
          <span>Planner</span>
        </NavLink>
        
        <button onClick={() => setIsTaskModalOpen(true)} className="mobile-fab" aria-label="New Task">
          <Plus size={24} color="white" />
        </button>
        
        <button onClick={() => setIsTeamsModalOpen(true)} className="mobile-tab" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <Users size={24} />
          <span>Teams</span>
        </button>
        
        <NavLink to="/messages" className={({ isActive }) => `mobile-tab ${isActive ? 'active' : ''}`}>
          <Mail size={24} />
          <span>Messages</span>
        </NavLink>
        
        <NavLink to="/discover" className={({ isActive }) => `mobile-tab ${isActive ? 'active' : ''}`}>
          <Search size={24} />
          <span>Discover</span>
        </NavLink>
        
        <NavLink to="/trash" className={({ isActive }) => `mobile-tab ${isActive ? 'active' : ''}`}>
          <Trash2 size={24} />
          <span>Trash</span>
        </NavLink>
      </nav>

      {/* Modals */}
      <TeamsModal isOpen={isTeamsModalOpen} onClose={() => setIsTeamsModalOpen(false)} />
      <TeamMembersModal isOpen={isMembersModalOpen} onClose={() => setIsMembersModalOpen(false)} team={activeTeam} />
      <TaskModal 
        isOpen={isTaskModalOpen} 
        onClose={() => setIsTaskModalOpen(false)} 
        onSubmit={async (data) => {
          if (onTaskCreated) {
            onTaskCreated(data);
          } else {
            try {
              await apiClient('/tasks/', { body: data });
            } catch (err) {
              console.error('Failed to create task', err);
            }
          }
          setIsTaskModalOpen(false);
        }} 
      />
    </>
  );};

export default Navigation;
