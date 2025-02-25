import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import ProjectList from './project/ProjectList';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <motion.h1
              className="text-2xl font-bold text-gray-900 dark:text-gray-300"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              Dashboard
            </motion.h1>
            <motion.p
              className="mt-1 text-gray-500"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Welcome to your project dashboard
            </motion.p>
          </div>

          <motion.button
            onClick={() => navigate('/projects/new')}
            className="items-center px-4 py-2 border border-transparent rounded-md shadow-sm lg:text-sm text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 flex"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Plus className="w-4 h-4 mr-2" />
            <span>New Project</span>
          </motion.button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <ProjectList />
        </motion.div>
      </div>
    </div>
  );
}
