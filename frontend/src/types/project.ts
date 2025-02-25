import { User } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'project_manager' | 'team_member';

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type NotificationType = 
  | 'task_assigned'
  | 'task_updated'
  | 'comment_added'
  | 'deadline_approaching'
  | 'project_updated';

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  start_date?: string;
  end_date?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  project_id: string;
  user_id: string;
  role: UserRole;
  joined_at: string;
  user?: User;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to?: string;
  due_date?: string;
  estimated_hours?: number;
  actual_hours?: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  content: string;
  reference_id?: string;
  read: boolean;
  created_at: string;
}

export interface FileUpload {
  id: string;
  project_id: string;
  task_id?: string;
  name: string;
  file_path: string;
  file_type: string;
  size_bytes: number;
  uploaded_by: string;
  uploaded_at: string;
}