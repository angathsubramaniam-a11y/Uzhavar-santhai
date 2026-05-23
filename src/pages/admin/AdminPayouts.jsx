import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOrders } from '../../context/OrdersContext';
import { FiCheckCircle, FiDollarSign, FiUser, FiTruck, FiBriefcase } from 'react-icons/fi';

export default function AdminPayouts() {
  const { payouts, approvePayout, riders = [] } = useOrders();
  const [activeTab, setActiveTab] = useState('farmer'); // 'farmer' | 'rider'
  const [toast, setToast] = useState(null);

  const handleApprove = (type, payoutId, name) => {
    approvePayout(type, payoutId);
    const targetList = type === 'farmer' ? 'farmers' : 'riders';
    const payout = (payouts?.[targetList] || []).find(p => p.id === payoutId);
    const amount = type === 'rider' ? payout?.basePay : payout?.netEarnings;
    setToast({ message: `Payout of ₹${amount || 0} paid successfully to ${name}!`, type: 'success' });
    setTimeout(() => setToast(null), 3000);
  };

  const pendingFarmers = (payouts?.farmers || []).filter(p => p.status === 'Pending');
  const paidFarmers = (payouts?.farmers || []).filter(p => p.status === 'Paid');

  const pendingRiders = (payouts?.riders || []).filter(p => p.status === 'Pending');
  const paidRiders = (payouts?.riders || []).filter(p => p.status === 'Paid');

  return (
    <div className="space-y-6 animate-fade-in relative text-left">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 right-8 z-[100] bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 font-bold">
            <FiCheckCircle /> {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Weekly Payouts System</h2>
          <p className="text-sm text-gray-500">Approve and distribute payouts for Farmers and Delivery Riders</p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-gray-200 p-1.5 rounded-xl border border-gray-300">
          <button
            onClick={() => setActiveTab('farmer')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'farmer' ? 'bg-primary text-white shadow-md' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <FiUser /> Farmer Payouts
          </button>
          <button
            onClick={() => setActiveTab('rider')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'rider' ? 'bg-primary text-white shadow-md' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <FiTruck /> Rider Payouts
          </button>
        </div>
      </div>

      {activeTab === 'farmer' ? (
        <div className="grid grid-cols-1 gap-6">
          {/* Stats Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <span className="text-xs text-gray-500 font-bold uppercase block">Pending Farmer Payouts</span>
              <div className="text-3xl font-black text-orange-600 mt-2">
                ₹{pendingFarmers.reduce((acc, p) => acc + p.netEarnings, 0).toFixed(2)}
              </div>
              <span className="text-xs text-gray-400 mt-1 block">{pendingFarmers.length} partners awaiting payment</span>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <span className="text-xs text-gray-500 font-bold uppercase block">Paid Out This Week</span>
              <div className="text-3xl font-black text-green-600 mt-2">
                ₹{paidFarmers.reduce((acc, p) => acc + p.netEarnings, 0).toFixed(2)}
              </div>
              <span className="text-xs text-gray-400 mt-1 block">{paidFarmers.length} partners paid</span>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <span className="text-xs text-gray-500 font-bold uppercase block">Platform Commission Earned (5%)</span>
              <div className="text-3xl font-black text-primary mt-2">
                ₹{(payouts?.farmers || []).reduce((acc, p) => acc + (p.commission || 0), 0).toFixed(2)}
              </div>
              <span className="text-xs text-gray-400 mt-1 block">Accumulated platform gross cut</span>
            </div>
          </div>

          {/* Table list */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-800 mb-4">Farmer Disbursements Queue</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-100">
                    <th className="pb-3 font-bold">Farmer / Farm</th>
                    <th className="pb-3 font-bold">Week Ending</th>
                    <th className="pb-3 font-bold">Total Sales</th>
                    <th className="pb-3 font-bold">Platform Cut (5%)</th>
                    <th className="pb-3 font-bold">Net Earnings</th>
                    <th className="pb-3 font-bold">Status</th>
                    <th className="pb-3 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(payouts?.farmers || []).map((payout) => (
                    <tr key={payout.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="py-4">
                        <div className="font-bold text-gray-800">{payout.name}</div>
                        <div className="text-xs text-gray-500">{payout.farmName}</div>
                      </td>
                      <td className="py-4 text-gray-600">{payout.weekEndDate}</td>
                      <td className="py-4 text-gray-800 font-medium">₹{payout.totalSales.toFixed(2)}</td>
                      <td className="py-4 text-red-500">-₹{payout.commission.toFixed(2)}</td>
                      <td className="py-4 font-black text-gray-900 text-base">₹{payout.netEarnings.toFixed(2)}</td>
                      <td className="py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          payout.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {payout.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        {payout.status === 'Pending' ? (
                          <button
                            onClick={() => handleApprove('farmer', payout.id, payout.name)}
                            className="bg-primary hover:bg-primary-light text-white font-bold px-4 py-2 rounded-xl shadow-sm text-xs transition-colors"
                          >
                            Approve & Pay
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs font-bold flex items-center justify-end gap-1"><FiCheckCircle className="text-green-500" /> Disbursed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(!payouts?.farmers || payouts.farmers.length === 0) && (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-gray-500">No payout items recorded.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {/* Stats Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <span className="text-xs text-gray-500 font-bold uppercase block">Pending Rider Payouts</span>
              <div className="text-3xl font-black text-orange-600 mt-2">
                ₹{pendingRiders.reduce((acc, p) => acc + p.basePay, 0).toFixed(2)}
              </div>
              <span className="text-xs text-gray-400 mt-1 block">{pendingRiders.length} riders awaiting payment</span>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <span className="text-xs text-gray-500 font-bold uppercase block">Paid Out This Week</span>
              <div className="text-3xl font-black text-green-600 mt-2">
                ₹{paidRiders.reduce((acc, p) => acc + p.basePay, 0).toFixed(2)}
              </div>
              <span className="text-xs text-gray-400 mt-1 block">{paidRiders.length} riders paid</span>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <span className="text-xs text-gray-500 font-bold uppercase block">Total Dispatched Trips</span>
              <div className="text-3xl font-black text-blue-600 mt-2">
                {(payouts?.riders || []).reduce((acc, p) => acc + (p.deliveryCount || 0), 0)}
              </div>
              <span className="text-xs text-gray-400 mt-1 block">Successfully completed delivery courier trips</span>
            </div>
          </div>

          {/* Table list */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-800 mb-4">Riders Disbursements Queue</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-100">
                    <th className="pb-3 font-bold">Rider Partner</th>
                    <th className="pb-3 font-bold">Week Ending</th>
                    <th className="pb-3 font-bold">Delivery Count</th>
                    <th className="pb-3 font-bold">Base Pay (₹50/trip)</th>
                    <th className="pb-3 font-bold">Net Earnings</th>
                    <th className="pb-3 font-bold">Status</th>
                    <th className="pb-3 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(payouts?.riders || []).map((payout) => (
                    <tr key={payout.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          {riders.find(r => r.id === payout.riderId)?.image ? (
                            <img 
                              src={riders.find(r => r.id === payout.riderId)?.image} 
                              alt={payout.name} 
                              className="w-9 h-9 rounded-xl object-cover border border-gray-100 shadow-sm flex-shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 bg-gray-150 text-gray-500 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0">
                              {(payout.name || 'Rider').split(' ').map(n => n ? n[0] : '').join('')}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-gray-800">{payout.name}</div>
                            <div className="text-xs text-gray-500">Rider ID: #{payout.riderId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-gray-600">{payout.weekEndDate}</td>
                      <td className="py-4 text-gray-850 font-medium">{payout.deliveryCount} deliveries</td>
                      <td className="py-4 text-gray-600">₹{payout.basePay.toFixed(2)}</td>
                      <td className="py-4 font-black text-gray-900 text-base">₹{payout.basePay.toFixed(2)}</td>
                      <td className="py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          payout.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {payout.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        {payout.status === 'Pending' ? (
                          <button
                            onClick={() => handleApprove('rider', payout.id, payout.name)}
                            className="bg-primary hover:bg-primary-light text-white font-bold px-4 py-2 rounded-xl shadow-sm text-xs transition-colors"
                          >
                            Approve & Pay
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs font-bold flex items-center justify-end gap-1"><FiCheckCircle className="text-green-500" /> Disbursed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(!payouts?.riders || payouts.riders.length === 0) && (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-gray-500">No payout items recorded.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
