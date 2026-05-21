import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { X } from 'lucide-react';

const TaskHistoryModal = ({ taskId, onClose }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await apiClient(`/tasks/${taskId}/history/`);
        setHistory(data);
      } catch (err) {
        console.error('Failed to fetch history', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [taskId]);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div className="card" style={{ width: '90%', maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto', position: 'relative' }}>
        <button onClick={onClose} className="btn-icon" style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
          <X size={20} />
        </button>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>Task History</h2>
        
        {loading ? (
          <p>Loading history...</p>
        ) : history.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No history available for this task.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {history.map((record, index) => (
              <div key={record.history_id} style={{ borderLeft: '2px solid var(--accent-primary)', paddingLeft: '1rem' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  {new Date(record.history_date).toLocaleString()} - <strong>{record.history_user || 'System'}</strong>
                </div>
                <div style={{ fontSize: '0.95rem' }}>
                  {record.history_type === '+' && <span style={{ color: 'var(--success)' }}>Created</span>}
                  {record.history_type === '~' && <span style={{ color: 'var(--accent-hover)' }}>Updated</span>}
                  {record.history_type === '-' && <span style={{ color: 'var(--danger)' }}>Deleted</span>}
                  {' - '} Status: <strong>{record.status}</strong>, Title: {record.title}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskHistoryModal;
