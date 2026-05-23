import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSearch, 
  FiFilter, 
  FiChevronDown, 
  FiChevronUp, 
  FiTruck, 
  FiClock, 
  FiCheckCircle, 
  FiXCircle, 
  FiAlertCircle, 
  FiUser, 
  FiMapPin, 
  FiPhone, 
  FiCheck, 
  FiX,
  FiFileText,
  FiTrendingUp,
  FiArrowRight
} from 'react-icons/fi';
import { useOrders, getQtyNumber } from '../../context/OrdersContext';
import { printInvoice } from '../../utils/invoice';
import { printPackingSlip } from '../../utils/packingSlip';

export default function AdminOrders() {
  const { 
    orders, 
    updateOrder,
    riders,
    activeRequest,
    manualAssignRider,
    acceptRequest,
    rejectRequest,
    advanceOrderStatus,
    dbConnected
  } = useOrders();

  const [expandedRow, setExpandedRow] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Helper to determine active dispatch status
  const getOrderDispatchState = (order) => {
    if (order.status === 'Cancelled') return 'Cancelled';
    if (order.status === 'Delivered') return 'Delivered';
    
    const isTransit = ['Confirmed', 'Packed', 'Picked Up', 'On The Way', 'Near Customer'].includes(order.status);
    if (isTransit) return 'In Transit';
    
    // Order is 'Pending'
    const riderId = order.deliveryInfo?.riderId;
    if (riderId) {
      // Check if it's currently in active offering
      const isRejected = order.rejectionHistory?.some(h => String(h.riderId) === String(riderId));
      if (!isRejected) return 'Offered';
    }
    
    if (order.reassignmentFailed) return 'Dispatch Failed';
    return 'Pending Dispatch';
  };

  // Filters
  const filteredOrders = (orders || []).filter(order => {
    const matchesSearch = 
      String(order.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customerName || order.customer || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.address || '').toLowerCase().includes(searchTerm.toLowerCase());

    const dispatchState = getOrderDispatchState(order);
    
    if (filterStatus === 'All') return matchesSearch;
    if (filterStatus === 'Pending') {
      return matchesSearch && dispatchState !== 'Delivered' && dispatchState !== 'Cancelled';
    }
    if (filterStatus === 'Delivered') {
      return matchesSearch && dispatchState === 'Delivered';
    }
    if (filterStatus === 'Cancelled') {
      return matchesSearch && dispatchState === 'Cancelled';
    }
    return matchesSearch;
  });

  // GMV & Commissions Calculations
  const getOrderProduceCost = (order) => {
    const items = Array.isArray(order.items) ? order.items : [];
    return items.reduce((acc, item) => acc + (parseFloat(item.price) || 0) * getQtyNumber(item), 0);
  };

  const getStatusBadgeClass = (state) => {
    switch (state) {
      case 'Pending Dispatch': return 'bg-orange-100 text-orange-700 border border-orange-200';
      case 'Dispatch Failed': return 'bg-rose-100 text-rose-700 border border-rose-200 animate-pulse';
      case 'Offered': return 'bg-amber-100 text-amber-700 border border-amber-200 animate-pulse';
      case 'In Transit': return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'Delivered': return 'bg-green-100 text-green-700 border border-green-200';
      case 'Cancelled': return 'bg-gray-100 text-gray-600 border border-gray-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Stats Card Counts
  const pendingDispatchCount = orders.filter(o => getOrderDispatchState(o) === 'Pending Dispatch' || getOrderDispatchState(o) === 'Dispatch Failed').length;
  const offeredCount = orders.filter(o => getOrderDispatchState(o) === 'Offered').length;
  const transitCount = orders.filter(o => getOrderDispatchState(o) === 'In Transit').length;
  const onlineRidersCount = riders.filter(r => r.status === 'Online').length;

  return (
    <div className="space-y-6 animate-fade-in relative pb-12">
      {/* Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-24 right-8 z-[100] ${
              toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'
            } text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 font-bold`}
          >
            {toast.type === 'error' ? <FiXCircle size={18} /> : <FiCheckCircle size={18} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-800 tracking-tight">Rider Dispatch & Logistics</h2>
          <p className="text-sm text-gray-500 font-medium">Coordinate orders dispatching, live match delivery riders, and advance transit states.</p>
        </div>

        {/* Supabase Status Indicator */}
        <div className="flex items-center gap-2 self-start lg:self-center">
          {dbConnected === null && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-gray-100 text-gray-500 border border-gray-200">
              <span className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" />
              Verifying Supabase...
            </span>
          )}
          {dbConnected === true && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
              Supabase Live Connection
            </span>
          )}
          {dbConnected === false && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-sm" title="Synchronizing locally through cache fallbacks.">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Local Cache Cache Mode
            </span>
          )}
        </div>
      </div>

      {/* RIDER DISPATCH SIMULATOR & BROADCAST ALERT */}
      {activeRequest && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-2 border-amber-500/30 p-5 rounded-2xl shadow-md space-y-4"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-amber-500/20 text-amber-700 rounded-xl animate-pulse mt-0.5">
                <FiClock className="animate-spin text-xl" style={{ animationDuration: '6s' }} />
              </div>
              <div>
                <h3 className="font-extrabold text-amber-900 text-base flex items-center gap-2">
                  Rider Handoff Offer Active (Real-Time Broadcast)
                </h3>
                <p className="text-sm text-gray-600 font-medium">
                  Offering <strong>Order #{activeRequest.orderId}</strong> to delivery partner{' '}
                  <span className="underline font-bold text-amber-900">
                    {riders.find(r => r.id === activeRequest.riderId)?.name || `Rider #${activeRequest.riderId}`}
                  </span>.
                </p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-xs font-bold text-gray-500 uppercase">Rider Acceptance Clock:</span>
                  <span className="font-black text-amber-800 bg-amber-200 px-2 py-0.5 rounded text-xs animate-pulse">
                    {activeRequest.timeLeft}s left
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <button 
                onClick={async () => {
                  await acceptRequest(activeRequest.orderId, activeRequest.riderId);
                  showToast(`Rider accepted Order #${activeRequest.orderId}! Transit state moved to Packed.`, 'success');
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center gap-1.5"
              >
                <FiCheckCircle /> Simulate Rider Accept
              </button>
              <button 
                onClick={async () => {
                  await rejectRequest(activeRequest.orderId, activeRequest.riderId, 'Rider manually rejected in simulator');
                  showToast(`Rider rejected Order #${activeRequest.orderId}. System auto-dispatch is finding next nearest...`, 'error');
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center gap-1.5"
              >
                <FiXCircle /> Simulate Rider Reject
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Unassigned Dispatch', value: pendingDispatchCount, icon: <FiAlertCircle />, color: 'text-orange-600 bg-orange-50 border-orange-100', subtitle: 'Awaiting rider matches' },
          { label: 'Rider Offers Active', value: offeredCount, icon: <FiClock />, color: 'text-amber-600 bg-amber-50 border-amber-100', subtitle: 'Offering to riders currently' },
          { label: 'In Transit Delivery', value: transitCount, icon: <FiTruck />, color: 'text-blue-600 bg-blue-50 border-blue-100', subtitle: 'Rider moving to customers' },
          { label: 'Online Dispatch Riders', value: onlineRidersCount, icon: <FiUser />, color: 'text-green-600 bg-green-50 border-green-100', subtitle: 'Active riders on platform' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.label}</span>
              <div className={`p-2.5 rounded-xl ${stat.color} border`}>{stat.icon}</div>
            </div>
            <div>
              <div className="text-3xl font-black text-gray-800">{stat.value}</div>
              <div className="text-[11px] text-gray-500 font-medium mt-1">{stat.subtitle}</div>
            </div>
          </div>
        ))}
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-3.5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by Order ID, customer, address..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border rounded-xl bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all" 
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            'All', 
            'Pending', 
            'Delivered', 
            'Cancelled'
          ].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                filterStatus === status 
                  ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20' 
                  : 'bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* ORDERS LISTING TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-600 border-b border-gray-100 text-xs font-bold uppercase tracking-wider">
                <th className="p-4 w-28">Order ID</th>
                <th className="p-4">Customer Details</th>
                <th className="p-4">Date & Payment</th>
                <th className="p-4">Total produce</th>
                <th className="p-4">Rider Matching</th>
                <th className="p-4">Fulfillment Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const isExpanded = expandedRow === order.id;
                const dispatchState = getOrderDispatchState(order);
                const itemsCount = Array.isArray(order.items) ? order.items.length : 0;
                
                return (
                  <React.Fragment key={order.id}>
                    <tr 
                      onClick={() => setExpandedRow(isExpanded ? null : order.id)}
                      className={`border-b border-gray-50 hover:bg-gray-50/40 transition-colors cursor-pointer ${
                        isExpanded ? 'bg-primary/5' : ''
                      }`}
                    >
                      <td className="p-4 font-black text-gray-800">#{order.id}</td>
                      <td className="p-4">
                        <div className="font-extrabold text-gray-800">{order.customer || order.customerName}</div>
                        <div className="text-xs text-gray-500 font-medium truncate max-w-[200px]" title={order.address}>
                          {order.address}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-xs font-bold text-gray-600">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Today'}
                        </div>
                        <div className={`inline-block text-[10px] font-black uppercase mt-1 px-2 py-0.5 rounded-full ${
                          order.paymentStatus === 'Paid' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {order.paymentStatus === 'Paid' ? 'Paid' : 'COD'}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-black text-gray-900">₹{parseFloat(order.total || 0).toFixed(2)}</div>
                        <div className="text-xs text-gray-400 font-bold">{itemsCount} Produce items</div>
                      </td>
                      <td className="p-4">
                        {order.deliveryInfo?.riderId ? (
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <div className="text-xs">
                              <div className="font-extrabold text-gray-800">{order.deliveryInfo.person}</div>
                              <div className="text-[10px] text-gray-500 font-semibold">{order.deliveryInfo.vehicle}</div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 font-bold italic">No Rider Matched</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusBadgeClass(dispatchState)}`}>
                          {dispatchState}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {isExpanded ? <FiChevronUp size={20} className="inline text-gray-500" /> : <FiChevronDown size={20} className="inline text-gray-500" />}
                      </td>
                    </tr>

                    {/* EXPANDED PANEL VIEW */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.tr
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-gray-50/50 border-b border-gray-100"
                        >
                          <td colSpan="7" className="p-0">
                            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                              {/* Left column: Produce & Earnings */}
                              <div className="space-y-4">
                                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Produce Breakdown</h4>
                                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                    {Array.isArray(order.items) && order.items.map((item, idx) => (
                                      <div key={idx} className="flex justify-between items-center text-xs border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                                        <div>
                                          <div className="font-bold text-gray-800">{item.name}</div>
                                          <div className="text-[10px] text-gray-400">Farmer: {item.farmerName || item.farmer || 'Uzhavar Farm'}</div>
                                        </div>
                                        <div className="text-right font-extrabold">
                                          <div>₹{(item.price * getQtyNumber(item)).toFixed(2)}</div>
                                          <div className="text-[9px] text-gray-400 font-semibold">{getQtyNumber(item)} Qty x ₹{item.price}</div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Platform Splits */}
                                  <div className="border-t border-gray-100 pt-3 space-y-1.5 text-xs">
                                    <div className="flex justify-between text-gray-500 font-medium">
                                      <span>Produce Subtotal:</span>
                                      <span className="font-bold text-gray-800">₹{parseFloat(order.subtotal || order.total || 0).toFixed(2)}</span>
                                    </div>
                                    {order.discount > 0 && (
                                      <div className="flex justify-between text-green-600 font-extrabold">
                                        <span>Promotion Discount:</span>
                                        <span>-₹{parseFloat(order.discount).toFixed(2)}</span>
                                      </div>
                                    )}
                                    <div className="flex justify-between text-gray-500 font-medium">
                                      <span>Delivery Fee (to Rider):</span>
                                      <span className="font-bold text-gray-800">₹{parseFloat(order.deliveryFee || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-500 font-medium">
                                      <span>Platform Commission (5%):</span>
                                      <span className="font-bold text-gray-800">₹{parseFloat((getOrderProduceCost(order) * 0.05).toFixed(2)).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between font-black text-sm text-gray-800 border-t border-gray-100 pt-2">
                                      <span className="text-primary">Net Total Paid:</span>
                                      <span className="text-primary">₹{parseFloat(order.total || 0).toFixed(2)}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Custom PDF Actions */}
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => printInvoice(order, { name: order.customerName || 'Valued Customer', address: order.address })}
                                    className="flex-1 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                                  >
                                    <FiFileText /> Customer Invoice 🧾
                                  </button>
                                  <button 
                                    onClick={() => printPackingSlip(order)}
                                    className="flex-1 py-2 border border-slate-200 bg-white text-slate-800 rounded-xl text-xs font-bold hover:bg-slate-50 shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                                  >
                                    <FiFileText /> Packing Slip 📦
                                  </button>
                                </div>
                              </div>

                              {/* Center Column: Dispatch Control Panel */}
                              <div className="lg:col-span-2 space-y-4">
                                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4 h-full">
                                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                    <h4 className="text-sm font-black text-gray-800 uppercase tracking-wider flex items-center gap-2">
                                      <FiTruck className="text-primary" /> Dispatch Control Center
                                    </h4>
                                    <span className="text-xs font-bold text-gray-500">
                                      Order Status: <strong className="text-primary font-black uppercase text-[11px]">{order.status}</strong>
                                    </span>
                                  </div>

                                  {/* DISPATCH CONTROL CENTER STATE 1: UNASSIGNED ORDERS */}
                                  {(dispatchState === 'Pending Dispatch' || dispatchState === 'Dispatch Failed') && (
                                    <div className="space-y-4 animate-fade-in">
                                      <div className={`p-4 rounded-xl flex items-start gap-3 border ${
                                        dispatchState === 'Dispatch Failed' 
                                          ? 'bg-rose-50 border-rose-100 text-rose-800' 
                                          : 'bg-orange-50 border-orange-100 text-orange-800'
                                      }`}>
                                        <FiAlertCircle className="text-xl mt-0.5 flex-shrink-0" />
                                        <div className="text-xs space-y-1">
                                          <div className="font-extrabold">
                                            {dispatchState === 'Dispatch Failed' 
                                              ? 'Rider Matching Timeout Failed!' 
                                              : 'Order Awaiting Dispatch'
                                            }
                                          </div>
                                          <p className="text-gray-600 leading-relaxed font-medium">
                                            {dispatchState === 'Dispatch Failed' 
                                              ? 'All online riders rejected the delivery matching request or timed out. Please manually match a rider below.' 
                                              : 'Admin rider routing is required. Select a specific available rider from the directory below.'
                                            }
                                          </p>
                                        </div>
                                      </div>

                                      {/* Available Rider Directory */}
                                      <div className="space-y-2.5">
                                        <div className="text-xs font-black text-gray-400 uppercase tracking-wider">Available Riders Portal</div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-52 overflow-y-auto pr-1">
                                          {riders.map((rider) => {
                                            const isRiderOnline = rider.status === 'Online';
                                            return (
                                              <div 
                                                key={rider.id}
                                                className={`p-3 rounded-xl border flex flex-col justify-between gap-3 bg-white transition-all hover:shadow-sm ${
                                                  isRiderOnline 
                                                    ? 'border-green-200 bg-green-50/10' 
                                                    : 'border-gray-100 opacity-75'
                                                }`}
                                              >
                                                <div className="flex items-start justify-between">
                                                  <div>
                                                    <div className="font-extrabold text-gray-800 text-xs flex items-center gap-1">
                                                      {rider.name} 
                                                      <span className={`w-2 h-2 rounded-full ${
                                                        isRiderOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                                                      }`} />
                                                    </div>
                                                    <div className="text-[10px] text-gray-500 font-semibold">{rider.vehicle} • {rider.phone}</div>
                                                    <div className="text-[10px] text-gray-400 font-bold mt-1">
                                                      ★ {rider.rating.toFixed(1)} • {rider.distance.toFixed(1)} km away • {rider.activeOrders} active loads
                                                    </div>
                                                  </div>
                                                </div>
                                                
                                                <button
                                                  onClick={async () => {
                                                    await manualAssignRider(order.id, rider.id);
                                                    showToast(`Manually matched Rider ${rider.name} for Order #${order.id}. Offer broadcasted!`, 'success');
                                                  }}
                                                  className="w-full py-1.5 bg-primary text-white hover:bg-primary/95 text-[10px] font-black rounded-lg transition-colors flex items-center justify-center gap-1"
                                                >
                                                  Assign Manual Handoff <FiArrowRight size={10} />
                                                </button>
                                              </div>
                                            );
                                          })}
                                          {riders.length === 0 && (
                                            <div className="col-span-2 text-center text-xs text-gray-400 py-4 italic">No delivery riders registered on the system.</div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* DISPATCH CONTROL CENTER STATE 2: RIDER OFFERED */}
                                  {dispatchState === 'Offered' && (
                                    <div className="space-y-4 animate-fade-in">
                                      <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-800 space-y-3">
                                        <div className="flex items-center gap-2 font-extrabold text-xs">
                                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                                          Rider Dispatch Offer Pending Response
                                        </div>
                                        <p className="text-xs text-gray-600 leading-relaxed font-medium">
                                          The dispatch matching order is sent to <strong>{order.deliveryInfo?.person}</strong> ({order.deliveryInfo?.vehicle}). The rider is reviewing the route and details. You can override and simulate their action locally below.
                                        </p>
                                        
                                        <div className="flex flex-wrap gap-2 pt-1.5">
                                          <button 
                                            onClick={async () => {
                                              await acceptRequest(order.id, order.deliveryInfo.riderId);
                                              showToast(`Simulated acceptance from rider ${order.deliveryInfo.person}!`, 'success');
                                            }}
                                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black shadow-sm flex items-center gap-1 transition-colors"
                                          >
                                            Simulate Rider Accept
                                          </button>
                                          <button 
                                            onClick={async () => {
                                              await rejectRequest(order.id, order.deliveryInfo.riderId, 'Simulated reject from admin panel');
                                              showToast(`Simulated rejection from rider ${order.deliveryInfo.person}!`, 'error');
                                            }}
                                            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-black shadow-sm flex items-center gap-1 transition-colors"
                                          >
                                            Simulate Rider Reject
                                          </button>
                                        </div>
                                      </div>

                                      <div className="border border-gray-100 p-4 rounded-xl space-y-2">
                                        <div className="text-xs font-extrabold text-gray-700">Rider Contact Metrics</div>
                                        <div className="text-xs text-gray-600 font-medium space-y-1">
                                          <div><strong>Phone:</strong> {order.deliveryInfo?.phone}</div>
                                          <div><strong>Vehicle:</strong> {order.deliveryInfo?.vehicle}</div>
                                          <div><strong>Target Rider ID:</strong> {order.deliveryInfo?.riderId}</div>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* DISPATCH CONTROL CENTER STATE 3: IN TRANSIT */}
                                  {dispatchState === 'In Transit' && (
                                    <div className="space-y-5 animate-fade-in">
                                      {/* Delivery Transit Stepper */}
                                      <div className="relative pt-4 pb-2">
                                        <div className="absolute top-7 left-3 w-[calc(100%-24px)] h-0.5 bg-gray-200 -z-10" />
                                        
                                        {/* Stepper Progress Bar */}
                                        <div 
                                          className="absolute top-7 left-3 h-0.5 bg-primary -z-10 transition-all duration-500" 
                                          style={{
                                            width: order.status === 'Confirmed' ? '0%' :
                                                   order.status === 'Packed' ? '25%' :
                                                   order.status === 'Picked Up' ? '50%' :
                                                   order.status === 'On The Way' ? '75%' :
                                                   order.status === 'Near Customer' ? '100%' : '0%'
                                          }}
                                        />

                                        <div className="flex justify-between items-center text-center">
                                          {[
                                            { key: 'Packed', label: 'Packed' },
                                            { key: 'Picked Up', label: 'Picked Up' },
                                            { key: 'On The Way', label: 'Transit' },
                                            { key: 'Near Customer', label: 'Arrived' }
                                          ].map((step, idx) => {
                                            const stepStates = ['Confirmed', 'Packed', 'Picked Up', 'On The Way', 'Near Customer'];
                                            const currentIdx = stepStates.indexOf(order.status);
                                            const stepIdx = stepStates.indexOf(step.key);
                                            
                                            const isPassed = stepIdx <= currentIdx;
                                            const isCurrent = step.key === order.status;

                                            return (
                                              <div key={idx} className="flex flex-col items-center">
                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black border transition-all ${
                                                  isPassed 
                                                    ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20' 
                                                    : 'bg-white text-gray-400 border-gray-200'
                                                }`}>
                                                  {isPassed ? <FiCheck size={11} /> : idx + 1}
                                                </div>
                                                <span className={`text-[10px] font-bold mt-2 ${
                                                  isCurrent ? 'text-primary font-black scale-105' : 'text-gray-500'
                                                }`}>
                                                  {step.label}
                                                </span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>

                                      {/* Quick Transit Shifters */}
                                      <div className="space-y-2">
                                        <div className="text-xs font-black text-gray-400 uppercase tracking-wider">Fast-Forward Transit Simulation</div>
                                        <div className="flex flex-wrap gap-2">
                                          {[
                                            { state: 'Picked Up', label: 'Picked Up 📦' },
                                            { state: 'On The Way', label: 'On Way 🚀' },
                                            { state: 'Near Customer', label: 'Near Cust 📍' },
                                            { state: 'Delivered', label: 'Mark Delivered 🎉' }
                                          ].map((shifting) => (
                                            <button
                                              key={shifting.state}
                                              onClick={async () => {
                                                await advanceOrderStatus(order.id, shifting.state);
                                                showToast(`Transit advanced to ${shifting.state}!`, 'success');
                                              }}
                                              className="px-3 py-1.5 bg-gray-100 hover:bg-primary hover:text-white rounded-xl text-[10px] font-black text-gray-700 transition-all border border-gray-100"
                                            >
                                              {shifting.label}
                                            </button>
                                          ))}
                                        </div>
                                      </div>

                                      {/* Assigned Rider Info Card */}
                                      <div className="border border-gray-100 p-4 rounded-xl flex items-center justify-between bg-gray-50/30">
                                        <div>
                                          <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Assigned Delivery Partner</div>
                                          <div className="font-extrabold text-gray-800 text-sm mt-1">{order.deliveryInfo?.person}</div>
                                          <div className="text-xs text-gray-500 mt-0.5">{order.deliveryInfo?.vehicle} • {order.deliveryInfo?.phone}</div>
                                        </div>
                                        <a 
                                          href={`tel:${order.deliveryInfo?.phone}`} 
                                          className="p-2.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-full transition-colors"
                                        >
                                          <FiPhone size={14} />
                                        </a>
                                      </div>
                                    </div>
                                  )}

                                  {/* DISPATCH CONTROL CENTER STATE 4: DELIVERED */}
                                  {dispatchState === 'Delivered' && (
                                    <div className="space-y-4 animate-fade-in">
                                      <div className="bg-green-50 border border-green-200 p-4 rounded-xl text-green-800 flex items-start gap-3">
                                        <FiCheckCircle className="text-xl mt-0.5 flex-shrink-0" />
                                        <div className="text-xs space-y-1">
                                          <div className="font-extrabold">Delivery Completed Successfully!</div>
                                          <p className="text-green-700 leading-relaxed font-semibold">
                                            The produce has been safely hand-delivered to the customer. All farmer payouts and rider commissions have been computed, categorized, and added to the Weekly Payout Ledger.
                                          </p>
                                          {order.deliveredAt && (
                                            <div className="text-[10px] font-bold text-green-600/90 mt-1">
                                              Time Stamp: {new Date(order.deliveredAt).toLocaleString()}
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      <div className="border border-gray-100 p-4 rounded-xl text-xs space-y-2 bg-gray-50/10">
                                        <div className="font-black text-gray-700">Fulfillment Financial Audit</div>
                                        <div className="grid grid-cols-2 gap-y-1.5 text-gray-600 font-medium">
                                          <div>Total GMV Sales:</div>
                                          <div className="text-right font-bold text-gray-800">₹{order.total}</div>
                                          <div>Farmer Revenue:</div>
                                          <div className="text-right font-bold text-gray-800">₹{(order.total - order.deliveryFee - order.total * 0.05).toFixed(2)}</div>
                                          <div>Rider Payout (Base):</div>
                                          <div className="text-right font-bold text-gray-800">₹{order.deliveryFee}</div>
                                          <div>Admin Platform Share:</div>
                                          <div className="text-right font-bold text-primary">₹{(order.total * 0.05).toFixed(2)}</div>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* DISPATCH CONTROL CENTER STATE 5: CANCELLED */}
                                  {dispatchState === 'Cancelled' && (
                                    <div className="bg-gray-100 border border-gray-200 p-4 rounded-xl text-gray-600 flex items-start gap-3 animate-fade-in">
                                      <FiXCircle className="text-xl mt-0.5 flex-shrink-0" />
                                      <div className="text-xs space-y-1">
                                        <div className="font-extrabold">Order Cancelled</div>
                                        <p className="text-gray-500 font-semibold leading-relaxed">
                                          This order has been officially cancelled. All logistics assignments have been cancelled, and item stock decrementing has been rolled back. No commissions or farmer payouts are due.
                                        </p>
                                      </div>
                                    </div>
                                  )}


                                  {/* REJECTION HISTORY LOG PANEL */}
                                  {Array.isArray(order.rejectionHistory) && order.rejectionHistory.length > 0 && (
                                    <div className="border-t border-gray-100 pt-4 space-y-2">
                                      <div className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <FiTrendingUp className="text-rose-500" /> Rejection History Logs ({order.rejectionHistory.length})
                                      </div>
                                      <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                                        {order.rejectionHistory.map((log, index) => (
                                          <div key={index} className="p-2.5 rounded-lg bg-red-50/40 border border-red-50 text-[10px] font-medium flex justify-between gap-3 text-red-800">
                                            <div>
                                              <span className="font-extrabold text-red-950">Rider {log.riderName}</span> rejected the handoff offer.
                                              <div className="text-gray-500 font-semibold mt-0.5">Reason: "{log.reason || 'Not specified'}"</div>
                                            </div>
                                            <div className="text-right text-gray-400 font-bold whitespace-nowrap">{log.time}</div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                );
              })}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-500 font-bold">
                    No orders matching search or dispatch filters found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
