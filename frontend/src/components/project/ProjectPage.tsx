import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Users,
  Settings,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { TaskList } from '../TaskList'; 
import { toast } from 'react-hot-toast';
import { Project, ProjectMember } from '../../types/project';

export default function ProjectPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    upcomingDeadlines: 0
  });

  useEffect(() => {
    if (!projectId) return;
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    try {
      // Load project details
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);

      // Load project members
      const { data: memberData, error: memberError } = await supabase
        .from('project_members')
        .select(`
          user_id,
          role,
          joined_at,
          profiles (
            username,
            avatar_url,
            full_name
          )
        `)
        .eq('project_id', projectId);

      if (memberError) throw memberError;
      setMembers(memberData);

      // Load project stats
      const { data: taskStats, error: statsError } = await supabase
        .from('tasks')
        .select('id, status, due_date')
        .eq('project_id', projectId);

      if (statsError) throw statsError;

      const now = new Date();
      setStats({
        totalTasks: taskStats?.length || 0,
        completedTasks: taskStats?.filter(t => t.status === 'done').length || 0,
        overdueTasks: taskStats?.filter(t => t.due_date && new Date(t.due_date) < now).length || 0,
        upcomingDeadlines: taskStats?.filter(t => {
          if (!t.due_date) return false;
          const dueDate = new Date(t.due_date);
          const diff = dueDate.getTime() - now.getTime();
          const days = diff / (1000 * 60 * 60 * 24);
          return days <= 7 && days > 0;
        }).length || 0
      });
    } catch (error) {
      console.error('Error loading project:', error);
      toast.error('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Project Not Found</h2>
          <button
            onClick={() => navigate('/projects')}
            className="text-indigo-600 hover:text-indigo-700"
          >
            Return to Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Project Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              {project.description && (
                <p className="mt-1 text-gray-500">{project.description}</p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(`/projects/${projectId}/settings`)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Settings className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Project Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-indigo-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-indigo-600 mr-2" />
                  <span className="text-sm font-medium text-gray-500">Completion</span>
                </div>
                <span className="text-lg font-semibold text-indigo-600">
                  {stats.totalTasks ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%
                </span>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                {stats.completedTasks} of {stats.totalTasks} tasks completed
              </div>
            </div>

            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                  <span className="text-sm font-medium text-gray-500">Overdue</span>
                </div>
                <span className="text-lg font-semibold text-red-600">
                  {stats.overdueTasks}
                </span>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                Tasks past due date
              </div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-yellow-600 mr-2" />
                  <span className="text-sm font-medium text-gray-500">Upcoming</span>
                </div>
                <span className="text-lg font-semibold text-yellow-600">
                  {stats.upcomingDeadlines}
                </span>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                Deadlines this week
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-sm font-medium text-gray-500">Team</span>
                </div>
                <span className="text-lg font-semibold text-green-600">
                  {members.length}
                </span>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                Active members
              </div>
            </div>
          </div>
        </div>

        {/* Team Members */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
            <button
              onClick={() => navigate(`/projects/${projectId}/members`)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Member
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((member) => (
              <div key={member.user_id} className="flex items-center p-4 bg-gray-50 rounded-lg">
                <img
                  src={member.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${member.profiles?.username || 'User'}&background=6366F1&color=fff`}
                  alt={member.profiles?.username || 'User'}
                  className="w-10 h-10 rounded-full"
                />
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-900">
                    {member.profiles?.full_name || member.profiles?.username}
                  </div>
                  <div className="text-sm text-gray-500 capitalize">
                    {member.role.replace('_', ' ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tasks */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Tasks</h2>
            <button
              onClick={() => navigate(`/projects/${projectId}/tasks/new`)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </button>
          </div>

          <TaskList projectId={projectId} />
        </div>
      </div>
    </div>
  );
}