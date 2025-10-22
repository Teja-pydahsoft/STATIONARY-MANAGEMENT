import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Users, Package, BarChart3, BookOpen } from 'lucide-react';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full">
        {/* Main Hero Section */}
        <div className="text-center mb-16">
         
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 leading-tight">
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              PYDAH
            </span>
            <br />
            <span className="text-3xl md:text-4xl text-gray-300 font-light">
              Stationery Management Portal
            </span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Revolutionizing college stationery distribution with intelligent tracking, 
            seamless student management, and real-time analytics for educational institutions.
          </p>

          <Link 
            to="/login" 
            className="group inline-flex items-center gap-4 px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold text-lg rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-2xl shadow-blue-500/25 hover:shadow-3xl hover:shadow-blue-500/40 hover:-translate-y-1"
          >
            <Shield className="w-6 h-6" />
            <span>Admin Portal Access</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 text-center hover:bg-white/15 transition-all duration-300 hover:-translate-y-1">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Student Management</h3>
            <p className="text-gray-300 text-sm">
              Comprehensive student profiles with course-wise tracking and enrollment management
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 text-center hover:bg-white/15 transition-all duration-300 hover:-translate-y-1">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Inventory Control</h3>
            <p className="text-gray-300 text-sm">
              Smart stationery tracking with real-time stock updates and distribution analytics
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 text-center hover:bg-white/15 transition-all duration-300 hover:-translate-y-1">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Analytics Dashboard</h3>
            <p className="text-gray-300 text-sm">
              Advanced reporting and insights for efficient resource allocation and planning
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl border border-white/10 p-8 backdrop-blur-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-white mb-2">5000+</div>
              <div className="text-blue-200 text-sm">Students Managed</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">50+</div>
              <div className="text-blue-200 text-sm">Course Programs</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">100+</div>
              <div className="text-blue-200 text-sm">Stationery Items</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">24/7</div>
              <div className="text-blue-200 text-sm">System Uptime</div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-8">
          <p className="text-gray-400 text-sm">
            Secure • Reliable • Efficient • Trusted by Educational Institutions
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;