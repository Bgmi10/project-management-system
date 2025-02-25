import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus,
  Search,
  Folder,
  Calendar,
  CheckCircle,
  MoreVertical,
  Trash,
  Pencil,
  X
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Project } from '../../types/project';
import { toast } from 'react-hot-toast';
import { motion } from "framer-motion";
import NoAvailableProjects from './NoAvailableProjects';

export default function ProjectList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [IsActiveVerticalMenuOpen, setIsActiveVerticalMenuOpen] = useState<null | number>(null);
  const loadProjects = async () => {
    if (!user?.id) return;

    try {
      // First get projects where user is the creator
      setLoading(true);
      const { data: ownedProjects, error: ownedError } = await supabase
        .from('projects')
        .select(`
          *,
          project_members (
            user_id,
            role
          )
        `)
        .eq('created_by', user.id);

      if (ownedError) throw ownedError;

      // Then get projects where user is a member
      const { data: memberProjects, error: memberError } = await supabase
        .from('projects')
        .select(`
          *,
          project_members!inner (
            user_id,
            role
          )
        `)
        .eq('project_members.user_id', user.id);

      if (memberError) throw memberError;

      // Combine and deduplicate projects
      const allProjects = [...(ownedProjects || []), ...(memberProjects || [])];
      const uniqueProjects = Array.from(
        new Map(allProjects.map(project => [project.id, project])).values()
      );

      setProjects(uniqueProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id && projects.length === 0) {
      loadProjects();
    }
  }, [user?.id, projects.length]);  // Re-run only if user or projects change
  
  

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'text-blue-600 bg-blue-50';
      case 'active': return 'text-green-600 bg-green-50';
      case 'on_hold': return 'text-yellow-600 bg-yellow-50';
      case 'completed': return 'text-purple-600 bg-purple-50';
      case 'cancelled': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const handleMore = (index: null | number) => {
    setIsActiveVerticalMenuOpen(index);
  }

  const handleDeleteProject = async (id: string) => {
    if (!id) return;
    
    const { error } = await supabase.from("projects").delete().match({ id });
    const updatedProjects = projects.filter((item) => item.id !== id);
    setProjects(updatedProjects);
    if (error) {
      toast.error("Failed to delete project!");
    } else {
      toast.success("Project deleted successfully")
    }
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={` ${projects.length === 0 ? "block" : "hidden"} mt-36`}>
        {projects.length === 0 && <NoAvailableProjects />}
        </div>
        {projects.length > 0 && <><div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-300">Projects</h1>
            <p className="mt-1 text-gray-500">
              {filteredProjects.length} projects total  
            </p>
          </div>
          <button
            onClick={() => navigate('/projects/new')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </button>
        </div>

        <div className="rounded-lg shadow-sm p-4 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white dark:bg-gray-900 pl-10 block w-full rounded-md border-gray-300 dark:border-gray-800 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-black dark:text-white"
              />
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-md border-gray-300 dark:border-gray-800 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-900 text-black dark:text-gray-400"
              >
                <option value="all">All Status</option>
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div></>}

        {/* Project Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.length > 0 &&  filteredProjects.map((project, index) => (
            <div
            key={project.id}
            onClick={() => navigate(`/projects/${project.id}`)}
            className="rounded-lg shadow-sm hover:shadow-md dark:shadow-sm dark:shadow-gray-900 transition-shadow duration-200 overflow-hidden cursor-pointer relative"
          >
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <Folder className="w-8 h-8 text-indigo-500" />
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-300">{project.name}</h3>
                    {project.description && (
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                  </div>
                </div>
                <div
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-500 relative"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMore(index);
                  }}
                >
                   <motion.div
                      initial={{ rotate: 0 }}
                      animate={{ rotate: IsActiveVerticalMenuOpen === index ? 85 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {IsActiveVerticalMenuOpen === index ? (
                        <X className="w-5 h-5"  onClick={(e) => {
                          e.stopPropagation();
                          handleMore(null);
                        }}/>
                      ) : (
                        <MoreVertical className="w-5 h-5" />
                      )}
                    </motion.div>
                  {IsActiveVerticalMenuOpen === index && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 border dark:border-gray-800 border-gray-200 rounded-lg shadow-lg z-10">
                      <ul className="py-1">
                       <li className="px-4 py-2 text-sm text-gray-700 dark:text-white dark:hover:bg-gray-800 dark:hover cursor-pointer flex items-center gap-1 hover:bg-gray-100 p-1 m-1 rounded-lg"><Pencil size={12}/>Edit</li>
                       <li className="px-4 py-2 text-sm text-red-500 cursor-pointer dark:hover:bg-gray-800 flex items-center gap-1 hover:bg-gray-100 p-1 m-1 rounded-lg" onClick={() => handleDeleteProject(project.id)}><Trash size={12} />Delete</li>
                     </ul>
                    </div>
                  )}
                </div>
              </div>
          
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Status</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(project.status)}`}>
                    {project.status.replace('_', ' ')}
                  </span>
                </div>
          
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Timeline</span>
                  <span className="text-gray-900 dark:text-gray-500">
                    {project.start_date ? new Date(project.start_date).toLocaleDateString() : '-'}
                    {' → '}
                    {project.end_date ? new Date(project.end_date).toLocaleDateString() : '-'}
                  </span>
                </div>
          
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500  ">Team</span>
                  <span className="text-gray-900 dark:text-gray-500">
                    {project?.project_members?.length || 0} members
                  </span>
                </div>
              </div>
            </div>
          
            <div className="border-t border-gray-100 dark:border-gray-900 px-6 py-4 bg-gray-50 dark:bg-gray-950">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center text-gray-500 dark:text-gray-300">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  <span>In Progress</span>
                </div>
                <div className="flex items-center text-gray-500">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>
                    {project.end_date
                      ? `${Math.max(0, Math.ceil((new Date(project.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} days left`
                      : 'No deadline'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          ))}
        </div>
      </div>
    </div>
  );
}