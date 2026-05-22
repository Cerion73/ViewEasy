import React from 'react';
import { Trash2, Clock, History } from 'lucide-react';
import { Draggable } from '@hello-pangea/dnd';

const TaskItem = ({ task, index, onDelete, onViewHistory }) => {
  return (
    <Draggable draggableId={task.id.toString()} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="card"
          style={{
            ...provided.draggableProps.style,
            marginBottom: '0.75rem',
            padding: '1rem',
            opacity: snapshot.isDragging ? 0.8 : 1,
            boxShadow: snapshot.isDragging ? 'var(--shadow-md)' : 'var(--shadow-sm)',
            cursor: 'grab'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, marginRight: '1rem' }}>
              <h3 style={{ fontSize: '1.05rem', margin: 0, fontWeight: '500' }}>{task.title}</h3>
              {task.description && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  {task.description}
                </p>
              )}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => onViewHistory(task.id)} className="btn-icon" style={{ color: 'var(--accent-primary)', padding: '4px' }} title="View History">
                  <History size={16} />
                </button>
                {task.status !== 'completed' && task.status !== 'in_progress' && (
                  <button onClick={() => onDelete(task.id)} className="btn-icon" style={{ color: 'var(--danger)', padding: '4px' }} title="Move to Trash">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', justifyContent: 'flex-end', maxWidth: '120px' }}>
                {task.priority && (
                  <div style={{
                    padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold',
                    backgroundColor: task.priority === 'high' ? 'rgba(239, 68, 68, 0.1)' : task.priority === 'medium' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                    color: task.priority === 'high' ? '#ef4444' : task.priority === 'medium' ? '#f59e0b' : '#10b981',
                    textTransform: 'uppercase'
                  }}>
                    {task.priority}
                  </div>
                )}
                
                {task.is_recurring && (
                  <div style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', textTransform: 'uppercase' }}>
                    Recurring
                  </div>
                )}
                
                {task.subtasks && task.subtasks.length > 0 && (
                  <div style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold', backgroundColor: 'rgba(100, 116, 139, 0.1)', color: '#64748b' }}>
                    {task.subtasks.length} Subtask(s)
                  </div>
                )}
                
                {task.team && (
                  <div style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold', backgroundColor: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' }}>
                    Team Task
                  </div>
                )}
              </div>

              {task.estimated_duration && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  <Clock size={14} />
                  {task.estimated_duration}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default TaskItem;
