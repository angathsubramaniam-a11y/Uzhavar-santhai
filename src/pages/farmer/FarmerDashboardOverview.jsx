import { motion } from 'framer-motion';
import { FiPackage, FiDollarSign, FiShoppingCart, FiClock, FiAlertCircle } from 'react-icons/fi';
import { useProducts } from '../../context/ProductContext';
import { useOrders, getQtyNumber } from '../../context/OrdersContext';
import { useAuth } from '../../context/AuthContext';

export default function FarmerDashboardOverview() {
  const { products } = useProducts();
  const { orders } = useOrders();
  const { user } = useAuth();
  
  const farmerId = user?.id;
  const farmerProducts = products.filter(p => String(p.farmerId) === String(farmerId));
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
  
  const totalRevenue = farmerOrders.reduce((acc, o) => {
    const breakdown = getFarmerSalesBreakdown(o, farmerId);
    return acc + breakdown.netSales;
  }, 0);
  
  const pendingOrders = farmerOrders.filter(o => o.status === 'Pending').length;
  const lowStock = farmerProducts.filter(p => p.stock < 10).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
      
      {/* 5 Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Products', value: farmerProducts.length, icon: <FiPackage />, color: 'text-blue-600 bg-blue-100' },
          { label: 'Total Revenue', value: `₹${totalRevenue.toFixed(2)}`, icon: <FiDollarSign />, color: 'text-green-600 bg-green-100' },
          { label: 'Total Orders', value: farmerOrders.length, icon: <FiShoppingCart />, color: 'text-purple-600 bg-purple-100' },
          { label: 'Pending', value: pendingOrders, icon: <FiClock />, color: 'text-orange-600 bg-orange-100' },
          { label: 'Low Stock', value: lowStock, icon: <FiAlertCircle />, color: 'text-red-600 bg-red-100' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            whileHover={{ scale: 1.03 }}
            className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center"
          >
            <div className={`w-12 h-12 rounded-full ${stat.color} flex items-center justify-center mb-3 text-xl`}>
              {stat.icon}
            </div>
            <div className="text-2xl font-black text-gray-800 mb-1">{stat.value}</div>
            <div className="text-sm font-medium text-gray-500">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-800">Recent Orders</h3>
          <button className="text-primary text-sm font-medium hover:underline">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-500 text-sm border-b">
                <th className="pb-3 font-medium">Order ID</th>
                <th className="pb-3 font-medium">Customer</th>
                <th className="pb-3 font-medium">Amount</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {farmerOrders.slice(0, 5).map((order, i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-3 font-medium text-gray-800">{order.id}</td>
                  <td className="py-3 text-gray-600">{order.customer || order.customerName || 'Customer'}</td>
                  <td className="py-3 font-bold text-gray-800">
                    ₹{getFarmerSalesBreakdown(order, farmerId).netSales.toFixed(2)}
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      order.status === 'Pending' ? 'bg-orange-100 text-orange-700' :
                      order.status === 'Shipped' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>{order.status}</span>
                  </td>
                </tr>
              ))}
              {farmerOrders.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-gray-400">No recent orders</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
