import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOrders } from '../../context/OrdersContext';
import { supabase } from '../../utils/supabaseClient';
import { FiSearch, FiCheck, FiX, FiShield, FiCheckCircle, FiStar, FiActivity } from 'react-icons/fi';

export default function AdminRiderManagement() {
  const { riders } = useOrders();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All Statuses');
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase
        .from('riders')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      showToast(`Rider status updated to ${newStatus}!`, 'success');
    } catch (error) {
      console.error('Error updating rider status:', error);
      showToast('Failed to update rider status', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this rider?')) return;
    
    try {
      const { error } = await supabase
        .from('riders')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showToast('Rider deleted successfully.', 'error');
    } catch (error) {
      console.error('Error deleting rider:', error);
      showToast('Failed to delete rider', 'error');
    }
  };

  const filteredRiders = (riders || []).filter(r => {
    const matchesSearch = (r.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (r.phone || '').includes(searchTerm) || 
                          (r.vehicle || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All Statuses' || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in relative">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-24 right-8 z-[100] text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 font-bold ${
              toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'
            }`}>
            {toast.type === 'error' ? <FiX /> : <FiCheckCircle />} {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Rider Management</h2>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-3 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by Rider Name, Phone, or Vehicle..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-xl bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary" 
          />
        </div>
        <select 
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border rounded-xl px-4 py-2 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary text-gray-600 cursor-pointer"
        >
          <option value="All Statuses">All Statuses</option>
          <option value="Online">Online</option>
          <option value="Offline">Offline</option>
          <option value="Busy">Busy</option>
          <option value="Suspended">Suspended</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-600 border-b border-gray-100 text-sm">
                <th className="p-4 font-medium">Rider Details</th>
                <th className="p-4 font-medium">Vehicle Info</th>
                <th className="p-4 font-medium">Performance</th>
                <th className="p-4 font-medium">Acceptance Rate</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRiders.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 flex items-center gap-3">
                    <img src={r.image || 'https://placehold.co/400x400/eeeeee/999999?text=Rider'} className="w-10 h-10 rounded-full object-cover" alt="" loading="lazy" decoding="async" onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x400/eeeeee/999999?text=Rider"; }} />
                    <div>
                      <div className="font-bold text-gray-800 flex items-center gap-1">
                        {r.name} {r.status !== 'Suspended' && <FiShield className="text-green-500" size={14} />}
                      </div>
                      <div className="text-xs text-gray-500">{r.phone}</div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm font-medium text-gray-700">{r.vehicle}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-xs text-gray-500">Deliveries: <span className="font-bold text-gray-700">{r.weeklyDeliveries}</span></div>
                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">Rating: <span className="text-yellow-500 fill-current flex items-center gap-0.5"><FiStar size={12} /> {r.rating}</span></div>
                  </td>
                  <td className="p-4 font-medium text-gray-600">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-full ${r.acceptanceRate >= 90 ? 'bg-green-500' : r.acceptanceRate >= 70 ? 'bg-orange-500' : 'bg-red-500'}`} style={{ width: `${r.acceptanceRate}%` }}></div>
                      </div>
                      <span className="text-xs">{r.acceptanceRate}%</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      r.status === 'Online' ? 'bg-green-100 text-green-700' :
                      r.status === 'Busy' ? 'bg-orange-100 text-orange-700' :
                      r.status === 'Suspended' ? 'bg-red-100 text-red-700' :
                      'bg-gray-200 text-gray-800'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleUpdateStatus(r.id, r.status === 'Suspended' ? 'Offline' : 'Suspended')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          r.status !== 'Suspended' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                      >
                        {r.status !== 'Suspended' ? 'Suspend' : 'Restore'}
                      </button>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 transition-colors flex items-center gap-1"
                      >
                        <FiX size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredRiders.length === 0 && <div className="p-8 text-center text-gray-500">No riders found matching your criteria.</div>}
        </div>
      </div>
    </div>
  );
}
