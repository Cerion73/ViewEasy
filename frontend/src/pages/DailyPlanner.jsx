import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTeam } from '../context/TeamContext';
import { useNotification } from '../context/NotificationContext';
import { Plus, CheckCircle, Circle, Save, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const DailyPlanner = () => {
  const { user } = useAuth();
  const { activeTeam } = useTeam();
  const { syncTrigger } = useNotification();
  
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [activeTab, setActiveTab] = useState('checklist');
  
  const [achievement, setAchievement] = useState('');
  const [achievementId, setAchievementId] = useState(null);
  
  const todayDateStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayDateStr);

  const fetchDailyData = async () => {
    try {
      const endpoint = activeTeam ? `/tasks/?team=${activeTeam.id}` : '/tasks/?personal=true';
      const taskRes = await apiClient(endpoint);
      const allTasks = taskRes.results || taskRes || [];
      const todaysTasks = allTasks.filter(t => {
        if (!t.due_date) return false;
        return t.due_date.startsWith(selectedDate);
      });
      setTasks(todaysTasks);

      // Achievements (personal only — team mode shows shared view)
      const achRes = await apiClient('/tasks/daily-achievements/');
      const achievements = achRes.results || achRes || [];
      const currentAch = achievements.find(a => a.date === selectedDate);
      if (currentAch) {
        setAchievement(currentAch.content || '');
        setAchievementId(currentAch.id);
      } else {
        setAchievement('');
        setAchievementId(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDailyData();
  }, [selectedDate, syncTrigger, activeTeam]);

  const handleQuickAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const due = new Date(`${selectedDate}T23:59:59`).toISOString();
      const payload = {
        title: newTaskTitle,
        status: 'pending',
        due_date: due
      };
      if (activeTeam) payload.team = activeTeam.id;
      
      await apiClient('/tasks/', { body: payload });
      setNewTaskTitle('');
      fetchDailyData();
    } catch (err) {
      toast.error('Failed to add task');
    }
  };

  const toggleTaskCompletion = async (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    try {
      await apiClient(`/tasks/${task.id}/`, { method: 'PATCH', body: { status: newStatus } });
    } catch (err) {
      toast.error('Failed to update task');
      fetchDailyData();
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to move this task to the trash?")) return;
    try {
      await apiClient(`/tasks/${taskId}/`, { method: 'DELETE' });
      fetchDailyData();
      toast.success('Task moved to trash');
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };

  const handleSaveAchievement = async () => {
    try {
      if (achievementId) {
        await apiClient(`/tasks/daily-achievements/${achievementId}/`, {
          method: 'PATCH',
          body: { content: achievement }
        });
      } else {
        const res = await apiClient('/tasks/daily-achievements/', {
          body: { date: selectedDate, content: achievement }
        });
        setAchievementId(res.id);
      }
      toast.success('Achievement saved!');
    } catch (err) {
      toast.error('Failed to save achievement');
    }
  };

  const plannerLabel = activeTeam ? `Team Planner: ${activeTeam.name}` : 'Daily Planner';

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <Navigation />

      {activeTeam && (
        <div style={{ marginBottom: '1.5rem', padding: '0.75rem 1.25rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.1rem' }}>👥</span>
          <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{plannerLabel}</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
            Tasks created here are scoped to this team
          </span>
        </div>
      )}

      <style>
        {`
          .planner-grid {
            display: flex;
            gap: 2rem;
            margin-top: 1rem;
          }
          .mobile-tabs {
            display: none;
          }
          @media (max-width: 768px) {
            .planner-grid {
              flex-direction: column;
            }
            .mobile-tabs {
              display: flex;
              gap: 0.5rem;
              margin-bottom: 1rem;
            }
            .mobile-tab-btn {
              flex: 1;
              padding: 0.75rem;
              border-radius: 8px;
              border: 1px solid var(--border-color);
              background: var(--bg-secondary);
              color: var(--text-secondary);
              font-weight: 600;
              cursor: pointer;
            }
            .mobile-tab-btn.active {
              background: var(--accent-primary);
              color: white;
              border-color: var(--accent-primary);
            }
            .col-checklist {
              display: ${activeTab === 'checklist' ? 'block' : 'none'};
            }
            .col-diary {
              display: ${activeTab === 'diary' ? 'flex' : 'none'};
            }
          }
        `}
      </style>

      <div className="mobile-tabs">
        <button 
          className={`mobile-tab-btn ${activeTab === 'checklist' ? 'active' : ''}`}
          onClick={() => setActiveTab('checklist')}
        >
          Daily Checklist
        </button>
        <button 
          className={`mobile-tab-btn ${activeTab === 'diary' ? 'active' : ''}`}
          onClick={() => setActiveTab('diary')}
        >
          Achievements Log
        </button>
      </div>

      <div className="planner-grid">
        
        {/* Left Column: Incremental Checklist */}
        <div className="col-checklist" style={{ flex: '1', backgroundColor: 'var(--bg-secondary)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.4rem', margin: 0 }}>
              {activeTeam ? `${activeTeam.name} Checklist` : 'Daily Checklist'}
            </h2>
            <input 
              type="date" 
              value={selectedDate} 
              onChange={e => setSelectedDate(e.target.value)}
              className="input-field"
              style={{ width: 'auto', padding: '0.25rem 0.5rem' }}
            />
          </div>

          <form onSubmit={handleQuickAddTask} style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
            <input 
              type="text" 
              className="input-field" 
              placeholder={activeTeam ? `Add a task for ${activeTeam.name}...` : 'What are you focusing on today?'}
              value={newTaskTitle}
              onChange={e => setNewTaskTitle(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1rem' }}>
              <Plus size={20} />
            </button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {tasks.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center' }}>
                No {activeTeam ? 'team ' : ''}tasks scheduled for this day.
              </p>
            ) : (
              tasks.map(task => (
                <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', backgroundColor: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <button onClick={() => toggleTaskCompletion(task)} className="btn-icon" style={{ padding: 0, color: task.status === 'completed' ? 'var(--success)' : 'var(--text-secondary)' }}>
                    {task.status === 'completed' ? <CheckCircle size={22} /> : <Circle size={22} />}
                  </button>
                  <span style={{ flex: 1, textDecoration: task.status === 'completed' ? 'line-through' : 'none', color: task.status === 'completed' ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                    {task.title}
                  </span>
                  <button onClick={() => handleDeleteTask(task.id)} className="btn-icon" style={{ padding: '0.25rem', color: 'var(--danger)' }} title="Move to Trash">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Daily Achievements */}
        <div className="col-diary" style={{ flex: '1', backgroundColor: 'var(--bg-secondary)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Achievements Log</h2>
            <button onClick={handleSaveAchievement} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.75rem' }}>
              <Save size={16} /> Save
            </button>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
            {activeTeam ? `Reflect on what the team accomplished today.` : `Reflect on what you accomplished today. Incremental wins matter!`}
          </p>
          <textarea 
            className="input-field" 
            value={achievement}
            onChange={e => setAchievement(e.target.value)}
            placeholder={activeTeam ? "The team successfully..." : "I successfully..."}
            style={{ flex: 1, resize: 'none', minHeight: '300px', fontSize: '1rem', lineHeight: '1.5' }}
          />
        </div>

      </div>

      {/* Analytics only in personal mode */}
      {!activeTeam && <AnalyticsDashboard />}
    </div>
  );
};

export default DailyPlanner;
