import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { GiScooter } from 'react-icons/gi';
import { FiMail, FiLock, FiUser, FiPhone, FiArrowRight, FiArrowLeft, FiAlertCircle } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../../context/AuthContext';
import { useOrders } from '../../context/OrdersContext';

export default function DeliveryAuth({ type }) {
  const isLogin = type === 'login';
  const navigate = useNavigate();
  const { user, login, loginWithGoogle } = useAuth();
  const { riders, addRider } = useOrders();

  // Redirect if already logged in as delivery partner
  useEffect(() => {
    if (user && user.role === 'delivery') {
      navigate('/delivery/dashboard');
    }
  }, [user, navigate]);

  const [formData, setFormData] = useState({
    riderName: '',
    phone: '',
    vehicleName: '',
    vehiclePlate: '',
    vehicleType: 'Bike',
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

    // Phone standardizer helper to match local/international formats flexibly
    const cleanPhone = (p) => p.replace(/\D/g, '');
    const isPhoneMatch = (p1, p2) => {
      const c1 = cleanPhone(p1);
      const c2 = cleanPhone(p2);
      if (!c1 || !c2) return false;
      return c1.endsWith(c2) || c2.endsWith(c1);
    };

    setTimeout(() => {
      if (isLogin) {
        // Authenticate based on phone number from global riders list
        const rider = riders.find(r => isPhoneMatch(r.phone, formData.phone));
        if (rider) {
          login({ ...rider, role: 'delivery' });
          navigate('/delivery/dashboard');
        } else {
          setError('Mobile number not found. Please register as a rider partner.');
          setLoading(false);
        }
      } else {
        // Sign up
        const existing = riders.find(r => isPhoneMatch(r.phone, formData.phone));
        if (existing) {
          setError('Mobile number already registered. Please login.');
          setLoading(false);
        } else {
          const newRider = {
            id: Math.floor(1000 + Math.random() * 9000),
            name: formData.riderName,
            phone: formData.phone,
            vehicle: `${formData.vehicleName} (${formData.vehiclePlate})`,
            status: 'Online',
            rating: 5.0,
            distance: parseFloat((0.5 + Math.random() * 4).toFixed(1)),
            activeOrders: 0,
            weeklyDeliveries: 0,
            weeklyEarnings: 0,
            bonus: 0,
            acceptanceRate: 100,
            acceptances: 0,
            rejections: 0
          };
          addRider(newRider);
          login({ ...newRider, role: 'delivery' });
          setLoading(false);
          alert('Registration successful! You are now logged into the Rider Portal.');
          navigate('/delivery/dashboard');
        }
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 relative overflow-hidden p-4">
      {/* Decorative background gradients */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-green-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl" />
      
      <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-gray-400 font-bold hover:text-white transition-all z-20 group">
        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
          <FiArrowLeft size={20} className="text-gray-300" />
        </div>
        <span className="hidden sm:inline text-gray-300">Back to Home</span>
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg z-10 my-10"
      >
        <div className="bg-gray-900 text-white p-8 rounded-3xl shadow-2xl border border-gray-800 relative">
          <div className="text-center mb-8">
            <Link to="/" className="inline-block text-5xl mb-4 text-green-400 p-3 bg-green-500/10 rounded-2xl shadow-inner">
              <GiScooter />
            </Link>
            <h2 className="text-3xl font-black tracking-tight text-white mb-2">
              {isLogin ? 'Rider Portal Login' : 'Rider Onboarding Request'}
            </h2>
            <p className="text-gray-400 text-sm">
              {isLogin 
                ? 'Ready to make quick deliveries? Enter phone to login.' 
                : 'Join our green delivery network and start earning today.'
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative md:col-span-2">
                  <FiUser className="absolute top-4 left-4 text-gray-500" />
                  <input 
                    name="riderName" 
                    type="text" 
                    placeholder="Full Name" 
                    value={formData.riderName} 
                    onChange={handleChange} 
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-gray-950 border border-gray-800 outline-none focus:ring-2 focus:ring-green-500 transition-all text-sm text-white" 
                    required 
                  />
                </div>
                <div className="relative">
                  <GiScooter className="absolute top-4 left-4 text-gray-500 text-lg" />
                  <input 
                    name="vehicleName" 
                    type="text" 
                    placeholder="Vehicle (e.g. Honda Activa)" 
                    value={formData.vehicleName} 
                    onChange={handleChange} 
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-gray-950 border border-gray-800 outline-none focus:ring-2 focus:ring-green-500 transition-all text-sm text-white" 
                    required 
                  />
                </div>
                <div className="relative">
                  <input 
                    name="vehiclePlate" 
                    type="text" 
                    placeholder="Plate # (e.g. TN-37-X-1234)" 
                    value={formData.vehiclePlate} 
                    onChange={handleChange} 
                    className="w-full px-4 py-3.5 rounded-2xl bg-gray-950 border border-gray-800 outline-none focus:ring-2 focus:ring-green-500 transition-all text-sm text-white" 
                    required 
                  />
                </div>
                <div className="relative md:col-span-2">
                  <span className="text-xs font-bold text-gray-500 block mb-2 uppercase">Vehicle Type</span>
                  <div className="grid grid-cols-3 gap-2">
                    {['Bike', 'Scooter', 'Electric Vehicle'].map(typeOpt => (
                      <button
                        key={typeOpt}
                        type="button"
                        onClick={() => setFormData({ ...formData, vehicleType: typeOpt })}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          formData.vehicleType === typeOpt
                            ? 'border-green-500 bg-green-500/10 text-white'
                            : 'border-gray-800 bg-gray-950 text-gray-400 hover:text-white'
                        }`}
                      >
                        {typeOpt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            <div className="relative">
              <FiPhone className="absolute top-4 left-4 text-gray-500" />
              <input 
                name="phone" 
                type="tel" 
                placeholder="Mobile Number" 
                value={formData.phone} 
                onChange={handleChange} 
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-gray-950 border border-gray-800 outline-none focus:ring-2 focus:ring-green-500 transition-all text-white text-sm" 
                required 
              />
            </div>
            
            <div className="relative">
              <FiLock className="absolute top-4 left-4 text-gray-500" />
              <input 
                name="password" 
                type="password" 
                placeholder="Password" 
                value={formData.password} 
                onChange={handleChange} 
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-gray-950 border border-gray-800 outline-none focus:ring-2 focus:ring-green-500 transition-all text-white text-sm" 
                required 
              />
            </div>

            {error && (
              <p className="text-red-400 text-xs font-bold px-2 flex items-center gap-1">
                <FiAlertCircle /> {error}
              </p>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full py-4 mt-6 rounded-2xl text-white font-bold text-base shadow-lg transition-all flex items-center justify-center gap-2 ${
                loading ? 'bg-gray-800 text-gray-500' : 'bg-gradient-to-r from-green-600 to-emerald-500 hover:shadow-xl hover:shadow-green-500/15 hover:scale-[1.02]'
              }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <> {isLogin ? 'Enter Rider Console' : 'Complete Onboarding'} <FiArrowRight /> </>
              )}
            </button>


          </form>

          <p className="text-center mt-8 text-gray-400 text-sm">
            {isLogin ? "New rider partner? " : "Already onboarded? "}
            <Link 
              to={isLogin ? '/delivery/signup' : '/delivery/login'} 
              className="text-green-400 font-bold hover:underline"
            >
              {isLogin ? 'Sign up here' : 'Login here'}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
