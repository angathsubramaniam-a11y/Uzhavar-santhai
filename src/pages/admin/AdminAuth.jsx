import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { FiLock, FiShield, FiArrowLeft } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

export default function AdminAuth() {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && user.role === 'admin') {
      navigate('/admin/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === '1234') {
      login({ name: 'Super Admin', role: 'admin' });
      navigate('/admin/dashboard');
    } else {
      setError('Incorrect admin password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-[100px]" />
      
      <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-gray-400 font-bold hover:text-white transition-all z-20 group">
        <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center group-hover:scale-110 transition-transform">
          <FiArrowLeft size={20} />
        </div>
        <span className="hidden sm:inline">Back to Home</span>
      </Link>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="bg-gray-800 p-8 rounded-3xl shadow-2xl border border-gray-700">
          <div className="text-center mb-8 text-white">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-700 rounded-full mb-4">
              <FiShield size={32} className="text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Admin Security Portal</h2>
            <p className="text-gray-400 text-sm">Authorized personnel only</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <FiLock className="absolute top-3.5 left-4 text-gray-400" />
              <input 
                type="password" 
                placeholder="Admin PIN or Password" 
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" 
                required 
              />
            </div>
            
            {error && <p className="text-red-400 text-xs font-bold px-2">{error}</p>}
            
            <button type="submit" className="w-full py-3.5 mt-4 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all">
              Verify Identity
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
