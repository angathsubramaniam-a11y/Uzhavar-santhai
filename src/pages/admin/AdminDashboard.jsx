import { useState, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { FiUsers, FiShoppingBag, FiActivity, FiSettings, FiLogOut, FiMessageSquare, FiCheckCircle, FiDollarSign, FiTruck, FiUserCheck } from 'react-icons/fi';
import { useFarmers } from '../../context/FarmerContext';
import { useAuth } from '../../context/AuthContext';
import { useProducts } from '../../context/ProductContext';
import { useOrders } from '../../context/OrdersContext';

// Lazy load sub-components for better performance
const AdminFarmerManagement = lazy(() => import('./AdminFarmerManagement'));
const AdminCustomerManagement = lazy(() => import('./AdminCustomerManagement'));
const AdminRiderManagement = lazy(() => import('./AdminRiderManagement'));
const AdminSupportManagement = lazy(() => import('./AdminSupportManagement'));
const AdminSettings = lazy(() => import('./AdminSettings'));
const AdminPayouts = lazy(() => import('./AdminPayouts'));
const AdminOrders = lazy(() => import('./AdminOrders'));

// Local loading component
const AdminLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
  </div>
);

function AdminOverview() {
  const { farmers, updateFarmer, deleteFarmer } = useFarmers();
  const { products } = useProducts();
  const { orders } = useOrders();
  const [toast, setToast] = useState(null);

  const handleStatusChange = (id, newStatus) => {
    if (newStatus === 'Rejected') {
      deleteFarmer(id);
      setToast({ message: `Farmer registration rejected and deleted!`, type: 'error' });
    } else {
      updateFarmer(id, { status: newStatus });
      setToast({ message: `Farmer approved & verified!`, type: 'success' });
    }
    setTimeout(() => setToast(null), 3000);
  };

  const pendingFarmers = farmers.filter(f => f.status === 'Pending');
  const activeFarmersCount = farmers.filter(f => f.status === 'Verified').length;
  const totalProducts = products.length;
  const totalGMV = orders.reduce((acc, o) => acc + parseFloat(o.total || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in relative">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 right-8 z-[100] bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 font-bold">
            <FiCheckCircle /> {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <h2 className="text-2xl font-bold text-gray-800">Platform Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total GMV', value: `₹${totalGMV.toLocaleString()}`, icon: <FiActivity />, color: 'text-blue-600 bg-blue-50' },
          { label: 'Active Farmers', value: activeFarmersCount, icon: <FiUsers />, color: 'text-green-600 bg-green-50' },
          { label: 'Total Products', value: totalProducts, icon: <FiShoppingBag />, color: 'text-purple-600 bg-purple-50' },
          { label: 'Pending Requests', value: pendingFarmers.length, icon: <FiMessageSquare />, color: 'text-orange-600 bg-orange-50' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${stat.color}`}>{stat.icon}</div>
              <div className="text-sm font-medium text-gray-500">{stat.label}</div>
            </div>
            <div className={`text-3xl font-bold ${stat.color.split(' ')[0]}`}>{stat.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-bold text-gray-800 mb-4">Farmer Verification Requests</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-500 border-b border-gray-100">
                <th className="pb-3 font-medium">Farmer</th>
                <th className="pb-3 font-medium">Email</th>
                <th className="pb-3 font-medium">Submitted</th>
                <th className="pb-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingFarmers.map((farmer) => (
                <tr key={farmer.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="py-4 flex items-center gap-3">
                    <img src={farmer.image || 'https://placehold.co/400x400/eeeeee/999999?text=No+Image'} className="w-8 h-8 rounded-full object-cover" alt=""  loading="lazy" decoding="async" onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x400/eeeeee/999999?text=No+Image"; }} />
                    <div>
                      <div className="font-bold text-gray-800">{farmer.name}</div>
                      <div className="text-xs text-gray-500">{farmer.farmName}</div>
                    </div>
                  </td>
                  <td className="py-4 text-gray-600">{farmer.email}</td>
                  <td className="py-4 text-gray-600 text-sm">
                    {farmer.joinedDate || 'N/A'}
                  </td>
                  <td className="py-4 text-right">
                    <button onClick={() => handleStatusChange(farmer.id, 'Verified')} className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold mr-2 hover:bg-green-200 transition-colors">Approve</button>
                    <button onClick={() => handleStatusChange(farmer.id, 'Rejected')} className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold hover:bg-red-200 transition-colors">Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pendingFarmers.length === 0 && <div className="py-8 text-center text-gray-500">No pending verification requests.</div>}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const location = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const handleExit = () => { logout(); navigate('/'); };
  const navLinks = [
    { path: '/admin/dashboard', name: 'Overview', icon: <FiActivity /> },
    { path: '/admin/orders', name: 'Rider Dispatch', icon: <FiTruck /> },
    { path: '/admin/payouts', name: 'Weekly Payouts', icon: <FiDollarSign /> },
    { path: '/admin/farmers', name: 'Farmers', icon: <FiUsers /> },
    { path: '/admin/customers', name: 'Customers', icon: <FiShoppingBag /> },
    { path: '/admin/riders', name: 'Riders', icon: <FiUserCheck /> },
    { path: '/admin/support', name: 'Support', icon: <FiMessageSquare /> },
    { path: '/admin/settings', name: 'Settings', icon: <FiSettings /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      <aside className="w-64 bg-gray-900 text-white flex flex-col hidden md:flex fixed h-full shadow-xl z-20">
        <div className="p-6 text-2xl font-black border-b border-gray-800 text-center text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-400">
          Uzhavar Admin
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              to={link.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-bold ${location.pathname === link.path || (link.path === '/admin/dashboard' && location.pathname === '/admin') ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
            >
              {link.icon} {link.name}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button onClick={handleExit} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-gray-800 font-bold transition-colors">
            <FiLogOut /> Exit Panel
          </button>
        </div>
      </aside>

      <div className="flex-1 md:ml-64 p-8">
        <Suspense fallback={<AdminLoader />}>
          <Routes>
            <Route path="/" element={<AdminOverview />} />
            <Route path="dashboard" element={<AdminOverview />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="payouts" element={<AdminPayouts />} />
            <Route path="farmers" element={<AdminFarmerManagement />} />
            <Route path="customers" element={<AdminCustomerManagement />} />
            <Route path="riders" element={<AdminRiderManagement />} />
            <Route path="support" element={<AdminSupportManagement />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="*" element={<div className="text-center py-20 text-gray-500 font-bold">Feature in development...</div>} />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
}
