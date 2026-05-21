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
                  <History size={18} />
                </button>
                <button onClick={() => onDelete(task.id)} className="btn-icon" style={{ color: 'var(--danger)', padding: '4px' }} title="Delete Task">
                  <Trash2 size={18} />
                </button>
              </div>
              {task.estimated_hours && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  <Clock size={14} />
                  {task.estimated_hours}h
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
