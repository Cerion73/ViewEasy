import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, AlertCircle, FileText, Type, Repeat, ListTree, Users } from 'lucide-react';
import { apiClient } from '../api/client';
import { useTeam } from '../context/TeamContext';

const DAYS_OF_WEEK = [
  { id: 'monday', label: 'M' },
  { id: 'tuesday', label: 'T' },
  { id: 'wednesday', label: 'W' },
  { id: 'thursday', label: 'T' },
  { id: 'friday', label: 'F' },
  { id: 'saturday', label: 'S' },
  { id: 'sunday', label: 'S' }
];

const TaskModal = ({ isOpen, onClose, onSubmit }) => {
  const { activeTeam } = useTeam();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [duration, setDuration] = useState('');
  const [error, setError] = useState('');
  
  // New State
  const [parentTask, setParentTask] = useState('');
  const [availableTasks, setAvailableTasks] = useState([]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceSchedule, setRecurrenceSchedule] = useState({});

  useEffect(() => {
    if (isOpen) {
      const endpoint = activeTeam ? `/tasks/?team=${activeTeam.id}` : '/tasks/?personal=true';
      apiClient(endpoint).then(res => {
        setAvailableTasks(res.results || res || []);
      }).catch(console.error);
    }
  }, [isOpen, activeTeam]);

  if (!isOpen) return null;

  const handleDurationBlur = () => {
    if (!duration) return;
    // Auto-correct grammar: '1 hours' -> '1 hour', '2 day' -> '2 days'
    let corrected = duration.toLowerCase();
    const corrections = [
      { regex: /\b1\s+seconds?\b/g, replace: '1 second' },
      { regex: /\b([2-9]|\d{2,})\s+second\b/g, replace: '$1 seconds' },
      { regex: /\b1\s+minutes?\b/g, replace: '1 minute' },
      { regex: /\b([2-9]|\d{2,})\s+minute\b/g, replace: '$1 minutes' },
      { regex: /\b1\s+hours?\b/g, replace: '1 hour' },
      { regex: /\b([2-9]|\d{2,})\s+hour\b/g, replace: '$1 hours' },
      { regex: /\b1\s+days?\b/g, replace: '1 day' },
      { regex: /\b([2-9]|\d{2,})\s+day\b/g, replace: '$1 days' },
      { regex: /\b1\s+weeks?\b/g, replace: '1 week' },
      { regex: /\b([2-9]|\d{2,})\s+week\b/g, replace: '$1 weeks' },
      { regex: /\b1\s+months?\b/g, replace: '1 month' },
      { regex: /\b([2-9]|\d{2,})\s+month\b/g, replace: '$1 months' },
    ];
    corrections.forEach(({ regex, replace }) => {
      corrected = corrected.replace(regex, replace);
    });
    setDuration(corrected);
  };

  const handleDayToggle = (dayId) => {
    setRecurrenceSchedule(prev => {
      const newSchedule = { ...prev };
      if (newSchedule[dayId] !== undefined) {
        delete newSchedule[dayId];
      } else {
        newSchedule[dayId] = '09:00'; // Default time
      }
      return newSchedule;
    });
  };

  const handleTimeChange = (dayId, time) => {
    setRecurrenceSchedule(prev => ({ ...prev, [dayId]: time }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    try {
      const taskData = {
        title,
        description,
        priority,
        due_date: dueDate || null,
        estimated_duration: duration || null,
        status: 'pending',
        parent_task: parentTask || null,
        is_recurring: isRecurring,
        recurrence_schedule: isRecurring ? recurrenceSchedule : null
      };
      if (activeTeam) taskData.team = activeTeam.id;
      await onSubmit(taskData);
      // Reset form
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate('');
      setDuration('');
      setParentTask('');
      setIsRecurring(false);
      setRecurrenceSchedule({});
      setError('');
      onClose();
    } catch (err) {
        if (err.response && err.response.data && err.response.data.due_date) {
            setError(err.response.data.due_date[0]);
        } else {
            setError(err.message || 'Failed to create task. Check format.');
        }
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Create New Task</h2>
            {activeTeam && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: '500' }}>
                <Users size={14} /> For team: {activeTeam.name}
              </div>
            )}
          </div>
          <button onClick={onClose} className="btn-icon" style={{ padding: '0.25rem' }}>
            <X size={24} />
          </button>
        </div>

        {error && (
          <div style={{ backgroundColor: 'var(--danger)', color: 'white', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: '500' }}>
              <Type size={16} /> Task Title
            </label>
            <input type="text" className="input-field" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="What needs to be done?" />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: '500' }}>
              <FileText size={16} /> Description
            </label>
            <textarea className="input-field" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add more details..." rows={3} style={{ resize: 'vertical' }} />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: '500' }}>
                <AlertCircle size={16} /> Priority
              </label>
              <select className="input-field" value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: '500' }}>
                <Calendar size={16} /> Due Date
              </label>
              <input type="datetime-local" className="input-field" value={dueDate} onChange={(e) => setDueDate(e.target.value)} disabled={isRecurring} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: '500' }}>
                <Clock size={16} /> Estimated Duration
              </label>
              <input type="text" className="input-field" value={duration} onChange={(e) => setDuration(e.target.value)} onBlur={handleDurationBlur} placeholder="e.g. '2 weeks 3 days'" />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Auto-corrects grammar on blur.
              </p>
            </div>
            
            <div style={{ flex: 1 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: '500' }}>
                <ListTree size={16} /> Parent Task
              </label>
              <select className="input-field" value={parentTask} onChange={(e) => setParentTask(e.target.value)}>
                <option value="">None</option>
                {availableTasks.map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Recurring Task Settings */}
          <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500', cursor: 'pointer' }}>
              <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} />
              <Repeat size={16} /> Make this a Recurring Task
            </label>
            
            {isRecurring && (
              <div style={{ marginTop: '1rem' }}>
                <p style={{ fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Select days and set generation times:</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                  {DAYS_OF_WEEK.map(day => {
                    const isSelected = recurrenceSchedule[day.id] !== undefined;
                    return (
                      <div key={day.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                        <button
                          type="button"
                          onClick={() => handleDayToggle(day.id)}
                          style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            backgroundColor: isSelected ? 'var(--accent-primary)' : 'transparent',
                            color: isSelected ? 'white' : 'var(--text-primary)',
                            border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                            cursor: 'pointer', fontWeight: 'bold'
                          }}
                        >
                          {day.label}
                        </button>
                        {isSelected && (
                          <input 
                            type="time" 
                            value={recurrenceSchedule[day.id]}
                            onChange={(e) => handleTimeChange(day.id, e.target.value)}
                            style={{ fontSize: '0.7rem', padding: '2px', width: '55px', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={onClose} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', backgroundColor: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
              Save Task
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default TaskModal;
