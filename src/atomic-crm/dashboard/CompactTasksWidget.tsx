import React from 'react';

interface Task {
  id: number;
  title: string;
  priority: 'high' | 'normal' | 'low';
}

interface Props {
  tasks: Task[];
}

export const CompactTasksWidget: React.FC<Props> = ({ tasks }) => {
  const displayTasks = tasks.slice(0, 4);

  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-2 h-7">
        <h2 className="text-sm font-semibold text-foreground">My Tasks This Week</h2>
        <span className="bg-info/10 text-info text-xs px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>

      <div className="space-y-2">
        {displayTasks.map(task => (
          <div key={task.id} className="flex items-center gap-2 py-1">
            <input
              type="checkbox"
              className="w-4 h-4 text-primary rounded"
              aria-label={`Complete ${task.title}`}
            />
            <span className="text-sm truncate flex-1">{task.title}</span>
            {task.priority === 'high' && (
              <span className="text-xs text-destructive">!</span>
            )}
          </div>
        ))}
      </div>

      {tasks.length > 4 && (
        <a href="/tasks" className="text-xs text-primary hover:underline mt-2 block">
          View all tasks →
        </a>
      )}
    </div>
  );
};
