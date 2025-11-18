import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Phone,
  Mail,
  Users,
  FileText,
  MoreHorizontal
} from 'lucide-react';
import { TaskGroup } from './TaskGroup';
import type { TaskItem } from '../types';

// Mock data for testing
const mockTasks: TaskItem[] = [
  {
    id: 1,
    subject: 'Follow up on Q4 proposal',
    dueDate: new Date(Date.now() - 86400000), // Yesterday
    priority: 'high',
    taskType: 'Call',
    relatedTo: { type: 'opportunity', name: 'Q4 Enterprise Deal', id: 101 },
    status: 'overdue',
  },
  {
    id: 2,
    subject: 'Send contract for review',
    dueDate: new Date(), // Today
    priority: 'critical',
    taskType: 'Email',
    relatedTo: { type: 'contact', name: 'John Smith', id: 202 },
    status: 'today',
  },
  {
    id: 3,
    subject: 'Schedule demo meeting',
    dueDate: new Date(Date.now() + 86400000), // Tomorrow
    priority: 'medium',
    taskType: 'Meeting',
    relatedTo: { type: 'organization', name: 'TechCorp', id: 303 },
    status: 'tomorrow',
  },
];

export function TasksPanel() {
  const overdueTasks = mockTasks.filter(t => t.status === 'overdue');
  const todayTasks = mockTasks.filter(t => t.status === 'today');
  const tomorrowTasks = mockTasks.filter(t => t.status === 'tomorrow');

  const getTaskIcon = (type: TaskItem['taskType']) => {
    switch(type) {
      case 'Call': return <Phone className="h-4 w-4" />;
      case 'Email': return <Mail className="h-4 w-4" />;
      case 'Meeting': return <Users className="h-4 w-4" />;
      case 'Follow-up': return <CheckCircle2 className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: TaskItem['priority']) => {
    switch(priority) {
      case 'critical': return 'destructive';
      case 'high': return 'warning';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <Card className="card-container flex h-full flex-col">
      <CardHeader className="border-b border-border pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">My Tasks</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Today's priorities and upcoming activities
            </CardDescription>
          </div>
          {overdueTasks.length > 0 && (
            <Badge variant="destructive" className="text-xs">
              {overdueTasks.length} overdue
            </Badge>
          )}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Overdue items highlighted • Click to complete • Drag to reschedule
        </p>
      </CardHeader>

      <CardContent className="flex-1 overflow-auto p-0">
        <div className="space-y-4 p-4">
          {/* Overdue section */}
          {overdueTasks.length > 0 && (
            <TaskGroup title="Overdue" variant="danger" count={overdueTasks.length}>
              {overdueTasks.map(task => (
                <TaskItemComponent key={task.id} task={task} />
              ))}
            </TaskGroup>
          )}

          {/* Today section */}
          <TaskGroup title="Today" variant="warning" count={todayTasks.length}>
            {todayTasks.map(task => (
              <TaskItemComponent key={task.id} task={task} />
            ))}
          </TaskGroup>

          {/* Tomorrow section */}
          <TaskGroup title="Tomorrow" variant="info" count={tomorrowTasks.length}>
            {tomorrowTasks.map(task => (
              <TaskItemComponent key={task.id} task={task} />
            ))}
          </TaskGroup>
        </div>
      </CardContent>
    </Card>
  );
}

function TaskItemComponent({ task }: { task: TaskItem }) {
  const getTaskIcon = (type: TaskItem['taskType']) => {
    switch(type) {
      case 'Call': return <Phone className="h-4 w-4" />;
      case 'Email': return <Mail className="h-4 w-4" />;
      case 'Meeting': return <Users className="h-4 w-4" />;
      case 'Follow-up': return <CheckCircle2 className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: TaskItem['priority']) => {
    switch(priority) {
      case 'critical': return 'destructive';
      case 'high': return 'warning';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="interactive-card flex items-center gap-3 rounded-lg border border-transparent bg-card px-3 py-2">
      <Checkbox className="h-5 w-5" />

      <div className="flex-1">
        <div className="flex items-center gap-2">
          {getTaskIcon(task.taskType)}
          <span className="font-medium">{task.subject}</span>
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant={getPriorityColor(task.priority)} className="text-xs">
            {task.priority}
          </Badge>
          <span>→ {task.relatedTo.name}</span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Clock className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
