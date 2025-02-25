import { useContext, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  LayoutDashboard, 
  Wand2, 
  LogOut,
  Menu,
  X,
  Bell,
  Sun,
  Moon
} from 'lucide-react';
import { ThemeContext } from '../context/ThemeContext';

export default function Navigation() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isLight, toggleTheme } = useContext(ThemeContext);
  
  const navigationItems = user ? [
    {
      name: 'Dashboard',
      icon: LayoutDashboard,
      href: '/dashboard',
      current: location.pathname === '/dashboard'
    },
    {
      name: 'Projects',
      icon: Wand2,
      href: '/projects',
      current: location.pathname === '/projects'
    },
  ] : [];

  return (
    <nav className="shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Wand2 className="w-5 h-5 text-white" />
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
                TaskGenie
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:ml-8 md:flex md:space-x-4">
              {navigationItems.map((item) => (
                <Link
                  key={item?.name}
                  to={item?.href}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                    item?.current
                      ? 'text-indigo-600 bg-indigo-50 dark:bg-gray-900'
                      : 'text-gray-600 dark:text-gray-500 hover:text-gray-900 hover:bg-gray-50 dark:hover:bg-gray-900'
                  }`}
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Right side navigation */}
          <div className="flex items-center">
            {user ? (
              <div className="flex items-center lg:space-x-4 sm: space-x-3">
                <button className="text-gray-400 hover:text-gray-600 sm: hidden lg:block">
                  {isLight === "light" ? <Sun className="w-5 h-5" onClick={toggleTheme} /> : <Moon className="w-5 h-5"  onClick={toggleTheme} />}
                </button>
                <button className="text-gray-400 hover:text-gray-600">
                  <Bell className="w-5 h-5" />
                </button>
                <div className="flex items-center lg:space-x-3 sm: space-x-2">
                  <img
                    src={`https://ui-avatars.com/api/?name=${user.email}&background=4F46E5&color=fff`}
                    alt="Profile"
                    className="w-8 h-8 rounded-full"
                  />
                  <button
                    onClick={() => signOut()}
                    className="text-gray-600 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-600"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center lg:space-x-4 sm: space-x-3">
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Sign In
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            {user &&  <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden lg:ml-4 lg:p-2 sm: p-0 sm: ml-2 rounded-md text-gray-400 hover:text-gray-500"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>}
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-gray-200">
            <div className="space-y-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item?.href}
                  className={`flex items-center px-3 py-2 rounded-md text-base font-medium  ${
                    item?.current
                      ? 'text-indigo-600 bg-indigo-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                > 
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              ))}
              {user && <div
                  className={`flex items-center px-3 py-2 rounded-md text-base font-medium`}
                  onClick={toggleTheme}
                > 
                 {isLight === "light" ? <div className="flex items-center" onClick={toggleTheme}>
                   <Sun className="w-5 h-5 mr-3" onClick={toggleTheme}/> 
                   <span onClick={toggleTheme}>Light</span>
                  </div>  : <div className="flex items-center" onClick={toggleTheme}>
                   <Moon className="w-5 h-5 mr-3" onClick={toggleTheme}/>
                   <span onClick={toggleTheme}>Dark</span>
                  </div>}
                </div>}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}