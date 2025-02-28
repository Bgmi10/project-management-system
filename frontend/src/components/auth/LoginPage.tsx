import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import signInWithGoogle from '../../lib/auth';
import { motion } from 'framer-motion';
import { FcGoogle } from 'react-icons/fc';

export default function LoginPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPasswordShow, setIsPasswordShow] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
        navigate('/');
      } else {
        await signUp(email, password);
        navigate('/');
      }
    } catch (error) {
      // Error is handled in useAuth hook
    } finally {
      setLoading(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center mt-[-32px] sm: px-6 lg:px-8">
      <motion.div 
        className="sm:mx-auto sm:w-full sm:max-w-md"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div 
          className="flex justify-center"
          variants={itemVariants}
        >
          <motion.div 
            className="rounded-full bg-blue-100 p-3 shadow-md" 
            initial={{ scale: 0.8 }} 
            animate={{ scale: 1 }} 
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 15,
              duration: 0.5 
            }}
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            {isLogin ? 
              <LogIn className="h-8 w-8 text-blue-600" /> : 
              <UserPlus className="h-8 w-8 text-blue-600" />
            }
          </motion.div>
        </motion.div>
        
        <motion.h2 
          className="mt-2 text-center text-3xl font-extrabold text-gray-900"
          variants={itemVariants}
        >
          {isLogin ? 'Welcome back' : 'Create your account'}
        </motion.h2>
        
        <motion.p 
          className="mt-2 text-center text-sm text-gray-600"
          variants={itemVariants}
        >
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <motion.button
            onClick={() => setIsLogin(!isLogin)}
            className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:underline transition ease-in-out duration-150"
            whileTap={{ scale: 0.95 }}
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </motion.button>
        </motion.p>
      </motion.div>

      <motion.div 
        className="mt-5 sm:mx-auto sm:w-full sm:max-w-md"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          className="bg-white py-8 px-6 shadow-lg sm: rounded-xl sm:px-10 border border-gray-100"
          variants={itemVariants}
        >
          <form className="space-y-6" onSubmit={handleSubmit}>
            <motion.div variants={itemVariants}>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200"
                  placeholder="you@example.com"
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={isPasswordShow ? 'text' : 'password'}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200"
                  placeholder="••••••••"
                  minLength={6}
                />
                <motion.button
                  type="button"
                  onClick={() => setIsPasswordShow(!isPasswordShow)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700 focus:outline-none"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {isPasswordShow ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </motion.button>
              </div>
            </motion.div>

            <motion.div 
              variants={itemVariants}
              className="pt-1"
            >
              <motion.button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  <div className="flex items-center">
                    {isLogin ? 'Sign in' : 'Create account'} 
                    <motion.div
                      className="ml-2"
                      animate={{ x: [0, 4, 0] }}
                      transition={{ repeat: Infinity, repeatDelay: 1.5, duration: 0.8 }}
                    >
                      <ArrowRight className="h-5 w-5" />
                    </motion.div>
                  </div>
                )}
              </motion.button>
            </motion.div>
          </form>
          
          <motion.div 
            className="mt-4 relative"
            variants={itemVariants}
          >
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">or</span>
            </div>
          </motion.div>

          <motion.div 
            className="mt-4 flex justify-center"
            variants={itemVariants}
          >
            <motion.button
              onClick={signInWithGoogle}
              className="flex items-center justify-center gap-2 px-4 py-2.5 w-full bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium hover:bg-gray-100 foc transition-all duration-200"
              whileTap={{ scale: 0.98 }}
            >
              <FcGoogle className="h-5 w-5" /> 
              <span>{isLogin ? "Sign in" : "Sign up"}  with Google</span>
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}