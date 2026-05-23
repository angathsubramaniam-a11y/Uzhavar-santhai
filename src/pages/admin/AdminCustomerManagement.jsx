import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FiSearch } from 'react-icons/fi';
import { useCustomers } from '../../context/CustomerContext';
import { useOrders } from '../../context/OrdersContext';

export default function AdminCustomerManagement() {
  const { customers, loading: customersLoading } = useCustomers();
  const { orders } = useOrders();
  const [searchTerm, setSearchTerm] = useState('');

  const enrichedCustomers = useMemo(() => {
    return (customers || []).map(cust => {
      // Find orders for this customer
      const customerOrders = (orders || []).filter(o => String(o.customerId) === String(cust.id));
      const orderCount = customerOrders.length;
      const totalSpent = customerOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
      
      // Determine status dynamically
      let status = 'Inactive';
      if (orderCount >= 10) {
        status = 'VIP';
      } else if (orderCount > 0) {
        status = 'Active';
      }

      return {
        id: `CUST-${String(cust.id).padStart(3, '0')}`,
        name: cust.fullName || 'Unnamed Customer',
        email: cust.email || 'N/A',
        phone: cust.phone || 'N/A',
        orders: orderCount,
        totalSpent: `₹${totalSpent.toLocaleString()}`,
        status
      };
    });
  }, [customers, orders]);

  const filteredCustomers = useMemo(() => {
    return enrichedCustomers.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [enrichedCustomers, searchTerm]);

  if (customersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Customer Management</h2>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-3 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search Customers..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-xl bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary" 
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-600 border-b border-gray-100 text-sm">
                <th className="p-4 font-medium">Customer Details</th>
                <th className="p-4 font-medium">Contact Info</th>
                <th className="p-4 font-medium">Orders</th>
                <th className="p-4 font-medium">Total Spent</th>
                <th className="p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((cust) => (
                <tr key={cust.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                      {cust.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-gray-800">{cust.name}</div>
                      <div className="text-xs text-gray-500">{cust.id}</div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-gray-800">{cust.email}</div>
                    <div className="text-xs text-gray-500">{cust.phone}</div>
                  </td>
                  <td className="p-4 font-medium text-gray-600">{cust.orders}</td>
                  <td className="p-4 font-black text-gray-800">{cust.totalSpent}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${cust.status === 'VIP' ? 'bg-purple-100 text-purple-700' : cust.status === 'Active' ? 'bg-green-100 text-green-700' : cust.status === 'Suspended' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                      {cust.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredCustomers.length === 0 && <div className="p-8 text-center text-gray-500">No customers found.</div>}
        </div>
      </div>
    </div>
  );
}
