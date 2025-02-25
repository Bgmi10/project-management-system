import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  BarChart2,
  MessageSquare,
  Clock,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
  Globe
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-16">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-indigo-50 to-transparent"></div>
          <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-purple-50 to-transparent"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 bg-indigo-100 rounded-full text-indigo-800 text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4 mr-2" />
              Streamline Your Project Management
            </div>
            
            <h1 className="text-6xl font-bold text-gray-900 mb-8 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Manage Projects with Confidence and Clarity
            </h1>
            
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
              A powerful, intuitive project management platform that helps teams collaborate, 
              track progress, and deliver results with maximum efficiency.
            </p>
            
            <div className="flex items-center justify-center gap-4">
              <Link
                to="/login"
                className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              
              <Link
                to="/demo"
                className="inline-flex items-center px-8 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
              >
                Watch Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-gray-600">
              Powerful features designed to help your team stay organized, focused, and productive.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: LayoutDashboard,
                title: 'Intuitive Dashboard',
                description: 'Get a bird\'s eye view of your projects with customizable dashboards and real-time updates.'
              },
              {
                icon: Users,
                title: 'Team Collaboration',
                description: 'Work seamlessly with your team, assign tasks, and track progress in real-time.'
              },
              {
                icon: Calendar,
                title: 'Smart Scheduling',
                description: 'Plan and schedule projects with intelligent timeline suggestions and resource management.'
              },
              {
                icon: BarChart2,
                title: 'Advanced Analytics',
                description: 'Make data-driven decisions with comprehensive project analytics and insights.'
              },
              {
                icon: MessageSquare,
                title: 'Team Chat',
                description: 'Built-in communication tools to keep discussions organized and accessible.'
              },
              {
                icon: Clock,
                title: 'Time Tracking',
                description: 'Monitor time spent on tasks and projects to optimize team productivity.'
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-200"
              >
                <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg p-3 inline-block mb-4">
                  <feature.icon className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { number: '10K+', label: 'Active Users' },
              { number: '50K+', label: 'Projects Completed' },
              { number: '99.9%', label: 'Uptime' },
              { number: '24/7', label: 'Support' }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-indigo-600 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Why Choose Our Platform?
              </h2>
              <div className="space-y-8">
                {[
                  {
                    icon: Shield,
                    title: 'Enterprise-Grade Security',
                    description: 'Your data is protected with state-of-the-art encryption and security measures.'
                  },
                  {
                    icon: Zap,
                    title: 'Lightning Fast Performance',
                    description: 'Optimized for speed and reliability, ensuring your team stays productive.'
                  },
                  {
                    icon: Globe,
                    title: 'Global Accessibility',
                    description: 'Access your projects from anywhere, anytime, on any device.'
                  }
                ].map((benefit, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="bg-indigo-100 rounded-lg p-3">
                        <benefit.icon className="h-6 w-6 text-indigo-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                      <p className="text-gray-600">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1531498860502-7c67cf02f657?q=80&w=2070&auto=format&fit=crop"
                alt="Team collaboration"
                className="rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -right-6 bg-white rounded-lg shadow-lg p-6 max-w-sm">
                <div className="flex items-center gap-4 mb-4">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <div className="text-lg font-semibold text-gray-900">
                    98% Customer Satisfaction
                  </div>
                </div>
                <p className="text-gray-600">
                  Join thousands of satisfied teams who trust our platform for their project management needs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-8">
            Ready to Transform Your Project Management?
          </h2>
          <div className="flex items-center justify-center gap-4">
            <Link
              to="/signup"
              className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-indigo-600 bg-white hover:bg-gray-50 transition-colors duration-200"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center px-8 py-3 border border-white text-base font-medium rounded-lg text-white hover:bg-white/10 transition-colors duration-200"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}