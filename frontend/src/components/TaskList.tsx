import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar,
  Users,
  ArrowUpDown,
  Tag,
  Clock,
  AlertCircle,
  CheckCircle,
  Filter,
  Search,
  Plus,
  Flag,
  Circle,
  CheckCircle2,
  Timer,
  XCircle
} from 'lucide-react';
import { Task } from '../types/project';
import { format } from 'date-fns';

interface TaskListProps {
  tasks: Task[];
  loading: boolean;
  projectId?: string;
}

type SortField = 'title' | 'assigned_to' | 'due_date' | 'priority' | 'status';
type SortDirection = 'asc' | 'desc';

export function TaskList({ tasks, loading, projectId }: TaskListProps) {
  console.log(tasks);
  const navigate = useNavigate();
  const [sortField, setSortField] = useState<SortField>('due_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    assignee: 'all'
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'todo':
        return <Circle className="w-5 h-5 text-gray-400" />;
      case 'in_progress':
        return <Timer className="w-5 h-5 text-blue-500" />;
      case 'review':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'done':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const filteredTasks = tasks?.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = filters.status === 'all' || task.status === filters.status;
      const matchesPriority = filters.priority === 'all' || task.priority === filters.priority;
      const matchesAssignee = filters.assignee === 'all' || task.assigned_to === filters.assignee;

      return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
    })
    .sort((a, b) => {
      const direction = sortDirection === 'asc' ? 1 : -1;
      
      switch (sortField) {
        case 'title':
          return direction * a.title.localeCompare(b.title);
        case 'due_date':
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return direction * (new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
        case 'priority':
          const priorityOrder = { urgent: 3, high: 2, medium: 1, low: 0 };
          return direction * (priorityOrder[a.priority] - priorityOrder[b.priority]);
        case 'status':
          const statusOrder = { todo: 0, in_progress: 1, review: 2, done: 3 };
          return direction * (statusOrder[a.status] - statusOrder[b.status]);
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
            <p className="mt-1 text-sm text-gray-500">
              {filteredTasks.length} tasks total
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/tasks/new')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">All Status</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
              <select
                value={filters.priority}
                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                className="rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Task List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('title')}
                    className="group inline-flex items-center"
                  >
                    Task
                    <ArrowUpDown className="w-4 h-4 ml-1 text-gray-400 group-hover:text-gray-500" />
                  </button>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('status')}
                    className="group inline-flex items-center"
                  >
                    Status
                    <ArrowUpDown className="w-4 h-4 ml-1 text-gray-400 group-hover:text-gray-500" />
                  </button>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('priority')}
                    className="group inline-flex items-center"
                  >
                    Priority
                    <ArrowUpDown className="w-4 h-4 ml-1 text-gray-400 group-hover:text-gray-500" />
                  </button>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('due_date')}
                    className="group inline-flex items-center"
                  >
                    Due Date
                    <ArrowUpDown className="w-4 h-4 ml-1 text-gray-400 group-hover:text-gray-500" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTasks.map((task) => (
                <tr
                  key={task.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/tasks/${task.id}`)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {getStatusIcon(task.status)}
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{task.title}</div>
                        {task.description && (
                          <div className="text-sm text-gray-500 truncate max-w-md">
                            {task.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                      ${task.status === 'todo' ? 'bg-gray-100 text-gray-800' : ''}
                      ${task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : ''}
                      ${task.status === 'review' ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${task.status === 'done' ? 'bg-green-100 text-green-800' : ''}
                    `}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {task.due_date ? format(new Date(task.due_date), 'MMM d, yyyy') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}