import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

export interface TeamMember {
  id: string;
  email: string;
  role: 'admin' | 'project_manager' | 'team_member';
  avatar_url?: string;
  full_name?: string;
}

export function useTeamMembers(projectId: string) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMembers();
  }, [projectId]);

  const loadMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('project_members')
        .select(`
          user_id,
          role,
          profiles (
            email,
            avatar_url,
            full_name
          )
        `)
        .eq('project_id', projectId);

      if (error) throw error;

      setMembers(
        data.map(member => ({
          id: member.user_id,
          email: member.profiles.email,
          role: member.role,
          avatar_url: member.profiles.avatar_url,
          full_name: member.profiles.full_name
        }))
      );
    } catch (err) {
      console.error('Error loading team members:', err);
      setError(err instanceof Error ? err.message : 'Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const inviteMember = async (email: string, role: TeamMember['role']) => {
    try {
      // First, check if user exists
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (userError) throw new Error('User not found');

      // Add user to project
      const { error: memberError } = await supabase
        .from('project_members')
        .insert({
          project_id: projectId,
          user_id: userData.id,
          role
        });

      if (memberError) throw memberError;

      toast.success('Team member added successfully');
      await loadMembers();
    } catch (err) {
      console.error('Error inviting team member:', err);
      toast.error('Failed to add team member');
      throw err;
    }
  };

  const updateMemberRole = async (memberId: string, role: TeamMember['role']) => {
    try {
      const { error } = await supabase
        .from('project_members')
        .update({ role })
        .eq('project_id', projectId)
        .eq('user_id', memberId);

      if (error) throw error;

      setMembers(prev =>
        prev.map(member =>
          member.id === memberId ? { ...member, role } : member
        )
      );
      toast.success('Member role updated successfully');
    } catch (err) {
      console.error('Error updating member role:', err);
      toast.error('Failed to update member role');
      throw err;
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', memberId);

      if (error) throw error;

      setMembers(prev => prev.filter(member => member.id !== memberId));
      toast.success('Team member removed successfully');
    } catch (err) {
      console.error('Error removing team member:', err);
      toast.error('Failed to remove team member');
      throw err;
    }
  };

  const searchUsers = async (query: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url')
        .ilike('email', `%${query}%`)
        .limit(5);

      if (error) throw error;

      return data;
    } catch (err) {
      console.error('Error searching users:', err);
      throw err;
    }
  };

  return {
    members,
    loading,
    error,
    inviteMember,
    updateMemberRole,
    removeMember,
    searchUsers,
    refresh: loadMembers
  };
}