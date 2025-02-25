import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar,
  Users,
  AlertCircle,
  X,
  Plus,
  Clock
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

interface TeamMember {
  email: string;
  role: 'admin' | 'project_manager' | 'team_member';
}

export default function NewProject() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    dueDate: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
  });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<TeamMember['role']>('team_member');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    }

    if (formData.name.length > 100) {
      newErrors.name = 'Project name must be less than 100 characters';
    }

    if (formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    if (formData.dueDate && new Date(formData.dueDate) < new Date()) {
      newErrors.dueDate = 'Due date cannot be in the past';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddTeamMember = () => {
    if (!newMemberEmail.trim()) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newMemberEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Check for duplicates
    if (teamMembers.some(member => member.email === newMemberEmail)) {
      toast.error('This team member has already been added');
      return;
    }

    setTeamMembers([...teamMembers, { email: newMemberEmail, role: newMemberRole }]);
    setNewMemberEmail('');
    setNewMemberRole('team_member');
  };

  const removeTeamMember = (email: string) => {
    setTeamMembers(teamMembers.filter(member => member.email !== email));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: formData.name,
          description: formData.description || null,
          status: 'planning',
          start_date: new Date().toISOString(),
          end_date: formData.dueDate || null,
          created_by: user?.id
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Add team members
      if (teamMembers.length > 0) {
        const { error: membersError } = await supabase
          .from('project_members')
          .insert(
            teamMembers.map(member => ({
              project_id: project.id,
              user_id: member.email, // This will need to be updated to handle user lookup
              role: member.role
            }))
          );

        if (membersError) throw membersError;
      }

      toast.success('Project created successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className=" rounded-lg shadow-sm p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-300">Create New Project</h1>
            <p className="mt-1 text-sm text-gray-500">
              Get started by filling in the information below to create your new project.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                Project Name <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`block w-full rounded-md  text-black dark:text-white shadow-sm dark:bg-gray-900 dark:border-gray-800 ${
                    errors.name
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                  placeholder="Enter project name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.name}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm  font-medium text-gray-700 dark:text-gray-400">
                Description
              </label>
              <div className="mt-1">
                <textarea
                  id="description"
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="block w-full rounded-md border-gray-300 text-black dark:text-white dark:bg-gray-900 dark:border-gray-800 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter project description"
                />
                <p className="mt-1 text-sm text-gray-500">
                  {formData.description.length}/500 characters
                </p>
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                Due Date
              </label>
              <div className="mt-1 relative">
                <input
                  type="date"
                  id="dueDate"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="block w-full rounded-md dark:bg-gray-900 dark:border-gray-800 text-black dark:text-gray-600 border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 pl-10"
                  min={new Date().toISOString().split('T')[0]}
                />
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
              {errors.dueDate && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.dueDate}
                </p>
              )}
            </div>

            {/* Priority */}
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                Priority Level <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as typeof formData.priority })}
                  className="block w-full dark:text-white bg-white dark:bg-gray-900 dark:border-gray-800 rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            {/* Team Members */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-400">
                Team Members
              </label>
              
              <div className="flex gap-2 mb-4">
                <input
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="Enter team member's email"
                  className="flex-1 rounded-md dark:text-white bg-white dark:bg-gray-900 dark:border-gray-800 border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value as TeamMember['role'])}
                  className="rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-900 dark:border-gray-800 dark:text-white"
                >
                  <option value="team_member">Team Member</option>
                  <option value="project_manager">Project Manager</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddTeamMember}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Team Members List */}
              <div className="space-y-2">
                {teamMembers.map((member, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-md"
                  >
                    <div className="flex items-center space-x-3">
                      <Users className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-400">{member.email}</div>
                        <div className="text-sm text-gray-500 capitalize dark:text-gray-600">{member.role.replace('_', ' ')}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeTeamMember(member.email)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <X className="w-5 h-5 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 border dark:border-gray-800  border-gray-300 rounded-md text-sm font-medium text-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Clock className="animate-spin -ml-1 mr-2 h-5 w-5 inline" />
                    Creating...
                  </>
                ) : (
                  'Create Project'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}