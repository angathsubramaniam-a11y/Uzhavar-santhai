import { motion } from 'framer-motion';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { FiHome, FiBox, FiList, FiMessageSquare, FiUser, FiBell, FiLogOut } from 'react-icons/fi';
import { GiSprout } from 'react-icons/gi';
import { useAuth } from '../../context/AuthContext';
import { useProducts } from '../../context/ProductContext';
import { useOrders } from '../../context/OrdersContext';
import { useState, useMemo, useEffect } from 'react';

// Import new modular components
import FarmerDashboardOverview from './FarmerDashboardOverview';
import FarmerProducts from './FarmerProducts';
import FarmerOrders from './FarmerOrders';
import FarmerSupport from './FarmerSupport';
import FarmerProfile from './FarmerProfile';
import { AnimatePresence } from 'framer-motion';

export default function FarmerDashboard() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { products } = useProducts();
  const { orders, payouts } = useOrders();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/'); };

  const [showNotifications, setShowNotifications] = useState(false);
  const [readNotifications, setReadNotifications] = useState([]);

  const isOrderForFarmer = (o, fId) => {
    if (!fId) return false;
    return String(o.farmerId) === String(fId) || 
      (Array.isArray(o.items) && o.items.some(item => String(item.farmerId) === String(fId)));
  };

  // Live Toast for freshly delivered orders
  const [lastDeliveredOrders, setLastDeliveredOrders] = useState(() => {
    return orders.filter(o => o.status === 'Delivered' && isOrderForFarmer(o, user?.id)).map(o => o.id);
  });
  const [deliveryToast, setDeliveryToast] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    const currentDelivered = orders.filter(o => o.status === 'Delivered' && isOrderForFarmer(o, user?.id));
    
     
    setLastDeliveredOrders(prev => {
      const newDelivered = currentDelivered.filter(o => !prev.includes(o.id));
      if (newDelivered.length > 0) {
        const order = newDelivered[0];
        // Defer toast state updates to avoid synchronous setState inside render/effect cycle
        setTimeout(() => {
          setDeliveryToast(order);
          setTimeout(() => setDeliveryToast(null), 6000);
        }, 0);
        return currentDelivered.map(o => o.id);
      }
      
      const allDeliveredIds = currentDelivered.map(o => o.id);
      // Only update if lists differ to prevent unnecessary state updates
      const hasChanged = allDeliveredIds.length !== prev.length || 
                         allDeliveredIds.some((id, idx) => id !== prev[idx]);
      if (hasChanged) {
        return allDeliveredIds;
      }
      return prev;
    });
  }, [orders, user?.id]);

  const notifications = useMemo(() => {
    const notifs = [];
    const pendingOrders = orders.filter(o => o.status === 'Pending' && isOrderForFarmer(o, user?.id));
    pendingOrders.forEach(o => {
      notifs.push({
        id: `order-${o.id}`,
        title: 'New Order Received',
        message: `Order #${o.id} for ₹${o.total}`,
        time: o.date,
        type: 'order'
      });
    });

    const deliveredOrders = orders.filter(o => o.status === 'Delivered' && isOrderForFarmer(o, user?.id));
    deliveredOrders.forEach(o => {
      notifs.push({
        id: `delivered-${o.id}`,
        title: '🎉 Order is Delivered',
        message: `Order #${o.id} has been delivered to the customer.`,
        time: o.deliveredAt || o.date,
        type: 'delivered'
      });
    });

    const lowStockProducts = products.filter(p => p.farmerId === user?.id && p.stock < 20);
    lowStockProducts.forEach(p => {
      notifs.push({
        id: `stock-${p.id}`,
        title: 'Low Stock Alert',
        message: `Only ${p.stock} ${p.unit} of ${p.name} left.`,
        time: new Date().toISOString(),
        type: 'alert'
      });
    });

    // Dynamic Weekly Payout Notifications
    const farmerPayouts = (payouts?.farmers || []).filter(p => String(p.farmerId) === String(user?.id));
    farmerPayouts.forEach(p => {
      notifs.push({
        id: `payout-${p.id}-${p.status}`,
        title: p.status === 'Paid' ? '💰 Weekly Payout Disbursed!' : '⏳ Payout Pending Approval',
        message: p.status === 'Paid' 
          ? `Your weekly payout of ₹${p.netEarnings.toFixed(2)} has been successfully credited to your bank account.`
          : `Your weekly payout of ₹${p.netEarnings.toFixed(2)} is pending approval for week ending ${p.weekEndDate}.`,
        time: p.createdAt || new Date().toISOString(),
        type: 'payout'
      });
    });

    return notifs.sort((a, b) => new Date(b.time) - new Date(a.time));
  }, [orders, products, user, payouts]);

  const unreadCount = notifications.filter(n => !readNotifications.includes(n.id)).length;

  const navLinks = [
    { path: '/farmer/dashboard', name: 'Dashboard', icon: <FiHome /> },
    { path: '/farmer/products', name: 'Products', icon: <FiBox /> },
    { path: '/farmer/orders', name: 'Orders', icon: <FiList /> },
    { path: '/farmer/support', name: 'Support', icon: <FiMessageSquare /> },
    { path: '/farmer/profile', name: 'Profile', icon: <FiUser /> },
  ];

  if (user && user.role === 'farmer' && user.status !== 'Verified') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream relative overflow-hidden p-4">
        {/* Decorative background blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-forest/20 rounded-full blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg z-10"
        >
          <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white text-center">
            <div className="text-5xl mb-4 flex justify-center">
              {user.status === 'Pending' && <span className="text-orange-500 animate-pulse">⏳</span>}
              {user.status === 'Suspended' && <span className="text-yellow-500 animate-bounce">⚠️</span>}
              {user.status === 'Rejected' && <span className="text-red-500">❌</span>}
            </div>
            
            <h2 className="text-3xl font-black text-forest mb-2">
              {user.status === 'Pending' && 'Account Pending Approval'}
              {user.status === 'Suspended' && 'Account Suspended'}
              {user.status === 'Rejected' && 'Registration Rejected'}
            </h2>

            <p className="text-earth text-sm mb-8 leading-relaxed font-medium">
              {user.status === 'Pending' && 'Your farm registration is currently pending review by our administration team. We are verifying your details and will activate your account shortly.'}
              {user.status === 'Suspended' && 'Your farmer account has been temporarily suspended by the administrator. Please reach out to support if you believe this is an error.'}
              {user.status === 'Rejected' && 'Your farmer registration request has been rejected by the administrator. Please contact our support team for more details.'}
            </p>

            <div className="flex gap-4">
              <button 
                onClick={handleLogout} 
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-forest to-primary text-white font-bold text-base shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
              >
                <FiLogOut /> Logout
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-forest text-white flex flex-col hidden md:flex fixed h-full">
        <div className="p-6">
          <div className="flex items-center gap-2 text-2xl font-bold text-white mb-8">
            <span className="text-primary"><GiSprout size={24} /></span> Uzhavar Sandhai
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              to={link.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${location.pathname === link.path || (link.path === '/farmer/dashboard' && location.pathname === '/farmer') ? 'bg-primary text-white' : 'text-cream/70 hover:bg-white/10'}`}
            >
              {link.icon} {link.name}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-300 hover:bg-red-500/10 transition-colors">
            <FiLogOut /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="bg-white shadow-sm px-8 py-4 flex justify-between items-center sticky top-0 z-10">
          <h1 className="text-xl font-bold text-forest">Farmer Portal</h1>
          <div className="flex items-center gap-6">
            <div className="relative">
              <button onClick={() => setShowNotifications(!showNotifications)} className="relative text-earth hover:text-primary">
                <FiBell size={24} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[8px] text-white font-bold">{unreadCount}</span>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
                  <div className="p-4 border-b border-gray-100 font-bold text-gray-800 flex justify-between items-center">
                    Notifications
                    <button onClick={() => setReadNotifications(notifications.map(n => n.id))} className="text-xs text-primary font-medium hover:underline">Mark all read</button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-sm">No new notifications</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} onClick={() => !readNotifications.includes(n.id) && setReadNotifications([...readNotifications, n.id])} className={`p-4 border-b border-gray-50 text-sm cursor-pointer hover:bg-gray-50 ${readNotifications.includes(n.id) ? 'bg-white' : 'bg-green-50'}`}>
                          <div className="font-bold text-gray-800">{n.title}</div>
                          <div className="text-gray-600 mt-1">{n.message}</div>
                          <div className="text-xs text-gray-400 mt-2">{new Date(n.time).toLocaleString() !== 'Invalid Date' ? new Date(n.time).toLocaleDateString() : n.time}</div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-3 bg-gray-50 text-center border-t border-gray-100">
                    <Link to="/farmer/orders" onClick={() => setShowNotifications(false)} className="text-sm font-bold text-primary hover:underline">View All Orders</Link>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 border-l pl-6 border-gray-200">
              <img src={user?.image || "https://images.unsplash.com/photo-1595856728032-47d06634b070?w=100&auto=format&fit=crop&fm=webp"} alt="Profile" className="w-10 h-10 rounded-full object-cover"  loading="lazy" decoding="async" onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x400/eeeeee/999999?text=No+Image"; }} />
              <div className="hidden sm:block">
                <div className="font-bold text-forest text-sm">{user?.name || 'Farmer'}</div>
                <div className="text-xs text-earth">{user?.farmName || 'Your Farm'}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 p-4 md:p-8 pb-28 md:pb-8">
          <Routes>
            <Route path="/" element={<FarmerDashboardOverview />} />
            <Route path="dashboard" element={<FarmerDashboardOverview />} />
            <Route path="products" element={<FarmerProducts />} />
            <Route path="orders" element={<FarmerOrders />} />
            <Route path="support" element={<FarmerSupport />} />
            <Route path="profile" element={<FarmerProfile />} />
            <Route path="*" element={<div className="text-center py-20 text-earth text-lg">Under Construction for Demo</div>} />
          </Routes>
        </main>
        
        {/* Floating Delivery Acknowledgement Toast */}
        <AnimatePresence>
          {deliveryToast && (
            <motion.div 
              initial={{ opacity: 0, x: 50, y: 50 }} 
              animate={{ opacity: 1, x: 0, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed bottom-24 md:bottom-8 right-8 z-[100] bg-white rounded-2xl shadow-2xl border border-green-150 p-5 max-w-sm flex gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-2xl flex-shrink-0 text-green-600 animate-bounce">
                🎉
              </div>
              <div>
                <div className="font-bold text-gray-800 text-sm">Order is Delivered</div>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed font-semibold">
                  Order <span className="font-bold text-primary">#{deliveryToast.id}</span> was successfully delivered to the customer.
                </p>
                <button 
                  onClick={() => setDeliveryToast(null)} 
                  className="text-[10px] text-green-700 font-bold uppercase tracking-wider mt-3 block hover:underline"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-forest text-white border-t border-white/10 py-2 px-2 flex justify-around items-center z-40 shadow-[0_-2px_10px_rgba(0,0,0,0.15)]">
          {navLinks.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path === '/farmer/dashboard' && location.pathname === '/farmer');
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition-all ${isActive ? 'text-primary' : 'text-cream/70 hover:text-white'}`}
              >
                <span className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-primary/20 text-primary' : 'text-cream/70'}`}>
                  {item.icon}
                </span>
                <span className="mt-0.5">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
