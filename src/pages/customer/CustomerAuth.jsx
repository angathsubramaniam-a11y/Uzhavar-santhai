import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiUser, FiMapPin, FiPhone, FiArrowRight, FiArrowLeft } from 'react-icons/fi';
import { GiSprout } from 'react-icons/gi';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../../context/AuthContext';
import { useCustomers } from '../../context/CustomerContext';

export default function CustomerAuth({ type }) {
  const isLogin = type === 'login';
  const navigate = useNavigate();
  const { user, login, loginWithGoogle } = useAuth();
  const { addCustomer, getCustomerByEmail } = useCustomers();

  // Redirect if already logged in
  useEffect(() => {
    if (user && user.role === 'customer') {
      navigate('/customer/home');
    }
  }, [user, navigate]);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    location: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }

    setTimeout(async () => {
      if (isLogin) {
        const user = getCustomerByEmail(formData.email);
        if (user) {
          login({ ...user, role: 'customer' });
          navigate('/customer/home');
        } else {
          setError('Email not found. Please sign up.');
          setLoading(false);
        }
      } else {
        const existing = getCustomerByEmail(formData.email);
        if (existing) {
          setError('Email already registered. Please login.');
          setLoading(false);
        } else {
          const newUser = {
            ...formData,
            role: 'customer'
          };
          
          let createdCustomer;
          try {
            createdCustomer = await Promise.race([
              addCustomer(newUser),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Database timeout')), 5000))
            ]);
          } catch (err) {
            console.error('Customer DB Error:', err);
            createdCustomer = { ...newUser, id: Date.now() }; // Ultimate fallback
          }
          
          if (!createdCustomer) {
            createdCustomer = { ...newUser, id: Date.now() };
          }
          
          login({ ...createdCustomer, role: 'customer' });
          setLoading(false);
          navigate('/customer/home');
        }
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream relative overflow-hidden p-4">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-sun/20 rounded-full blur-3xl" />
      
      <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-forest font-bold hover:text-primary transition-all z-20 group">
        <div className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center group-hover:scale-110 transition-transform">
          <FiArrowLeft size={20} />
        </div>
        <span className="hidden sm:inline">Back to Home</span>
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white">
          <div className="text-center mb-8">
            <Link to="/" className="inline-block text-4xl mb-4 text-primary"><GiSprout /></Link>
            <h2 className="text-3xl font-black text-forest mb-2">
              {isLogin ? 'Customer Login' : 'Customer Signup'}
            </h2>
            <p className="text-earth text-sm">
              {isLogin ? 'Welcome back! Enter your email to login.' : 'Join us to buy fresh produce directly from farmers.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="relative">
                  <FiUser className="absolute top-4 left-4 text-gray-400" />
                  <input name="fullName" type="text" placeholder="Full Name" value={formData.fullName} onChange={handleChange} className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-primary transition-all" required />
                </div>
                <div className="relative">
                  <FiMapPin className="absolute top-4 left-4 text-gray-400" />
                  <input name="location" type="text" placeholder="Location" value={formData.location} onChange={handleChange} className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-primary transition-all" required />
                </div>
                <div className="relative">
                  <FiPhone className="absolute top-4 left-4 text-gray-400" />
                  <input name="phone" type="tel" placeholder="Mobile Number" value={formData.phone} onChange={handleChange} className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-primary transition-all" required />
                </div>
              </>
            )}
            
            <div className="relative">
              <FiMail className="absolute top-4 left-4 text-gray-400" />
              <input name="email" type="email" placeholder="Email Address" value={formData.email} onChange={handleChange} className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-primary transition-all" required />
            </div>
            
            <div className="relative">
              <FiLock className="absolute top-4 left-4 text-gray-400" />
              <input name="password" type="password" placeholder="Password" value={formData.password} onChange={handleChange} className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-primary transition-all" required />
            </div>

            {error && <p className="text-red-500 text-xs font-bold px-2">{error}</p>}

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full py-4 mt-4 rounded-2xl text-white font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${loading ? 'bg-gray-400' : 'bg-gradient-to-r from-primary to-secondary hover:shadow-xl hover:scale-[1.02]'}`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <> {isLogin ? 'Login' : 'Create Account'} <FiArrowRight /> </>
              )}
            </button>


          </form>

          <p className="text-center mt-8 text-earth text-sm">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <Link to={isLogin ? '/customer/signup' : '/customer/login'} className="text-primary font-bold hover:underline">
              {isLogin ? 'Sign up here' : 'Login here'}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

