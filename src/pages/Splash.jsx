import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { GiSprout } from 'react-icons/gi';
import { FiArrowRight } from 'react-icons/fi';

export default function Splash() {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-sun/10 rounded-full blur-3xl"></div>
      </div>

      <div className="z-10 text-center mb-16 px-4">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center mb-4">
          <span className="text-6xl text-primary"><GiSprout /></span>
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-5xl md:text-6xl font-bold text-forest mb-4">
          Uzhavar Sandhai
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-xl text-earth font-medium">
          Choose your portal to continue
        </motion.p>
      </div>

      <div className="z-10 grid grid-cols-1 md:grid-cols-2 gap-8 px-4 max-w-4xl w-full">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Link to="/customer" className="block h-full bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all border border-gray-100 group">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform overflow-hidden shadow-inner bg-blue-50">
              <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&fm=webp" alt="Customer" className="w-full h-full object-cover"  loading="lazy" decoding="async" onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x400/eeeeee/999999?text=No+Image"; }} />
            </div>
            <h2 className="text-2xl font-bold text-forest mb-3">Customer Portal</h2>
            <p className="text-earth mb-6">Browse fresh agricultural products, buy directly from farmers, and manage your cart.</p>
            <div className="flex items-center text-blue-500 font-bold">
              Enter Portal <span className="ml-2"><FiArrowRight /></span>
            </div>
          </Link>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Link to="/farmer" className="block h-full bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all border border-primary/20 ring-4 ring-primary/5 group">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform overflow-hidden shadow-inner bg-green-50">
              <img src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=200&auto=format&fit=crop&fm=webp" alt="Farmer" className="w-full h-full object-cover"  loading="lazy" decoding="async" onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x400/eeeeee/999999?text=No+Image"; }} />
            </div>
            <h2 className="text-2xl font-bold text-forest mb-3">Farmer Portal</h2>
            <p className="text-earth mb-6">Manage your farm profile, list products, track orders, and view earnings.</p>
            <div className="flex items-center text-primary font-bold">
              Enter Portal <span className="ml-2"><FiArrowRight /></span>
            </div>
          </Link>
        </motion.div>
      </div>


    </div>
  );
}
