import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { apiClient } from '../api/client';
import { RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNotification } from '../context/NotificationContext';

const TrashBin = () => {
  const [deletedTasks, setDeletedTasks] = useState([]);
  const { syncTrigger } = useNotification();

  const fetchDeletedTasks = async () => {
    try {
      const data = await apiClient('/tasks/?deleted=true');
      setDeletedTasks(data.results || data || []);
    } catch (err) {
      console.error('Failed to fetch deleted tasks:', err);
    }
  };

  useEffect(() => {
    fetchDeletedTasks();
  }, [syncTrigger]);

  const handleRestore = async (taskId) => {
    try {
      await apiClient(`/tasks/${taskId}/restore/`, { method: 'POST' });
      toast.success('Task restored successfully!');
      fetchDeletedTasks();
    } catch (err) {
      toast.error('Failed to restore task.');
    }
  };

  const handleEmptyTrash = async () => {
    if (!window.confirm("Are you sure you want to empty the trash? This will permanently hide all items here.")) return;
    try {
      await apiClient('/tasks/empty_trash/', { method: 'POST' });
      toast.success('Trash emptied!');
      fetchDeletedTasks();
    } catch (err) {
      toast.error('Failed to empty trash.');
    }
  };

  const handlePermanentDelete = async (taskId) => {
    if (!window.confirm("Permanently delete this task?")) return;
    try {
      await apiClient(`/tasks/${taskId}/delete_permanently/`, { method: 'POST' });
      toast.success('Task permanently deleted!');
      fetchDeletedTasks();
    } catch (err) {
      toast.error('Failed to permanently delete task.');
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <Navigation />
      
      <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.4rem', color: 'var(--danger)', margin: 0 }}>Recycle Bin</h2>
          {deletedTasks.length > 0 && (
            <button onClick={handleEmptyTrash} style={{ backgroundColor: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>
              Empty Trash
            </button>
          )}
        </div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Items here have been soft-deleted. They will automatically be permanently deleted after 30 days.
        </p>

        {deletedTasks.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Your trash is currently empty.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {deletedTasks.map(task => (
              <div key={task.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.25rem 0', textDecoration: 'line-through', color: 'var(--text-secondary)' }}>{task.title}</h3>
                  <p style={{ fontSize: '0.85rem', margin: 0, color: 'var(--text-secondary)' }}>
                    Deleted {task.deleted_at ? new Date(task.deleted_at).toLocaleDateString() : 'recently'}
                  </p>
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => handleRestore(task.id)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
                    <RefreshCw size={16} /> Restore
                  </button>
                  <button onClick={() => handlePermanentDelete(task.id)} style={{ backgroundColor: 'var(--danger)', color: 'white', border: 'none', borderRadius: '8px', padding: '0.5rem 1rem', cursor: 'pointer' }}>
                    Delete Permanently
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrashBin;
