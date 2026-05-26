import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOrders } from '../../context/OrdersContext';
import { useAuth } from '../../context/AuthContext';
import { 
  FiAlertCircle, FiCheck, FiX, 
  FiDollarSign, FiClock, FiActivity, FiUser,
  FiCamera, FiUploadCloud, FiBell, FiMap, FiNavigation
} from 'react-icons/fi';
import { GiScooter } from 'react-icons/gi';
import { Link, useNavigate } from 'react-router-dom';

export default function DeliveryDashboard() {
  const { 
    orders, 
    riders, 
    activeRequest, 
    acceptRequest, 
    rejectRequest, 
    advanceOrderStatus, 
    updateRiderStatus,
    payouts,
    updateRiderProfile,
    dbConnected
  } = useOrders();

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Enforce logged-in rider session from AuthContext
  const loggedRiderId = user?.role === 'delivery' ? user.id : null;
  const currentRider = useMemo(() => {
    if (!loggedRiderId) return null;
    return riders.find(r => r.id === loggedRiderId) || user;
  }, [riders, loggedRiderId, user]);

  // Clean redirection for unauthenticated/non-delivery guest requests
  useEffect(() => {
    if (!user || user.role !== 'delivery') {
      navigate('/delivery/login');
    }
  }, [user, navigate]);

  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'earnings' | 'map'
  const [rejectingRequest, setRejectingRequest] = useState(null); // request being rejected
  const [rejectReason, setRejectReason] = useState('Busy');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const [showNotifications, setShowNotifications] = useState(false);
  const [readNotifications, setReadNotifications] = useState([]);

  // Compute rider notifications
  const notifications = useMemo(() => {
    const notifs = [];

    // Payout Notifications
    const riderPayouts = (payouts?.riders || []).filter(p => String(p.riderId) === String(loggedRiderId));
    riderPayouts.forEach(p => {
      notifs.push({
        id: `payout-${p.id}-${p.status}`,
        title: p.status === 'Paid' ? '💰 Weekly Payout Disbursed!' : '⏳ Payout Pending Approval',
        message: p.status === 'Paid' 
          ? `Your weekly payout of ₹${Number(p.netEarnings || 0).toFixed(2)} has been successfully credited.`
          : `Your weekly payout of ₹${Number(p.netEarnings || 0).toFixed(2)} is pending approval for week ending ${p.weekEndDate}.`,
        time: p.createdAt || new Date().toISOString(),
        type: 'payout'
      });
    });

    // Delivered Order notifications
    const deliveredOrders = orders.filter(o => String(o.deliveryInfo?.riderId) === String(loggedRiderId) && o.status === 'Delivered');
    deliveredOrders.forEach(o => {
      notifs.push({
        id: `delivery-done-${o.id}`,
        title: '🎉 Delivery Completed!',
        message: `Order #${o.id} successfully delivered. Base pay credited to your pending queue.`,
        time: o.deliveredAt || o.createdAt || new Date().toISOString(),
        type: 'delivery'
      });
    });

    // Acceptance Rate Warning
    if (currentRider?.acceptanceRate < 90) {
      notifs.push({
        id: `acceptance-warning-${currentRider.id}-${currentRider.acceptanceRate}`,
        title: '⚠️ Low Acceptance Rate',
        message: `Your acceptance rate has dropped to ${currentRider.acceptanceRate}%. Accept incoming dispatch requests to avoid penalties.`,
        time: new Date().toISOString(),
        type: 'warning'
      });
    }

    return notifs.sort((a, b) => new Date(b.time) - new Date(a.time));
  }, [payouts, orders, loggedRiderId, currentRider]);

  const unreadCount = notifications.filter(n => !readNotifications.includes(n.id)).length;

  // Profile settings form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    vehicleName: '',
    vehiclePlate: '',
    image: ''
  });
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  // Sync rider profile to settings inputs on load or context change
  useEffect(() => {
    if (currentRider) {
      let vehicleName = currentRider.vehicle || '';
      let vehiclePlate = '';
      const match = vehicleName.match(/(.*)\((.*)\)/);
      if (match) {
        vehicleName = match[1].trim();
        vehiclePlate = match[2].trim();
      }
       
      setProfileForm({
        name: currentRider.name || '',
        phone: currentRider.phone || '',
        vehicleName,
        vehiclePlate,
        image: currentRider.image || ''
      });
    }
  }, [currentRider]);

  const handleProfileChange = (e) => {
    setProfileForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setProfileSuccess(false);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileForm(prev => ({ ...prev, image: reader.result }));
        setProfileSuccess(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setTimeout(() => {
      const updatedRider = {
        name: profileForm.name,
        phone: profileForm.phone,
        vehicle: `${profileForm.vehicleName} (${profileForm.vehiclePlate})`,
        image: profileForm.image
      };
      updateRiderProfile(loggedRiderId, updatedRider);
      setProfileLoading(false);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 4000);
    }, 800);
  };

  // Filter orders assigned to this rider
  const riderOrders = orders.filter(o => String(o.deliveryInfo?.riderId) === String(loggedRiderId));
  const activeOrders = riderOrders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled');

  // Filter payouts for this rider
  const riderPayouts = (payouts?.riders || []).filter(p => String(p.riderId) === String(loggedRiderId));

  // Check if there is an active dispatch request alert for this rider
  const incomingRequest = activeRequest && String(activeRequest.riderId) === String(loggedRiderId) ? activeRequest : null;

  // Find incoming order details
  const incomingOrder = incomingRequest ? orders.find(o => o.id === incomingRequest.orderId) : null;

  const handleStatusChange = (newStatus) => {
    updateRiderStatus(loggedRiderId, newStatus);
  };

  const handleAccept = (orderId) => {
    acceptRequest(orderId, loggedRiderId);
  };

  const handleRejectClick = (orderId) => {
    setRejectingRequest(orderId);
    setShowRejectModal(true);
  };

  const handleRejectSubmit = () => {
    if (rejectingRequest) {
      rejectRequest(rejectingRequest, loggedRiderId, rejectReason);
      setShowRejectModal(false);
      setRejectingRequest(null);
    }
  };

  if (!currentRider) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4 text-white">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-gray-400 font-bold text-sm animate-pulse">Initializing Rider Session...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans pb-16">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-40 px-6 py-4 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg shadow-green-500/20">
            <GiScooter />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              Uzhavar Rider Console
              
              <span className="flex items-center gap-1.5 ml-2">
                {dbConnected === null && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gray-800 text-gray-400 border border-gray-700 animate-pulse">
                    Verifying...
                  </span>
                )}
                {dbConnected === true && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-green-950 text-green-400 border border-green-900">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping" />
                    Online
                  </span>
                )}
                {dbConnected === false && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-950 text-amber-400 border border-amber-900" title="Offline Mode: querying locally cached data.">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    Offline Fallback
                  </span>
                )}
              </span>
            </h1>
            <p className="text-xs text-gray-400">Rider Partner Portal</p>
          </div>
        </div>

        {/* Rider Status and Navigation */}
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-800 rounded-xl p-1 border border-gray-700">
            {['Online', 'Busy', 'Offline'].map(status => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                  currentRider.status === status 
                    ? status === 'Online' ? 'bg-green-600 text-white' :
                      status === 'Busy' ? 'bg-yellow-600 text-black' : 'bg-gray-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
          {/* Bell Notifications */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)} 
              className="relative text-gray-400 hover:text-green-400 p-2 flex items-center justify-center bg-gray-800 rounded-xl border border-gray-700 hover:border-green-500/50 transition-all cursor-pointer active:scale-95"
            >
              <FiBell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 w-4.5 h-4.5 rounded-full border-2 border-gray-900 flex items-center justify-center text-[8px] text-white font-black animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 overflow-hidden z-50 text-left">
                <div className="p-4 border-b border-gray-800 font-bold text-gray-200 flex justify-between items-center text-sm">
                  <span>Rider Notifications</span>
                  <button 
                    onClick={() => setReadNotifications(notifications.map(n => n.id))} 
                    className="text-[10px] text-green-400 font-bold hover:underline cursor-pointer"
                  >
                    Mark all read
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-gray-500 text-xs">No notifications yet</div>
                  ) : (
                    notifications.map(n => (
                      <div 
                        key={n.id} 
                        onClick={() => !readNotifications.includes(n.id) && setReadNotifications([...readNotifications, n.id])} 
                        className={`p-4 border-b border-gray-800 text-xs cursor-pointer hover:bg-gray-800/40 transition-colors ${readNotifications.includes(n.id) ? 'bg-transparent' : 'bg-green-500/5'}`}
                      >
                        <div className="font-bold text-white flex justify-between items-center gap-1">
                          <span>{n.title}</span>
                          {!readNotifications.includes(n.id) && <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0"></span>}
                        </div>
                        <div className="text-gray-400 mt-1 leading-relaxed">{n.message}</div>
                        <div className="text-[10px] text-gray-500 mt-2">
                          {new Date(n.time).toLocaleString() !== 'Invalid Date' ? new Date(n.time).toLocaleDateString() : n.time}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="h-4 w-px bg-gray-700"></div>
          <Link to="/" className="text-xs font-bold text-green-400 hover:underline">
            Back to Shop
          </Link>
          <div className="h-4 w-px bg-gray-700"></div>
          <button 
            onClick={() => { logout(); navigate('/'); }}
            className="text-xs font-bold text-red-400 hover:underline cursor-pointer bg-transparent border-none outline-none"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 mt-8 space-y-6">
        {dbConnected === false && (
          <div className="bg-amber-950/30 border border-amber-900/60 text-amber-300 p-5 rounded-3xl text-xs space-y-1.5 shadow-lg shadow-amber-950/20">
            <div className="font-black text-sm flex items-center gap-1.5">
              <span>⚠️ Cloud Database Sync Paused</span>
            </div>
            <p className="text-gray-400">
              Rider Portal is currently running in <strong>Offline Fallback Mode</strong>. You can still accept, reject, and advance order statuses, but changes are saved locally and will auto-sync with Supabase once the database connection is restored.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Stats sidebar */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Rider Profile Card */}
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-4">
              {currentRider.image ? (
                <img 
                  src={currentRider.image} 
                  alt={currentRider.name} 
                  className="w-14 h-14 rounded-2xl object-cover shadow-md border border-gray-800"
                />
              ) : (
                <div className="w-14 h-14 bg-gradient-to-tr from-green-600 to-emerald-400 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md">
                  {(currentRider?.name || 'Rider').split(' ').map(n=>n[0]).join('')}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-lg text-white truncate">{currentRider.name}</h3>
                <span className="text-xs text-gray-400 block truncate">{currentRider.vehicle}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-gray-800 pt-4 text-center">
              <div>
                <div className="text-xs text-gray-500 font-bold uppercase">Weekly Earnings</div>
                <div className="text-xl font-black text-green-400">₹{Number(currentRider.weeklyEarnings || 0).toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 font-bold uppercase">Deliveries</div>
                <div className="text-xl font-black text-white">{currentRider.weeklyDeliveries}</div>
              </div>
            </div>

            <div className="border-t border-gray-800 pt-4 space-y-2.5 text-xs text-gray-400">
              <div className="flex justify-between">
                <span>Rider ID</span><span className="text-white font-mono">#{currentRider.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Acceptance Rate</span><span className="text-green-400 font-bold">{currentRider.acceptanceRate}%</span>
              </div>
              <div className="flex justify-between">
                <span>Total Acceptances</span><span className="text-white">{currentRider.acceptances}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Rejections</span><span className="text-red-400">{currentRider.rejections}</span>
              </div>
              <div className="flex justify-between">
                <span>Mobile</span><span className="text-white">{currentRider.phone}</span>
              </div>
            </div>
          </div>

          {/* Quick Info Box */}
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 text-center space-y-3">
            <FiActivity size={32} className="mx-auto text-green-400 animate-pulse" />
            <h4 className="font-bold text-white text-sm">Peak Demand Alert!</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Coimbatore market is experiencing high demand. Complete deliveries quickly to qualify for a ₹15 bonus!
            </p>
          </div>
        </div>

        {/* Middle/Right Workspace */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-800 gap-6 overflow-x-auto">
            {[
              { id: 'orders', name: `Active Deliveries (${activeOrders.length})`, icon: <GiScooter /> },
              { id: 'earnings', name: 'Earnings & Weekly Payouts', icon: <FiDollarSign /> },
              { id: 'profile', name: 'Profile Settings', icon: <FiUser /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 px-2 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
                  activeTab === tab.id 
                    ? 'border-green-500 text-green-400' 
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                {tab.icon} {tab.name}
              </button>
            ))}
          </div>

          {/* Tab Contents */}
          <AnimatePresence mode="wait">
            {activeTab === 'orders' && (
              <motion.div 
                key="orders"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {activeOrders.length === 0 ? (
                  <div className="bg-gray-900 border border-gray-800 p-12 rounded-3xl text-center space-y-4">
                    <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto text-3xl text-gray-500">
                      🚚
                    </div>
                    <h3 className="text-lg font-bold text-white">No active deliveries</h3>
                    <p className="text-sm text-gray-400 max-w-sm mx-auto">
                      Go Online to receive incoming orders. Nearby farmers will dispatch pickup alerts to you!
                    </p>
                  </div>
                ) : (
                  activeOrders.map(order => (
                    <div 
                      key={order.id}
                      className="bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-6 hover:border-gray-700 transition-colors"
                    >
                      {/* Order Title Header */}
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-green-400 font-mono">{order.id}</span>
                            {order.smartCombinedApplied && (
                              <span className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full font-bold">
                                Combined Pickup
                              </span>
                            )}
                          </div>
                          <h4 className="text-lg font-bold mt-1 text-white">
                            Deliver to: {order.customerName}
                          </h4>
                          <p className="text-xs text-gray-400 mt-0.5">
                            📍 {order.deliveryDetails?.address?.line1 ? `${order.deliveryDetails.address.line1}, ${order.deliveryDetails.address.line2 || ''}` : (order.address || 'Address Not Provided')}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-gray-400">Total Distance</span>
                          <div className="text-lg font-black text-white">{order.distance || 4.2} KM</div>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="bg-gray-950 p-4 rounded-2xl border border-gray-800 space-y-2.5">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Pickup Items</span>
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-xs font-medium">
                            <span className="text-gray-300">{item.name} <span className="text-gray-500">×{item.qty}</span></span>
                            <span className="text-white">From: {item.farmerName || order.farmer || 'Local Farmer'}</span>
                          </div>
                        ))}
                      </div>

                      {/* Cash Collection Alert */}
                      {(order.deliveryDetails?.paymentMethod === 'Cash on Delivery' || order.paymentMethod === 'Cash on Delivery') ? (
                        <div className="bg-orange-500/10 border border-orange-500/30 p-3.5 rounded-2xl flex items-center justify-between text-xs text-orange-400 font-bold">
                          <span className="flex items-center gap-1.5">💵 Cash on Delivery (COD)</span>
                          <span className="text-sm font-black text-white">Collect: ₹{order.total.toFixed(2)}</span>
                        </div>
                      ) : (
                        <div className="bg-green-500/10 border border-green-500/30 p-3.5 rounded-2xl flex items-center justify-between text-xs text-green-400 font-bold">
                          <span className="flex items-center gap-1.5">💳 Paid Online (UPI/Card)</span>
                          <span className="text-sm font-black text-white">Collect: ₹0.00</span>
                        </div>
                      )}

                      {/* Optimized Pickup Route Steps */}
                      <div className="space-y-2">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Pickup Route Steps</span>
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          {order.pickupRoute ? (
                            order.pickupRoute.map((step, idx) => (
                              <React.Fragment key={idx}>
                                <div className="bg-gray-800 text-gray-200 border border-gray-700 px-3 py-1 rounded-xl">
                                  {step.includes('Customer') ? '🏠 ' + step : '🌾 ' + step}
                                </div>
                                {idx < order.pickupRoute.length - 1 && <span className="text-gray-600">➔</span>}
                              </React.Fragment>
                            ))
                          ) : (
                            <>
                              <div className="bg-gray-800 text-gray-200 border border-gray-700 px-3 py-1 rounded-xl">
                                🌾 {order.farmer}
                              </div>
                              <span className="text-gray-600">➔</span>
                              <div className="bg-gray-800 text-gray-200 border border-gray-700 px-3 py-1 rounded-xl">
                                🏠 Customer Home
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Status Tracker and Progression Console */}
                      <div className="border-t border-gray-800 pt-6 space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-400">Current Status: <span className="text-green-400 uppercase font-black">{order.status}</span></span>
                          <span className="text-xs text-orange-400 font-bold flex items-center gap-1"><FiClock /> ETA ~{order.eta || 25} Mins</span>
                        </div>

                        {/* Status Progression buttons */}
                        <div className="grid grid-cols-2 md:grid-cols-2 gap-2">
                          {[
                            { name: 'Packed', status: 'Packed' },
                            { name: 'Deliver', status: 'Delivered' }
                          ].map(step => {
                            const currentStatus = (order.status || '').toLowerCase();
                            const stepStatus = step.status.toLowerCase();
                            const isCurrent = currentStatus === stepStatus;
                            return (
                              <button
                                key={step.status}
                                disabled={
                                  (step.status === 'Packed' && currentStatus !== 'pending') ||
                                  (step.status === 'Delivered' && currentStatus !== 'packed')
                                }
                                onClick={() => advanceOrderStatus(order.id, step.status)}
                                className={`py-2 px-1 rounded-xl text-[10px] font-black tracking-tight text-center transition-all ${
                                  isCurrent 
                                    ? 'bg-green-600 text-white shadow shadow-green-500/20 ring-2 ring-green-400/20'
                                    : 'bg-gray-800 text-gray-400 disabled:opacity-30 disabled:pointer-events-none hover:bg-gray-700 hover:text-white'
                                }`}
                              >
                                {step.name}
                              </button>
                            );
                          })}
                        </div>

                        {/* Manual Logistics Override */}
                        <div className="border-t border-gray-800 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">
                            Manual Logistics Override
                          </div>
                          <select 
                            value={order.status}
                            onChange={async (e) => {
                              await advanceOrderStatus(order.id, e.target.value);
                            }}
                            className="border border-gray-700 rounded-xl px-3 py-1.5 bg-gray-900 text-[10px] font-black focus:outline-none focus:ring-1 focus:ring-primary text-gray-300 w-full sm:w-auto cursor-pointer"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Packed">Packed</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </div>

                        {/* Open Tracking Map Button */}
                        <div className="pt-2">
                          <button
                            onClick={() => navigate(`/delivery/tracking/${order.id}`)}
                            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow-sm transition-all"
                          >
                            <FiMap /> Open Tracking Map
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            )}

            {activeTab === 'earnings' && (
              <motion.div 
                key="earnings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Earnings card banner */}
                <div className="bg-gradient-to-r from-green-900 to-emerald-950 border border-green-800/40 rounded-3xl p-6 flex justify-between items-center">
                  <div>
                    <span className="text-xs text-green-300 font-bold uppercase tracking-wider">Accumulated Earnings</span>
                    <h3 className="text-3xl font-black text-white mt-1">₹{Number(currentRider.weeklyEarnings || 0).toFixed(2)}</h3>
                    <p className="text-xs text-green-400 font-semibold mt-1">
                      Includes ₹{currentRider.bonus} peak-hour bonuses!
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-green-300 font-bold uppercase">Rate per Trip</span>
                    <div className="text-2xl font-black text-white">₹50 + Bonus</div>
                  </div>
                </div>

                {/* Payout History List */}
                <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-4">
                  <h4 className="font-bold text-white text-lg">Weekly Payouts Log</h4>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-gray-800 text-gray-500 font-bold">
                          <th className="pb-3">Payout ID</th>
                          <th className="pb-3">Week Ending</th>
                          <th className="pb-3">Trips Count</th>
                          <th className="pb-3">Base Earnings</th>
                          <th className="pb-3">Bonus</th>
                          <th className="pb-3">Net Paid</th>
                          <th className="pb-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {riderPayouts.map(payout => (
                          <tr key={payout.id} className="border-b border-gray-800/60 last:border-0 hover:bg-gray-800/20 transition-colors">
                            <td className="py-4 font-mono font-bold text-white">{payout.id}</td>
                            <td className="py-4 text-gray-300">{payout.weekEndDate}</td>
                            <td className="py-4 text-white font-bold">{payout.deliveryCount} deliveries</td>
                            <td className="py-4 text-gray-300">₹{Number(payout.basePay || 0).toFixed(2)}</td>
                            <td className="py-4 text-green-400">+₹{Number(payout.bonusPay || 0).toFixed(2)}</td>
                            <td className="py-4 font-black text-white text-sm">₹{Number(payout.netEarnings || 0).toFixed(2)}</td>
                            <td className="py-4 text-right">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-tight ${
                                payout.status === 'Paid'
                                  ? 'bg-green-500/20 text-green-400 border border-green-500/25'
                                  : 'bg-orange-500/20 text-orange-400 border border-orange-500/25 animate-pulse'
                              }`}>
                                {payout.status === 'Paid' ? 'PAID' : 'PENDING APPROVAL'}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {riderPayouts.length === 0 && (
                          <tr>
                            <td colSpan="7" className="py-8 text-center text-gray-500 font-bold">No payouts recorded yet.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'profile' && (
              <motion.div 
                key="profile"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-6"
              >
                <div>
                  <h4 className="font-bold text-white text-lg">Profile & Vehicle Settings</h4>
                  <p className="text-xs text-gray-400 mt-1">Keep your contact details and active vehicle description updated so farmers can coordinate pickups smoothly.</p>
                </div>

                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  {/* Interactive Profile Picture Uploader & Preset Selection */}
                  <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-gray-800">
                    <div className="relative group">
                      {profileForm.image ? (
                        <img 
                          src={profileForm.image} 
                          alt="Avatar Preview" 
                          className="w-20 h-20 rounded-2xl object-cover ring-4 ring-green-500/20 border-2 border-green-500 shadow-md" 
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-green-600 to-emerald-400 flex items-center justify-center text-white font-black text-2xl shadow-md border-2 border-green-500/30">
                          {(profileForm.name || 'R').split(' ').map(n=>n[0]).join('')}
                        </div>
                      )}
                      
                      {/* Hidden Native File Input */}
                      <input 
                        type="file" 
                        id="rider-avatar-upload" 
                        accept="image/*" 
                        onChange={handleImageUpload}
                        className="hidden" 
                      />
                      
                      {/* Trigger Button Overlay */}
                      <label 
                        htmlFor="rider-avatar-upload"
                        className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all cursor-pointer text-green-400 text-[10px] font-black uppercase"
                      >
                        <FiCamera size={16} className="mb-0.5" /> Change
                      </label>
                    </div>

                    <div className="flex-1 space-y-3 w-full text-center sm:text-left">
                      <span className="text-xs font-bold text-gray-300 block">Select Avatar Preset or Upload File</span>
                      <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2.5">
                        {/* Curated Presets */}
                        {[
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
                          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
                          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
                        ].map((imgUrl, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setProfileForm(prev => ({ ...prev, image: imgUrl }))}
                            className={`w-10 h-10 rounded-xl overflow-hidden border-2 transition-all hover:scale-105 ${
                              profileForm.image === imgUrl ? 'border-green-500 ring-2 ring-green-500/20 shadow-md' : 'border-gray-800 opacity-60 hover:opacity-100'
                            }`}
                          >
                            <img src={imgUrl} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                          </button>
                        ))}

                        <div className="h-6 w-px bg-gray-800 mx-1 hidden sm:block"></div>

                        {/* Upload File button */}
                        <label 
                          htmlFor="rider-avatar-upload"
                          className="px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-gray-700 hover:border-gray-600 active:scale-[0.98]"
                        >
                          <FiUploadCloud size={14} className="text-green-400 animate-bounce" /> Upload Original Photo
                        </label>
                      </div>
                      
                      <div className="text-[10px] text-gray-500">
                        Supports JPEG, PNG, or GIF. Max 5MB. Files are optimized and saved locally.
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Rider Name</label>
                      <input 
                        type="text" 
                        name="name" 
                        value={profileForm.name} 
                        onChange={handleProfileChange}
                        className="w-full px-4 py-3 rounded-2xl bg-gray-950 border border-gray-800 outline-none focus:ring-2 focus:ring-green-500 text-sm text-white"
                        required 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Mobile Number</label>
                      <input 
                        type="tel" 
                        name="phone" 
                        value={profileForm.phone} 
                        onChange={handleProfileChange}
                        className="w-full px-4 py-3 rounded-2xl bg-gray-950 border border-gray-800 outline-none focus:ring-2 focus:ring-green-500 text-sm text-white"
                        required 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Vehicle Model & Make</label>
                      <input 
                        type="text" 
                        name="vehicleName" 
                        placeholder="e.g. Honda Activa"
                        value={profileForm.vehicleName} 
                        onChange={handleProfileChange}
                        className="w-full px-4 py-3 rounded-2xl bg-gray-950 border border-gray-800 outline-none focus:ring-2 focus:ring-green-500 text-sm text-white"
                        required 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">License Plate Number</label>
                      <input 
                        type="text" 
                        name="vehiclePlate" 
                        placeholder="e.g. TN-37-X-1234"
                        value={profileForm.vehiclePlate} 
                        onChange={handleProfileChange}
                        className="w-full px-4 py-3 rounded-2xl bg-gray-950 border border-gray-800 outline-none focus:ring-2 focus:ring-green-500 text-sm text-white"
                        required 
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-800 flex justify-between items-center">
                    {profileSuccess && (
                      <span className="text-xs text-green-400 font-bold flex items-center gap-1">
                        <FiCheck size={14} className="text-green-400" /> Profile details saved successfully!
                      </span>
                    )}
                    {!profileSuccess && <span />}
                    <button 
                      type="submit"
                      disabled={profileLoading}
                      className="px-6 py-3 rounded-2xl bg-green-600 hover:bg-green-500 text-white font-bold text-xs transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {profileLoading ? 'Saving...' : 'Save Profile Changes'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>

      {/* ═══ DISPATCH REQUEST MODAL ALERT (Requirement 4) ═══ */}
      <AnimatePresence>
        {incomingRequest && incomingOrder && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-gray-900 border-2 border-orange-500/50 max-w-lg w-full rounded-3xl p-8 space-y-6 shadow-2xl relative overflow-hidden"
            >
              {/* Background ambient light */}
              <div className="absolute top-[-20%] left-[-20%] w-60 h-60 bg-orange-600/10 rounded-full blur-3xl" />
              <div className="absolute bottom-[-20%] right-[-20%] w-60 h-60 bg-green-600/10 rounded-full blur-3xl" />

              {/* Progress countdown bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gray-800">
                <motion.div 
                  initial={{ width: '100%' }}
                  animate={{ width: `${(incomingRequest.timeLeft / 30) * 100}%` }}
                  transition={{ duration: 1, ease: 'linear' }}
                  className="h-full bg-orange-500"
                />
              </div>

              {/* Alert Title */}
              <div className="flex items-center gap-3 text-orange-400">
                <FiAlertCircle className="text-4xl animate-bounce" />
                <div>
                  <h3 className="text-2xl font-black tracking-tight text-white">New Order Alert!</h3>
                  <p className="text-xs text-gray-400">Respond within {incomingRequest.timeLeft} seconds</p>
                </div>
              </div>

              {/* Trip details */}
              <div className="bg-gray-950 rounded-2xl border border-gray-800 p-5 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-gray-800">
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Pickup From</span>
                    <div className="font-bold text-white text-base">🌾 {incomingOrder.farmer}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-500 font-bold uppercase">Distance</span>
                    <div className="font-bold text-white text-base">{incomingOrder.distance || 3.5} KM</div>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Deliver To</span>
                  <div className="font-bold text-white text-sm">🏠 {incomingOrder.customerName}</div>
                  <p className="text-xs text-gray-400 mt-1">
                    {incomingOrder.deliveryDetails?.address?.line1 ? `${incomingOrder.deliveryDetails.address.line1}, ${incomingOrder.deliveryDetails.address.line2 || ''}` : (incomingOrder.address || 'Address Not Provided')}
                  </p>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-gray-800 text-xs font-bold text-green-400">
                  <span>Your Delivery Fee Earning:</span>
                  <span className="text-lg font-black">₹50 + Bonus</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-800 text-xs font-bold text-orange-400">
                  <span>Payment Method:</span>
                  <span>{incomingOrder.deliveryDetails?.paymentMethod || incomingOrder.paymentMethod || 'Cash on Delivery'}</span>
                </div>
                {((incomingOrder.deliveryDetails?.paymentMethod || incomingOrder.paymentMethod) === 'Cash on Delivery') && (
                  <div className="bg-orange-500/20 border border-orange-500/40 p-3.5 rounded-xl text-center text-xs font-black text-orange-300">
                    ⚠️ COLLECT CASH FROM CUSTOMER: ₹{incomingOrder.total.toFixed(2)}
                  </div>
                )}
              </div>

              {/* Reassignment / Route Preview Info */}
              {incomingOrder.smartCombinedApplied && (
                <div className="bg-green-500/10 border border-green-700/20 rounded-xl p-3 text-xs text-green-400 font-bold">
                  🚚 Smart Grouped Pickups! Multiple pickups on your route. Extra trip bonus included!
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => handleRejectClick(incomingOrder.id)}
                  className="flex-1 py-4 border border-red-500/30 bg-red-500/10 text-red-400 font-black rounded-2xl hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <FiX /> Reject Request
                </button>
                <button
                  onClick={() => handleAccept(incomingOrder.id)}
                  className="flex-[2] py-4 bg-green-600 hover:bg-green-500 text-white font-black text-lg rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-600/20"
                >
                  <FiCheck /> Accept Request
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ REJECTION REASON MODAL (Requirement 4) ═══ */}
      <AnimatePresence>
        {showRejectModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-gray-900 border border-gray-800 rounded-3xl p-6 max-w-sm w-full space-y-4"
            >
              <h4 className="text-lg font-bold text-white">Select Rejection Reason</h4>
              <p className="text-xs text-gray-400">Providing feedback helps farmers select the right rider next time.</p>
              
              <div className="space-y-2">
                {[
                  'Rider is busy with other delivery',
                  'Farm location is too far away',
                  'Vehicle maintenance issue',
                  'Peak traffic / road blockages',
                  'Heavy weather / rain alert'
                ].map(reason => (
                  <label 
                    key={reason}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      rejectReason === reason 
                        ? 'border-red-500 bg-red-500/10 text-white' 
                        : 'border-gray-800 hover:border-gray-700 bg-gray-950 text-gray-400'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="rejectReason" 
                      value={reason} 
                      checked={rejectReason === reason} 
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="accent-red-500"
                    />
                    <span className="text-xs font-semibold">{reason}</span>
                  </label>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 py-2.5 border border-gray-800 rounded-xl text-xs font-bold text-gray-400 hover:border-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectSubmit}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-black rounded-xl"
                >
                  Confirm Reject
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
