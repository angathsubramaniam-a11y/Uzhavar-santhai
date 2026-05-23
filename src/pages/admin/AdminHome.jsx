import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiShield } from 'react-icons/fi';

export default function AdminHome() {
  return (
    <div className="min-h-screen bg-gray-900 text-cream flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute top-0 w-full h-full opacity-20 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-700 via-gray-900 to-black">
      </div>

      <div className="z-10 text-center max-w-4xl px-4 py-20">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-6xl mb-6 text-primary"><FiShield /></motion.div>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-5xl md:text-7xl font-bold text-white mb-6">
          Admin Control Center
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-xl md:text-2xl text-gray-400 mb-12">
          Secure portal for managing farmers, overseeing marketplace transactions, and resolving support issues.
        </motion.p>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex flex-col sm:flex-row gap-6 justify-center">
          <Link to="/admin/login" className="px-8 py-4 rounded-full bg-purple-600 text-white font-bold text-lg hover:bg-purple-500 transition-all shadow-xl shadow-purple-900/50">
            Login to Admin Panel
          </Link>
          <Link to="/" className="px-8 py-4 rounded-full border border-gray-700 hover:bg-gray-800 text-gray-300 font-bold text-lg transition-all">
            Return to Gateway
          </Link>
        </motion.div>
      </div>

      <div className="z-10 grid grid-cols-1 md:grid-cols-3 gap-8 px-4 max-w-6xl w-full mt-12 pb-20">
        {[
          { title: 'Farmer Verification', desc: 'Review and approve new farm registrations to ensure quality.' },
          { title: 'Payout Management', desc: 'Manage financial transactions, review earnings, and process payouts.' },
          { title: 'System Moderation', desc: 'Manage user disputes, refunds, and policy enforcement.' }
        ].map((feature, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + (i * 0.1) }} className="bg-gray-800/50 backdrop-blur p-8 rounded-3xl border border-gray-700">
            <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
            <p className="text-gray-400">{feature.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
