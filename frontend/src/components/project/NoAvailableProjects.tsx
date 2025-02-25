import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function NoAvailableProjects() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center h-full text-center space-y-4"
    >
      <h2 className="text-2xl font-semibold text-gray-800">No Projects Available</h2>
      <p className="text-lg text-gray-500">You don't have any projects yet. Create a new one to get started!</p>
      <button
        onClick={() => {navigate("/projects/new")}}
        className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
      >
        Create New Project
      </button>
    </motion.div>
  );
}
