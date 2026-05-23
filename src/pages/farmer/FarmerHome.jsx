import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { GiFarmer } from 'react-icons/gi';

export default function FarmerHome() {
  return (
    <div className="min-h-screen bg-forest text-cream flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute top-0 w-full h-full opacity-20 pointer-events-none">
        <img src="https://images.unsplash.com/photo-1595856728032-47d06634b070?w=1200&q=75&auto=format&fit=crop&fm=webp" className="w-full h-full object-cover"  loading="lazy" decoding="async" onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x400/eeeeee/999999?text=No+Image"; }} />
      </div>

      <div className="z-10 text-center max-w-4xl px-4 py-20">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-6xl mb-6 text-primary"><GiFarmer /></motion.div>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-5xl md:text-7xl font-bold text-white mb-6">
          Grow Your Business with Us
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-xl md:text-2xl text-cream/80 mb-12">
          Join 5,000+ farmers selling directly to customers at better margins. No middlemen. Just pure direct trade.
        </motion.p>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex flex-col sm:flex-row gap-6 justify-center">
          <Link to="/farmer/signup" className="px-8 py-4 rounded-full bg-primary text-white font-bold text-lg hover:bg-white hover:text-primary transition-all shadow-xl">
            Register Farm
          </Link>
          <Link to="/farmer/login" className="px-8 py-4 rounded-full border border-white/30 hover:bg-white/10 text-white font-bold text-lg transition-all">
            Login to Dashboard
          </Link>
        </motion.div>
      </div>

      <div className="z-10 grid grid-cols-1 md:grid-cols-3 gap-8 px-4 max-w-6xl w-full mt-12 pb-20">
        {[
          { title: 'Direct Access', desc: 'Connect directly with thousands of daily customers.' },
          { title: 'Better Margins', desc: 'Keep 100% of what you earn with zero platform fees.' },
          { title: 'Easy Management', desc: 'Simple tools to track orders, inventory, and analytics.' }
        ].map((feature, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + (i * 0.1) }} className="bg-white/10 backdrop-blur p-8 rounded-3xl border border-white/10">
            <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
            <p className="text-cream/80">{feature.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
