import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiPackage, FiTruck, FiCheckCircle, FiPhone, FiArrowLeft } from 'react-icons/fi';
import { useOrders, getQtyNumber } from '../../context/OrdersContext';
import { Link } from 'react-router-dom';
import CustomerBottomNav from '../../components/CustomerBottomNav';

import { useAuth } from '../../context/AuthContext';
import { printInvoice } from '../../utils/invoice';

export default function CustomerOrders() {
  const { orders = [], riders = [], clearCustomerHistory, updateOrder } = useOrders();
  const { user } = useAuth();
  const [expandedReceipts, setExpandedReceipts] = useState({});

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Recent';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Recent';
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return 'Recent';
    }
  };

  const toggleReceipt = (orderId) => {
    setExpandedReceipts(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const customerOrders = (orders || []).filter(o => String(o.customerId) === String(user?.id));

  if (customerOrders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="text-6xl mb-4 text-primary"><FiPackage /></div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">No orders yet</h2>
        <p className="text-gray-500 mb-6 text-center max-w-xs">You haven't placed any orders yet. Fresh produce is waiting for you!</p>
        <Link to="/products" className="bg-primary text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-forest transition-all">
          Explore Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 pb-28 px-4 relative">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/customer/home" className="text-gray-500 hover:text-primary transition-colors bg-white shadow-sm p-2 rounded-full border border-gray-200">
              <FiArrowLeft size={20} />
            </Link>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">My Orders</h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                if (window.confirm('Are you sure you want to clear your order history?')) {
                  clearCustomerHistory(user?.id);
                }
              }}
              className="text-red-500 font-bold hover:underline"
            >
              Clear History
            </button>
            <Link to="/products" className="text-primary font-bold hover:underline">Continue Shopping</Link>
          </div>
        </div>

        <div className="space-y-6">
          {customerOrders.map((order, i) => (
            <motion.div 
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
            >
              {/* Order Header */}
              <div className="bg-gray-50 p-6 flex flex-wrap justify-between items-center gap-4 border-b border-gray-100">
                <div className="flex gap-8">
                  <div>
                    <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Order Placed</div>
                    <div className="font-medium text-gray-800">{formatDate(order.createdAt)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Total</div>
                    <div className="font-medium text-gray-800">₹{Number(order.total || 0).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Ship To</div>
                    <div className="font-medium text-primary hover:underline cursor-pointer">{user?.fullName || user?.name || 'Customer'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Order ID</div>
                    <div className="font-medium text-gray-800">{order.id}</div>
                  </div>
                  {order.status === 'Pending' && (
                    <button 
                      onClick={() => {
                        if(window.confirm('Are you sure you want to cancel this order?')) {
                          updateOrder(order.id, { status: 'Cancelled' });
                        }
                      }}
                      className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 border border-red-200 rounded-xl font-bold text-xs shadow-sm transition-all"
                    >
                      Cancel Order
                    </button>
                  )}
                  <button 
                    onClick={() => printInvoice(order, user)}
                    className="bg-white hover:bg-gray-100 text-gray-700 px-4 py-2 border border-gray-200 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
                  >
                    🖨️ Print Invoice
                  </button>
                </div>
              </div>

              {/* Order Body */}
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  {order.status === 'Delivered' ? (
                    <FiCheckCircle className="text-green-500 text-2xl" />
                  ) : order.status === 'Shipped' ? (
                    <FiTruck className="text-blue-500 text-2xl" />
                  ) : order.status === 'Cancelled' ? (
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 text-lg">✖</div>
                  ) : (
                    <FiPackage className="text-orange-500 text-2xl" />
                  )}
                  <h3 className="text-lg font-bold text-gray-800">
                    {order.status === 'Delivered' ? 'Delivered on ' + formatDate(order.deliveredAt || order.createdAt) : 
                     order.status === 'Shipped' ? 'In Transit' : 
                     order.status === 'Cancelled' ? 'Order Cancelled' : 
                     'Arriving Soon'}
                  </h3>
                </div>

                {order.deliveryInfo && order.deliveryInfo.riderId && (
                  <div className="space-y-4 mb-6">
                    {/* Delivery Partner Contact Card */}
                    <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                      <div className="flex flex-wrap justify-between items-center gap-4">
                        <div className="flex items-center gap-4">
                          {riders.find(r => r.id === order.deliveryInfo?.riderId)?.image ? (
                            <img 
                              src={riders.find(r => r.id === order.deliveryInfo?.riderId)?.image} 
                              alt="Rider" 
                              className="w-12 h-12 rounded-xl object-cover shadow-sm border border-primary/10 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-sm border border-primary/5 text-primary"><FiTruck /></div>
                          )}
                          <div>
                            <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Delivery Partner</div>
                            <div className="font-bold text-gray-800">{order.deliveryInfo.person}</div>
                            <div className="text-xs text-gray-500 font-medium">Vehicle: {order.deliveryInfo.vehicle}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right hidden sm:block">
                            <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Contact</div>
                            <div className="font-bold text-primary">{order.deliveryInfo.phone}</div>
                          </div>
                          <a 
                            href={`tel:${order.deliveryInfo.phone}`}
                            className="bg-primary text-white p-3 rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-transform flex items-center justify-center"
                            title="Call Delivery Partner"
                          >
                            <FiPhone className="text-lg" />
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Live Delivery Tracking Console (Requirement 5) */}
                    {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                      <div className="p-6 bg-slate-900 text-white rounded-3xl border border-slate-800 space-y-6 text-left">
                        <div className="flex justify-between items-center flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping inline-block" />
                            <h4 className="font-black text-xs uppercase tracking-wider text-green-400">Live Delivery Tracking</h4>
                          </div>
                          <div className="text-xs text-slate-400 font-bold bg-slate-800 px-3 py-1 rounded-full">
                            ⏱️ ETA: {Math.max(2, Math.round((order.eta || 20) * (1 - (order.liveCoordinates?.percent || 10) / 100)))} Mins · {parseFloat(((order.distance || 3.5) * (1 - (order.liveCoordinates?.percent || 10) / 100)).toFixed(1))} KM remaining
                          </div>
                        </div>

                        {/* Progress steps bar */}
                        <div className="grid grid-cols-3 sm:grid-cols-7 gap-4 text-[10px] font-bold text-center text-slate-400 uppercase tracking-tight">
                          {[
                            { label: 'Placed', status: 'Pending' },
                            { label: 'Confirmed', status: 'Confirmed' },
                            { label: 'Packed', status: 'Packed' },
                            { label: 'Picked Up', status: 'Picked Up' },
                            { label: 'On The Way', status: 'On The Way' },
                            { label: 'Near You', status: 'Near Customer' },
                            { label: 'Delivered', status: 'Delivered' }
                          ].map((step, idx) => {
                            const statuses = ['Pending', 'Confirmed', 'Packed', 'Picked Up', 'On The Way', 'Near Customer', 'Delivered'];
                            const curIdx = statuses.indexOf(order.status);
                            const stepIdx = statuses.indexOf(step.status);
                            const isDone = stepIdx <= curIdx;
                            const isCurrent = order.status === step.status;

                            return (
                              <div key={idx} className="space-y-2">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto text-xs ${
                                  isDone ? 'bg-green-500 text-white font-bold' : 'bg-slate-800 text-slate-500'
                                }`}>
                                  {isDone ? '✓' : idx + 1}
                                </div>
                                <span className={isCurrent ? 'text-green-400 font-black' : isDone ? 'text-slate-300' : 'text-slate-500'}>
                                  {step.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Horizontal Animated Line Tracker */}
                        <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="absolute h-full bg-green-500 transition-all duration-1000 ease-out"
                            style={{ width: `${order.liveCoordinates?.percent || 10}%` }}
                          />
                        </div>

                        {/* Visual Tracking Map Card */}
                        <div className="relative h-44 bg-[#0a0f0a] border border-slate-800 rounded-2xl overflow-hidden flex items-center justify-between px-10 shadow-inner">
                          {/* Grid background */}
                          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#10b981_1.2px,transparent_1.2px)] [background-size:20px_20px]" />
                          
                          {/* Pulsing Farmer Farm pin */}
                          <div className="relative flex flex-col items-center z-10">
                            <div className="w-10 h-10 rounded-full bg-green-950 border border-green-500 flex items-center justify-center text-xl shadow-md">🌾</div>
                            <span className="text-[10px] text-gray-400 font-bold mt-1.5">{order.farmer || 'Farmer Farm'}</span>
                          </div>

                          {/* Moving rider marker along optimized path */}
                          <div 
                            className="absolute z-20 flex flex-col items-center transition-all duration-1000 ease-out"
                            style={{ left: `calc(${order.liveCoordinates?.percent || 10}% - 20px)`, top: '25%' }}
                          >
                            <div className="w-10 h-10 rounded-full bg-orange-500 border border-orange-400 flex items-center justify-center text-lg shadow-lg shadow-orange-500/30 text-white animate-bounce">
                              🛵
                            </div>
                            <span className="text-[8px] text-orange-400 font-black bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded-full mt-1.5 shadow">
                              {order.deliveryInfo.person}
                            </span>
                          </div>

                          {/* Dashed Route line */}
                          <div className="absolute left-16 right-16 h-0.5 border-t-2 border-dashed border-emerald-600/30 top-[42%] z-0" />

                          {/* Home location pin */}
                          <div className="relative flex flex-col items-center z-10">
                            <div className="w-10 h-10 rounded-full bg-blue-950 border border-blue-500 flex items-center justify-center text-xl shadow-md">🏠</div>
                            <span className="text-[10px] text-gray-400 font-bold mt-1.5">Your Home</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-4">
                  {Array.isArray(order.items) && order.items.map((item, idx) => (
                    <div key={idx} className="flex gap-4 items-center">
                      <img src={item.image || 'https://placehold.co/400x400/eeeeee/999999?text=No+Image'} alt={item.name} className="w-20 h-20 rounded-xl object-cover"  loading="lazy" decoding="async" onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x400/eeeeee/999999?text=No+Image"; }} />
                      <div className="flex-1">
                        <div className="font-bold text-gray-800">{item.name}</div>
                        <div className="text-sm text-gray-500">Sold by: {item.farmerName || order.farmer || 'Local Farmer'}</div>
                        <div className="text-sm font-medium text-gray-900 mt-1">
                          Qty: {item.qty || item.quantity} • ₹{item.price} / unit • Total: ₹{(Number(item.price || 0) * getQtyNumber(item)).toFixed(2)}
                        </div>
                      </div>
                      <div className="hidden sm:flex gap-2">
                        <button className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50">Buy it again</button>
                        <button className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-sm hover:bg-primary-light transition-all">Support</button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Glassmorphic Order Receipt Summary Breakdown */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <button 
                    onClick={() => toggleReceipt(order.id)}
                    className="text-primary hover:text-emerald-800 font-bold text-sm flex items-center gap-1.5 focus:outline-none transition-colors"
                  >
                    {expandedReceipts[order.id] ? 'Hide Order Details ▲' : 'Show Full Order Receipt Breakdown ▼'}
                  </button>
                  
                  {expandedReceipts[order.id] && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 p-5 bg-gradient-to-br from-emerald-50/50 to-teal-50/30 border border-emerald-100/50 rounded-2xl space-y-3 shadow-inner"
                    >
                      <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2 border-b border-emerald-100/40 pb-2">Receipt Breakdown</div>
                      
                      {(() => {
                        const calculatedSubtotal = (Array.isArray(order.items) ? order.items : []).reduce((acc, item) => acc + (Number(item.price || 0) * getQtyNumber(item)), 0);
                        const subtotal = Number(order.subtotal) || calculatedSubtotal;
                        const discount = Number(order.discount) || 0;
                        const deliveryFee = Number(order.deliveryFee) || 0;
                        const platformFee = 10.00;
                        const gst = parseFloat((subtotal * 0.05).toFixed(2));
                        const grandTotal = Number(order.total) || (subtotal - discount + deliveryFee + platformFee + gst);

                        return (
                          <>
                            <div className="flex justify-between text-sm text-gray-600">
                              <span>Items Subtotal</span>
                              <span className="font-semibold text-gray-800">₹{Number(subtotal).toFixed(2)}</span>
                            </div>
                            
                            {discount > 0 && (
                              <div className="flex justify-between text-sm text-green-600 font-bold">
                                <span>Bulk Discount</span>
                                <span>-₹{discount.toFixed(2)}</span>
                              </div>
                            )}
                            
                            <div className="flex justify-between text-sm text-gray-600">
                              <span>Delivery Fee</span>
                              <span className="font-semibold text-gray-800">₹{deliveryFee.toFixed(2)}</span>
                            </div>
                            
                            <div className="flex justify-between text-sm text-gray-600">
                              <span>Platform Fee</span>
                              <span className="font-semibold text-gray-800">₹{platformFee.toFixed(2)}</span>
                            </div>
                            
                            <div className="flex justify-between text-sm text-gray-600">
                              <span className="flex items-center gap-1">GST <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-black">5%</span></span>
                              <span className="font-semibold text-gray-800">₹{gst.toFixed(2)}</span>
                            </div>
                            
                            <div className="pt-2.5 border-t border-emerald-100/60 flex justify-between items-center text-gray-900">
                              <span className="font-black text-sm">Grand Total (Paid via {order.deliveryDetails?.paymentMethod || order.paymentMethod || 'Cash on Delivery'})</span>
                              <span className="font-black text-xl text-primary">₹{Number(grandTotal).toFixed(2)}</span>
                            </div>
                          </>
                        );
                      })()}
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      <CustomerBottomNav />
    </div>
  );
}
