import React from 'react';
import { useOrders } from '../../context/OrdersContext';
import { useFarmers } from '../../context/FarmerContext';
import { 
  FiTrendingUp, FiActivity, FiTruck, FiCornerDownRight, 
  FiThumbsUp, FiAlertOctagon, FiAward, FiPieChart 
} from 'react-icons/fi';

export default function AdminAnalytics() {
  const { orders, riders, payouts } = useOrders();
  const { farmers } = useFarmers();

  // Basic stats calculations
  const totalDeliveries = orders.length;
  const successfulDeliveries = orders.filter(o => o.status === 'Delivered').length;
  const combinedDeliveries = orders.filter(o => o.smartCombinedApplied).length;
  
  // Total acceptance stats across all riders
  const totalAcceptances = (riders || []).reduce((acc, r) => acc + (r.acceptances || 0), 0);
  const totalRejections = (riders || []).reduce((acc, r) => acc + (r.rejections || 0), 0);
  const totalAlerts = totalAcceptances + totalRejections;
  const globalAcceptanceRate = totalAlerts > 0 ? Math.round((totalAcceptances / totalAlerts) * 100) : 100;
  const globalRejectionRate = totalAlerts > 0 ? 100 - globalAcceptanceRate : 0;

  // Farmer leaderboard (sales aggregated from payouts + active orders)
  const farmerStandings = (payouts?.farmers || []).map(f => {
    return {
      name: f.name || 'Farmer Partner',
      farm: f.farmName || 'Local Farm',
      sales: f.totalSales || 0,
      commission: f.commission || 0
    };
  }).sort((a, b) => b.sales - a.sales);

  // Rider leaderboard
  const riderStandings = [...(riders || [])].sort((a, b) => (b.weeklyDeliveries || 0) - (a.weeklyDeliveries || 0));

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Admin Platform Analytics</h2>
        <p className="text-sm text-gray-500 font-medium">Real-time metrics, rider behaviors, and revenue rankings</p>
      </div>

      {/* Grid statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Placed Orders', value: totalDeliveries, icon: <FiActivity />, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
          { label: 'Successful Deliveries', value: `${successfulDeliveries} / ${totalDeliveries}`, icon: <FiThumbsUp />, color: 'text-green-600 bg-green-50 border-green-100' },
          { label: 'Consolidated Pickups (Smart)', value: combinedDeliveries, icon: <FiTruck />, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
          { label: 'Rider Dispatch Success Rate', value: `${globalAcceptanceRate}%`, icon: <FiTrendingUp />, color: 'text-blue-600 bg-blue-50 border-blue-100' },
        ].map((stat, i) => (
          <div key={i} className={`bg-white p-6 rounded-2xl border shadow-sm ${stat.color.split(' ')[2]}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2.5 rounded-xl ${stat.color.split(' ').slice(0, 2).join(' ')}`}>{stat.icon}</div>
              <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">{stat.label}</span>
            </div>
            <div className="text-2xl font-black text-gray-900">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Rider Acceptance vs Rejection rates Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center gap-2 text-gray-800 font-bold text-base border-b border-gray-100 pb-3">
            <FiPieChart className="text-primary" /> Dispatch Acceptance Analysis
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm font-medium">
              <span className="text-gray-600">Total Dispatch Requests</span>
              <span className="text-gray-900 font-black">{totalAlerts}</span>
            </div>

            {/* Visual Bar chart */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-500 font-bold">
                <span>Rider Acceptances ({totalAcceptances})</span>
                <span>{globalAcceptanceRate}%</span>
              </div>
              <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden flex">
                <div className="bg-green-500 h-full transition-all" style={{ width: `${globalAcceptanceRate}%` }} />
                <div className="bg-red-500 h-full transition-all" style={{ width: `${globalRejectionRate}%` }} />
              </div>
              <div className="flex justify-between text-xs text-gray-500 font-bold">
                <span>Rider Rejections ({totalRejections})</span>
                <span>{globalRejectionRate}%</span>
              </div>
            </div>

            <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 text-xs text-orange-800 space-y-1">
              <div className="font-bold flex items-center gap-1"><FiAlertOctagon /> Dynamic Re-routing Alert</div>
              <p className="leading-relaxed">
                Platform automatically handles rejections by routing requests to next online couriers within 30 seconds.
              </p>
            </div>
          </div>
        </div>

        {/* Top Farmers Leaderboard */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center gap-2 text-gray-800 font-bold text-base border-b border-gray-100 pb-3">
            <FiAward className="text-yellow-600" /> Top-Grossing Farmers
          </div>

          <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
            {farmerStandings.map((farmer, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center font-black">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="font-bold text-gray-800">{farmer.name}</div>
                    <div className="text-[10px] text-gray-400">{farmer.farm}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black text-gray-900">₹{farmer.sales.toLocaleString()}</div>
                  <div className="text-[9px] text-gray-400">Paid Commission: ₹{farmer.commission}</div>
                </div>
              </div>
            ))}
            {farmerStandings.length === 0 && (
              <div className="py-8 text-center text-gray-400 font-bold">No farmer data available yet.</div>
            )}
          </div>
        </div>

        {/* Top Riders Leaderboard */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center gap-2 text-gray-800 font-bold text-base border-b border-gray-100 pb-3">
            <FiAward className="text-primary" /> Top Delivery Couriers
          </div>

          <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
            {riderStandings.map((rider, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-black flex-shrink-0">
                    {idx + 1}
                  </span>
                  {rider.image ? (
                    <img 
                      src={rider.image} 
                      alt={rider.name} 
                      className="w-8 h-8 rounded-lg object-cover border border-gray-150 shadow-sm flex-shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gray-100 text-gray-500 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0">
                      {(rider.name || 'Rider').split(' ').map(n => n ? n[0] : '').join('')}
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-gray-800">{rider.name}</div>
                    <div className="text-[10px] text-gray-400">Rating: ★ {rider.rating} ({rider.status})</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black text-gray-900">{rider.weeklyDeliveries} trips</div>
                  <div className="text-[9px] text-green-500 font-bold">Earned: ₹{rider.weeklyEarnings}</div>
                </div>
              </div>
            ))}
            {riderStandings.length === 0 && (
              <div className="py-8 text-center text-gray-400 font-bold">No rider data available yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
