import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFarmers } from '../../context/FarmerContext';
import { FiSearch, FiCheck, FiX, FiShield, FiCheckCircle, FiStar } from 'react-icons/fi';

export default function AdminFarmerManagement() {
  const { farmers, updateFarmer, deleteFarmer } = useFarmers();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All Statuses');
  const [toast, setToast] = useState(null);

  const handleApprove = (id) => {
    updateFarmer(id, { status: 'Verified' });
    setToast({ message: 'Farmer approved and verified successfully!', type: 'success' });
    setTimeout(() => setToast(null), 3000);
  };

  const handleReject = (id) => {
    deleteFarmer(id);
    setToast({ message: 'Farmer registration rejected and deleted.', type: 'error' });
    setTimeout(() => setToast(null), 3000);
  };

  const handleToggleStatus = (id, currentStatus) => {
    const newStatus = currentStatus === 'Suspended' ? 'Verified' : 'Suspended';
    updateFarmer(id, { status: newStatus });
    setToast({ message: `Farmer ${newStatus === 'Verified' ? 'restored' : 'suspended'} successfully!`, type: 'success' });
    setTimeout(() => setToast(null), 3000);
  };

  const filteredFarmers = (farmers || []).filter(f => {
    const matchesSearch = (f.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (f.farmName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All Statuses' || f.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

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

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Farmer Management</h2>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-3 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by Farmer Name or Farm..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-xl bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary" 
          />
        </div>
        <select 
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border rounded-xl px-4 py-2 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary text-gray-600"
        >
          <option value="All Statuses">All Statuses</option>
          <option value="Verified">Verified</option>
          <option value="Pending">Pending</option>
          <option value="Rejected">Rejected</option>
          <option value="Suspended">Suspended</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-600 border-b border-gray-100 text-sm">
                <th className="p-4 font-medium">Farmer Details</th>
                <th className="p-4 font-medium">Location</th>
                <th className="p-4 font-medium">Joined Date</th>
                <th className="p-4 font-medium">Rating</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredFarmers.map((f) => (
                <tr key={f.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 flex items-center gap-3">
                    <img src={f.image || 'https://placehold.co/400x400/eeeeee/999999?text=No+Image'} className="w-10 h-10 rounded-full object-cover" alt=""  loading="lazy" decoding="async" onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x400/eeeeee/999999?text=No+Image"; }} />
                    <div>
                      <div className="font-bold text-gray-800 flex items-center gap-1">
                        {f.name} {f.status === 'Verified' && <FiShield className="text-green-500" size={14} />}
                      </div>
                      <div className="text-xs text-gray-500">{f.farmName}</div>
                    </div>
                  </td>
                  <td className="p-4 text-gray-600 text-sm">{f.location}</td>
                  <td className="p-4 text-gray-600 text-sm">{f.joinedDate || '2024-01-01'}</td>
                  <td className="p-4 font-medium text-gray-600 flex items-center gap-1">
                    <span className="text-yellow-500 fill-current"><FiStar size={14} /></span> {f.rating}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      f.status === 'Verified' ? 'bg-green-100 text-green-700' :
                      f.status === 'Pending' ? 'bg-orange-100 text-orange-700' :
                      f.status === 'Suspended' ? 'bg-red-100 text-red-700' :
                      'bg-gray-200 text-gray-800'
                    }`}>
                      {f.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {f.status === 'Pending' ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApprove(f.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-green-100 text-green-700 hover:bg-green-200 transition-colors flex items-center gap-1"
                        >
                          <FiCheck size={12} /> Approve
                        </button>
                        <button
                          onClick={() => handleReject(f.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-100 text-red-600 hover:bg-red-200 transition-colors flex items-center gap-1"
                        >
                          <FiX size={12} /> Reject
                        </button>
                      </div>
                    ) : f.status === 'Rejected' ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApprove(f.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                        >
                          Re-approve
                        </button>
                        <button
                          onClick={() => handleReject(f.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-100 text-red-600 hover:bg-red-200 transition-colors flex items-center gap-1"
                        >
                          <FiX size={12} /> Delete
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleStatus(f.id, f.status)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                            f.status === 'Verified' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'
                          }`}
                        >
                          {f.status === 'Verified' ? 'Suspend' : 'Restore'}
                        </button>
                        <button
                          onClick={() => handleReject(f.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-100 text-red-600 hover:bg-red-200 transition-colors flex items-center gap-1"
                        >
                          <FiX size={12} /> Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredFarmers.length === 0 && <div className="p-8 text-center text-gray-500">No farmers found matching your criteria.</div>}
        </div>
      </div>
    </div>
  );
}
