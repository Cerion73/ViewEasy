import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTeam } from '../context/TeamContext';
import { useNotification } from '../context/NotificationContext';
import { apiClient } from '../api/client';
import TaskItem from '../components/TaskItem';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import TaskHistoryModal from '../components/TaskHistoryModal';
import Navigation from '../components/Navigation';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import toast from 'react-hot-toast';

const COLUMNS = {
  pending: { id: 'pending', title: 'Pending', color: 'rgba(255, 193, 7, 0.05)', borderTop: '3px solid #ffc107' },
  in_progress: { id: 'in_progress', title: 'In Progress', color: 'rgba(33, 150, 243, 0.05)', borderTop: '3px solid #2196f3' },
  completed: { id: 'completed', title: 'Completed', color: 'rgba(76, 175, 80, 0.05)', borderTop: '3px solid #4caf50' },
  overdue: { id: 'overdue', title: 'Overdue', color: 'rgba(244, 67, 54, 0.05)', borderTop: '3px solid #f44336' }
};

const Dashboard = () => {
  const { syncTrigger } = useNotification();
  const { activeTeam } = useTeam();
  const [tasks, setTasks] = useState([]);
  const [historyTaskId, setHistoryTaskId] = useState(null);

  const fetchTasks = async () => {
    try {
      const endpoint = activeTeam ? `/tasks/?team=${activeTeam.id}` : '/tasks/?personal=true';
      const data = await apiClient(endpoint);
      setTasks(data.results || data || []);
    } catch (err) {
      console.error('Failed to fetch tasks', err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [syncTrigger, activeTeam]);

  const handleCreateTask = async (taskData) => {
    try {
      const payload = activeTeam ? { ...taskData, team: activeTeam.id } : taskData;
      await apiClient('/tasks/', { body: payload });
      fetchTasks();
      toast.success('Task created!');
    } catch (err) {
      toast.error('Failed to create task');
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    try {
      await apiClient(`/tasks/${taskId}/`, { method: 'PATCH', body: updates });
    } catch (err) {
      console.error('Failed to update task', err);
      fetchTasks();
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to move this task to the trash?")) return;
    try {
      await apiClient(`/tasks/${taskId}/`, { method: 'DELETE' });
      fetchTasks();
    } catch (err) {
      console.error('Failed to delete task', err);
    }
  };

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId;
    setTasks(prevTasks => prevTasks.map(task => 
      task.id.toString() === draggableId ? { ...task, status: newStatus } : task
    ));
    handleUpdateTask(draggableId, { status: newStatus });
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <Navigation onTaskCreated={handleCreateTask} />

      {activeTeam && (
        <div style={{ marginBottom: '1.5rem', padding: '0.75rem 1.25rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.1rem' }}>👥</span>
          <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Team Board: {activeTeam.name}</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
            Tasks created here are scoped to this team
          </span>
        </div>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <div style={{ display: 'flex', gap: '1.5rem', overflowX: 'auto', paddingBottom: '1rem' }}>
          {Object.values(COLUMNS).map(column => {
            const columnTasks = tasks.filter(task => task.status === column.id);
            return (
              <div key={column.id} style={{ flex: '1', minWidth: '280px', backgroundColor: column.color || 'var(--bg-secondary)', borderTop: column.borderTop, borderRadius: '12px', padding: '1rem', borderRight: '1px solid var(--border-color)', borderLeft: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
                <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  {column.title} <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>({columnTasks.length})</span>
                </h2>
                
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{ 
                        minHeight: '200px',
                        backgroundColor: snapshot.isDraggingOver ? 'var(--border-color)' : 'transparent',
                        borderRadius: '8px',
                        transition: 'background-color 0.2s ease'
                      }}
                    >
                      {columnTasks.map((task, index) => (
                        <TaskItem 
                          key={task.id} 
                          task={task} 
                          index={index}
                          onDelete={handleDeleteTask}
                          onViewHistory={setHistoryTaskId}
                        />
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {historyTaskId && (
        <TaskHistoryModal taskId={historyTaskId} onClose={() => setHistoryTaskId(null)} />
      )}

      {/* Only show analytics in personal mode */}
      {!activeTeam && <AnalyticsDashboard />}
    </div>
  );
};

export default Dashboard;
