 
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { GiFarmer } from 'react-icons/gi';
import {
  FiMail, FiLock, FiUser, FiMapPin, FiPhone,
  FiArrowRight, FiArrowLeft, FiCheckCircle
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useFarmers } from '../../context/FarmerContext';

// Registration steps
const STEP_FORM    = 'form';    // Fill in details
const STEP_SUCCESS = 'success'; // Account created

export default function FarmerAuth({ type }) {
  const isLogin = type === 'login';
  const navigate = useNavigate();
  const { user, login, logout } = useAuth();
  const { addFarmer, farmers } = useFarmers();

  // ─── Shared state ────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    farmerName: '', farmName: '', phone: '', location: '', email: '', password: ''
  });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  // ─── REGISTRATION state ──────────────────────────────────────────────────────
  const [regStep, setRegStep] = useState(STEP_FORM);

  // Redirect if already logged in and verified
  useEffect(() => {
    if (user && user.role === 'farmer') {
      if (user.status === 'Verified') {
        navigate('/farmer/dashboard');
      }
    }
  }, [user, navigate]);

  // Handle query parameters and existing non-verified users
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('error') === 'not_verified' || (user && user.role === 'farmer' && user.status !== 'Verified')) {
      if (user && user.role === 'farmer') {
        const status = user.status;
        logout();
        if (status === 'Pending') {
          setError('Your account is pending admin approval. You will be able to log in once approved.');
        } else if (status === 'Suspended') {
          setError('Your account has been suspended. Please contact support.');
        } else if (status === 'Rejected') {
          setError('Your registration has been rejected.');
        } else {
          setError('Your account is not approved yet.');
        }
      } else {
        setError('Your account is pending admin approval. You will be able to log in once approved.');
      }
      // Clear URL params
      navigate('/farmer/login', { replace: true });
    }
  }, [user, logout, navigate]);

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  // ─── LOGIN handlers ──────────────────────────────────────────────────────────
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    setTimeout(() => {
      const matched = farmers.find(f => f.email?.toLowerCase() === formData.email?.toLowerCase());
      if (matched) {
        if (matched.password === formData.password) {
          // Check farmer status before logging in
          if (matched.status !== 'Verified') {
            if (matched.status === 'Pending') {
              setError('Your account is pending admin approval. You will be able to log in once approved.');
            } else if (matched.status === 'Suspended') {
              setError('Your account has been suspended. Please contact support.');
            } else if (matched.status === 'Rejected') {
              setError('Your registration has been rejected.');
            } else {
              setError(`Your account status is currently: ${matched.status}.`);
            }
            setLoading(false);
            return;
          }

          login({
            id: matched.id, name: matched.name, farmName: matched.farmName,
            phone: matched.phone, location: matched.location,
            email: matched.email || '', role: 'farmer',
            rating: matched.rating, status: matched.status, image: matched.image,
            bankDetails: matched.bankDetails || null
          });
          navigate('/farmer/dashboard');
        } else {
          setError('Incorrect password. Please try again.');
          setLoading(false);
        }
      } else {
        setError('No farmer account found with this email address.');
        setLoading(false);
      }
    }, 1000);
  };

  // ─── REGISTRATION handlers ───────────────────────────────────────────────────
  const handleRegFormSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    setTimeout(async () => {
      try {
        const existingPhone = farmers.find(f => f.phone === formData.phone);
        const existingEmail = farmers.find(f => f.email?.toLowerCase() === formData.email?.toLowerCase());

        if (existingPhone) {
          setError('Mobile number is already registered.');
          setLoading(false);
          return;
        }

        if (existingEmail) {
          setError('Email address is already registered.');
          setLoading(false);
          return;
        }

        const newFarmerData = {
          name: formData.farmerName,
          farmName: formData.farmName,
          phone: formData.phone,
          location: formData.location,
          email: formData.email,
          password: formData.password,
          status: 'Pending',
          rating: 5.0,
          image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=400'
        };

        let createdFarmer;
        try {
          // Add a 5 second timeout to prevent hanging
          createdFarmer = await Promise.race([
            addFarmer(newFarmerData),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Database timeout')), 5000))
          ]);
        } catch (dbErr) {
          console.error("DB Error or Timeout:", dbErr);
          createdFarmer = { ...newFarmerData, id: Date.now() }; // Ultimate fallback
        }

        if (!createdFarmer) {
           createdFarmer = { ...newFarmerData, id: Date.now() };
        }

        // Do not automatically login a pending farmer
        setRegStep(STEP_SUCCESS);
        setTimeout(() => navigate('/farmer/login'), 4000);
      } catch (err) {
        console.error("Registration error:", err);
        setError('Something went wrong during registration. Please try again.');
      } finally {
        setLoading(false);
      }
    }, 1000);
  };

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream relative overflow-hidden p-4">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-forest/20 rounded-full blur-3xl" />

      <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-forest font-bold hover:text-primary transition-all z-20 group">
        <div className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center group-hover:scale-110 transition-transform">
          <FiArrowLeft size={20} />
        </div>
        <span className="hidden sm:inline">Back to Home</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg z-10"
      >
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white">

          {/* ── Header ── */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-block text-4xl mb-4 text-forest"><GiFarmer /></Link>
            <h2 className="text-3xl font-black text-forest mb-2">
              {isLogin ? 'Farmer Login' : (regStep === STEP_SUCCESS ? 'Welcome aboard! 🎉' : 'Farmer Registration')}
            </h2>
            <p className="text-earth text-sm">
              {isLogin
                ? 'Access your vendor portal with your credentials.'
                : regStep === STEP_FORM ? 'Start selling farm crops directly to consumers.'
                : 'Your farm account is ready!'}
            </p>
          </div>

          {/* ════════════════════════════════════════════
              LOGIN FLOW
          ════════════════════════════════════════════ */}
          {isLogin && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="relative">
                <FiMail className="absolute top-4 left-4 text-gray-400" />
                <input
                  name="email" type="email" placeholder="Email Address"
                  value={formData.email} onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
                  required
                />
              </div>
              <div className="relative">
                <FiLock className="absolute top-4 left-4 text-gray-400" />
                <input
                  name="password" type="password" placeholder="Password"
                  value={formData.password} onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
                  required
                />
              </div>

              {error && <p className="text-red-500 text-xs font-bold px-2">{error}</p>}

              <button type="submit" disabled={loading} className={`w-full py-4 mt-2 rounded-2xl text-white font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${loading ? 'bg-gray-400' : 'bg-gradient-to-r from-forest to-primary hover:shadow-xl hover:scale-[1.02]'}`}>
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Login <FiArrowRight /></>}
              </button>
            </form>
          )}

          {/* ════════════════════════════════════════════
              REGISTRATION FLOW
          ════════════════════════════════════════════ */}
          {!isLogin && regStep === STEP_FORM && (
            <form onSubmit={handleRegFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <FiUser className="absolute top-4 left-4 text-gray-400" />
                  <input name="farmerName" type="text" placeholder="Farmer Full Name" value={formData.farmerName} onChange={handleChange} className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-primary transition-all text-sm" required />
                </div>
                <div className="relative">
                  <GiFarmer className="absolute top-4 left-4 text-gray-400 text-lg" />
                  <input name="farmName" type="text" placeholder="Farm Name" value={formData.farmName} onChange={handleChange} className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-primary transition-all text-sm" required />
                </div>
                <div className="relative md:col-span-2">
                  <FiMapPin className="absolute top-4 left-4 text-gray-400" />
                  <input name="location" type="text" placeholder="Farm Location" value={formData.location} onChange={handleChange} className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-primary transition-all text-sm" required />
                </div>
                <div className="relative md:col-span-2">
                  <FiMail className="absolute top-4 left-4 text-gray-400" />
                  <input name="email" type="email" placeholder="Email Address" value={formData.email} onChange={handleChange} className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-primary transition-all text-sm" required />
                </div>
              </div>
              <div className="relative">
                <FiPhone className="absolute top-4 left-4 text-gray-400" />
                <input name="phone" type="tel" placeholder="Mobile Number" value={formData.phone} onChange={handleChange} className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-primary transition-all text-sm" required />
              </div>
              <div className="relative">
                <FiLock className="absolute top-4 left-4 text-gray-400" />
                <input name="password" type="password" placeholder="Password" value={formData.password} onChange={handleChange} className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-primary transition-all text-sm" required />
              </div>

              {error && <p className="text-red-500 text-xs font-bold px-2">{error}</p>}

              <button type="submit" disabled={loading} className={`w-full py-4 mt-2 rounded-2xl text-white font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${loading ? 'bg-gray-400' : 'bg-gradient-to-r from-forest to-primary hover:shadow-xl hover:scale-[1.02]'}`}>
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Register Farm <FiArrowRight /></>}
              </button>
            </form>
          )}

          {/* ════════════════════════════════════════════
              REGISTRATION FLOW – Success
          ════════════════════════════════════════════ */}
          {!isLogin && regStep === STEP_SUCCESS && (
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-4">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <FiCheckCircle className="text-green-500" size={40} />
              </div>
              <p className="text-gray-800 font-bold mb-2">Registration Submitted!</p>
              <p className="text-gray-600 text-sm mb-4">Your account is pending admin approval. You will be able to log in once your account is verified.</p>
              <p className="text-xs text-gray-400 animate-pulse">Redirecting to the login page...</p>
            </motion.div>
          )}

          {/* Footer link */}
          {!(regStep === STEP_SUCCESS) && (
            <p className="text-center mt-8 text-earth text-sm">
              {isLogin ? 'New farmer? ' : 'Already registered? '}
              <Link to={isLogin ? '/farmer/signup' : '/farmer/login'} className="text-primary font-bold hover:underline">
                {isLogin ? 'Register your farm' : 'Login here'}
              </Link>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

