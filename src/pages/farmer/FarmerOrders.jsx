import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiChevronUp, FiSearch, FiFilter, FiMapPin, FiPhone } from 'react-icons/fi';
import { useOrders, getQtyNumber } from '../../context/OrdersContext';
import { useAuth } from '../../context/AuthContext';
import { printPackingSlip } from '../../utils/packingSlip';

export default function FarmerOrders() {
  const { 
    orders, 
    updateOrder, 
    riders, 
    dbConnected
  } = useOrders();
  const { user } = useAuth();
  const [expandedRow, setExpandedRow] = useState(null);

  // Filter orders for this farmer
  const farmerId = user?.id || 1;
  const farmerOrders = orders.filter(o => 
    String(o.farmerId) === String(farmerId) || 
    (Array.isArray(o.items) && o.items.some(item => String(item.farmerId) === String(farmerId)))
  );

  const getFarmerSalesBreakdown = (order, fId) => {
    if (!Array.isArray(order.items)) {
      return {
        subtotal: order.subtotal || order.total || 0,
        discount: order.discount || 0,
        netSales: (order.subtotal || order.total || 0) - (order.discount || 0)
      };
    }
    
    let farmerSubtotal = 0;
    let totalItemsSubtotal = 0;
    
    order.items.forEach(item => {
      const itemFId = item.farmerId || order.farmerId || 1;
      const qty = getQtyNumber(item);
      const cost = (item.price || 0) * qty;
      
      if (String(itemFId) === String(fId)) {
        farmerSubtotal += cost;
      }
      totalItemsSubtotal += cost;
    });
    
    const orderDiscount = Number(order.discount) || 0;
    const propShare = totalItemsSubtotal > 0 ? (farmerSubtotal / totalItemsSubtotal) : 0;
    const farmerDiscount = orderDiscount * propShare;
    const netSales = farmerSubtotal - farmerDiscount;
    
    return {
      subtotal: farmerSubtotal,
      discount: farmerDiscount,
      netSales: netSales
    };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-orange-100 text-orange-700';
      case 'Confirmed': return 'bg-indigo-100 text-indigo-700';
      case 'Packed': return 'bg-purple-100 text-purple-700';
      case 'Picked Up': return 'bg-blue-100 text-blue-700';
      case 'On The Way': return 'bg-sky-100 text-sky-700';
      case 'Near Customer': return 'bg-teal-100 text-teal-700';
      case 'Delivered': return 'bg-green-100 text-green-700';
      case 'Cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Order Management</h2>
        
        {/* Supabase Connection Status Indicators */}
        <div className="flex items-center gap-2">
          {dbConnected === null && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500 border border-gray-200">
              <span className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" />
              Verifying Database Connection...
            </span>
          )}
          {dbConnected === true && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200 shadow-sm shadow-green-100/50">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
              Supabase Connected
            </span>
          )}
          {dbConnected === false && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-sm shadow-amber-100/50" title="Queries will gracefully fallback to cached data in Local Storage.">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Local Fallback Mode (Offline)
            </span>
          )}
        </div>
      </div>

      {dbConnected === false && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl text-sm text-amber-800 space-y-2">
          <div className="font-bold flex items-center gap-1.5 text-amber-700">
            <span>⚠️ Supabase Database Disconnected</span>
          </div>
          <p className="text-gray-600">
            We are having trouble connecting to the Supabase cloud database. The assignment portal has automatically switched to <strong>Cached Fallback Mode</strong>. You can still assign riders and manage orders locally, but changes will not persist to the cloud until connection is restored.
          </p>
        </div>
      )}
      
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-3 text-gray-400" />
          <input type="text" placeholder="Search by Order ID or Customer..." className="w-full pl-10 pr-4 py-2 border rounded-xl bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <div className="flex gap-4">
          <select className="border rounded-xl px-4 py-2 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary text-gray-600">
            <option>All Statuses</option>
            <option>Pending</option>
            <option>Confirmed</option>
            <option>Packed</option>
            <option>Picked Up</option>
            <option>On The Way</option>
            <option>Near Customer</option>
            <option>Delivered</option>
            <option>Cancelled</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 border rounded-xl text-gray-600 hover:bg-gray-50">
            <FiFilter /> Filter
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-600 border-b border-gray-100 text-sm">
                <th className="p-4 font-medium">Order ID</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Customer</th>
                <th className="p-4 font-medium">Items</th>
                <th className="p-4 font-medium">Total</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {farmerOrders.map((order) => (
                <React.Fragment key={order.id}>
                  <tr className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer ${expandedRow === order.id ? 'bg-primary/5' : ''}`} onClick={() => setExpandedRow(expandedRow === order.id ? null : order.id)}>
                    <td className="p-4 font-bold text-gray-800">{order.id}</td>
                    <td className="p-4 text-gray-600 text-sm">{order.date}</td>
                    <td className="p-4 font-medium text-gray-800">{order.customer || order.customerName}</td>
                    <td className="p-4 text-gray-600">
                      {Array.isArray(order.items) 
                        ? order.items.filter(item => String(item.farmerId) === String(farmerId)).length 
                        : (order.itemsCount || 0)
                      } items
                    </td>
                    <td className="p-4 font-black text-gray-900">
                      {(() => {
                        const breakdown = getFarmerSalesBreakdown(order, farmerId);
                        return `₹${breakdown.netSales.toFixed(2)}`;
                      })()}
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>{order.status}</span>
                    </td>
                    <td className="p-4 text-right text-gray-400">
                      {expandedRow === order.id ? <FiChevronUp size={20} className="inline" /> : <FiChevronDown size={20} className="inline" />}
                    </td>
                  </tr>
                  
                  <AnimatePresence>
                    {expandedRow === order.id && (
                      <motion.tr 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: 'auto' }} 
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-gray-50 border-b border-gray-100"
                      >
                        <td colSpan="7" className="p-0">
                          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                              <h4 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wider">Order Items</h4>
                              <div className="space-y-3">
                                { (order.items || order.itemsList)
                                  .filter(item => String(item.farmerId) === String(farmerId))
                                  .map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100">
                                      <div>
                                        <div className="font-bold text-gray-800">{item.name}</div>
                                        <div className="text-sm text-gray-500">Qty: {item.qty}</div>
                                      </div>
                                      <div className="text-right">
                                        <div className="font-bold text-gray-900">₹{(item.price * getQtyNumber(item)).toFixed(2)}</div>
                                        <div className="text-xs text-gray-400">₹{item.price} / unit</div>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                              
                              <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl space-y-2">
                                <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Your Earnings Summary</div>
                                {(() => {
                                  const breakdown = getFarmerSalesBreakdown(order, farmerId);
                                  const commission = parseFloat((breakdown.netSales * 0.05).toFixed(2));
                                  const netEarnings = parseFloat((breakdown.netSales - commission).toFixed(2));
                                  
                                  return (
                                    <>
                                      <div className="flex justify-between text-xs text-gray-600">
                                        <span>Your Produce Subtotal</span>
                                        <span className="font-semibold text-gray-800">₹{breakdown.subtotal.toFixed(2)}</span>
                                      </div>
                                      {breakdown.discount > 0 && (
                                        <div className="flex justify-between text-xs text-green-600 font-bold">
                                          <span>Share of Bulk Discount</span>
                                          <span>-₹{breakdown.discount.toFixed(2)}</span>
                                        </div>
                                      )}
                                      <div className="flex justify-between text-xs text-gray-600 border-t border-emerald-100/60 pt-1.5 font-bold">
                                        <span>Gross Produce Sales</span>
                                        <span className="text-gray-800">₹{breakdown.netSales.toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between text-xs text-gray-600">
                                        <span>Platform Commission (5%)</span>
                                        <span className="font-semibold text-gray-800">₹{commission.toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between text-sm text-gray-900 border-t border-emerald-200 pt-1.5 font-black">
                                        <span className="text-primary">Your Net Earnings</span>
                                        <span className="text-primary">₹{netEarnings.toFixed(2)}</span>
                                      </div>
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wider">Delivery Details</h4>
                              <div className="bg-white p-4 rounded-xl border border-gray-100 space-y-4">
                                <div className="flex items-start gap-3">
                                  <FiMapPin className="text-primary mt-1" />
                                  <div>
                                    <div className="font-medium text-gray-800">Delivery Address</div>
                                    <div className="text-sm text-gray-600 mt-1">{order.address}</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <FiPhone className="text-primary" />
                                  <div>
                                    <div className="text-sm text-gray-600">{order.phone}</div>
                                  </div>
                                </div>
                              </div>
                              <div className="mt-6 space-y-4">
                                {order.status === 'Pending' && (
                                  <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-left space-y-2">
                                    <div className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                      Order Status: Pending Dispatch
                                    </div>
                                    <p className="text-xs text-gray-600 leading-relaxed">
                                      This order has been received. The administrator will assign a delivery partner shortly. Please prepare and pack the items.
                                    </p>
                                  </div>
                                )}
                                
                                {['Confirmed', 'Packed', 'Picked Up', 'On The Way', 'Near Customer'].includes(order.status) && (
                                  <div className="space-y-3">
                                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                      <div className="flex justify-between items-start mb-3">
                                        <div>
                                          <div className="text-xs font-bold text-blue-700 uppercase">Delivery Partner Assigned</div>
                                          <div className="font-bold text-gray-800 flex items-center gap-1.5">{riders.find(r => String(r.id) === String(order.deliveryInfo?.riderId))?.image && <img src={riders.find(r => String(r.id) === String(order.deliveryInfo?.riderId))?.image} alt="rider" className="w-5 h-5 rounded-full object-cover border border-blue-200" />}{order.deliveryInfo?.person}</div>
                                          <div className="text-xs text-gray-600">{order.deliveryInfo?.phone} • {order.deliveryInfo?.vehicle}</div>
                                        </div>
                                        <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-[10px] font-bold">{order.status.toUpperCase()}</div>
                                      </div>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); updateOrder(order.id, { status: 'Delivered' }); }}
                                        className="w-full py-2 bg-green-600 text-white rounded-lg font-bold shadow-sm hover:bg-green-700 transition-colors text-sm"
                                      >
                                        Mark as Delivered
                                      </button>
                                    </div>
                                  </div>
                                )}
                                
                                <div className="flex gap-3">
                                  <button onClick={(e) => { e.stopPropagation(); printPackingSlip(order, farmerId); }} className="flex-1 py-2 px-4 border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg font-bold shadow-sm transition-colors text-sm flex items-center justify-center gap-1.5">Customer Packing Slip 📋</button>
                                  <button onClick={(e) => e.stopPropagation()} className="flex-1 py-2 px-4 border border-gray-300 bg-white text-gray-700 rounded-lg font-bold shadow-sm hover:bg-gray-50 transition-colors text-sm">Order Log</button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
