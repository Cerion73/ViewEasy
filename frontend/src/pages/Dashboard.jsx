import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { LogOut, Plus } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import TaskItem from '../components/TaskItem';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import TaskHistoryModal from '../components/TaskHistoryModal';

const COLUMNS = {
  pending: { id: 'pending', title: 'Pending' },
  in_progress: { id: 'in_progress', title: 'In Progress' },
  completed: { id: 'completed', title: 'Completed' },
  overdue: { id: 'overdue', title: 'Overdue' }
};

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [historyTaskId, setHistoryTaskId] = useState(null);

  const fetchTasks = async () => {
    try {
      const data = await apiClient('/tasks/');
      setTasks(data.results || data || []);
    } catch (err) {
      console.error('Failed to fetch tasks', err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      await apiClient('/tasks/', {
        body: { title: newTaskTitle, description: '', status: 'pending' }
      });
      setNewTaskTitle('');
      fetchTasks();
    } catch (err) {
      console.error('Failed to create task', err);
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    try {
      await apiClient(`/tasks/${taskId}/`, {
        method: 'PATCH',
        body: updates
      });
    } catch (err) {
      console.error('Failed to update task', err);
      fetchTasks(); // rollback if it fails
    }
  };

  const handleDeleteTask = async (taskId) => {
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
    
    // Optimistic UI update
    setTasks(prevTasks => prevTasks.map(task => 
      task.id.toString() === draggableId ? { ...task, status: newStatus } : task
    ));

    handleUpdateTask(draggableId, { status: newStatus });
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem' }}>Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome, {user?.username}</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <ThemeToggle />
          <button onClick={logout} className="btn-icon" aria-label="Logout" title="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <form onSubmit={handleCreateTask} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', maxWidth: '600px' }}>
        <input 
          type="text" 
          className="input-field" 
          placeholder="What needs to be done?" 
          value={newTaskTitle} 
          onChange={(e) => setNewTaskTitle(e.target.value)} 
          style={{ flex: 1 }}
        />
        <button type="submit" className="btn-primary">
          <Plus size={20} /> Add Task
        </button>
      </form>

      <DragDropContext onDragEnd={onDragEnd}>
        <div style={{ display: 'flex', gap: '1.5rem', overflowX: 'auto', paddingBottom: '1rem' }}>
          {Object.values(COLUMNS).map(column => {
            const columnTasks = tasks.filter(task => task.status === column.id);
            return (
              <div key={column.id} style={{ flex: '1', minWidth: '280px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', padding: '1rem', border: '1px solid var(--border-color)' }}>
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
    </div>
  );
};

export default Dashboard;
