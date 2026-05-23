import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiTrash2, FiMinus, FiPlus, FiCreditCard } from 'react-icons/fi';
import { LuShoppingCart } from 'react-icons/lu';
import { useCart } from '../../context/CartContext';
import CustomerBottomNav from '../../components/CustomerBottomNav';

export default function Cart() {
  const { cartItems, updateQuantity, removeFromCart, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const totalKg = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const delivery = cartTotal > 0 ? (totalKg > 50 ? 0 : 30) : 0;
  const platformFee = cartTotal > 0 ? 10 : 0;
  const total = cartTotal + delivery + platformFee;

  return (
    <div className="min-h-screen bg-cream pb-28 md:pb-20 relative">
      {/* ... header ... */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/customer/market" className="text-earth hover:text-primary">
            <FiArrowLeft size={24} />
          </Link>
          <h1 className="font-bold text-xl text-forest">Your Cart</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pt-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-4">
            {cartItems.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
                <div className="text-6xl mb-4 text-gray-300"><LuShoppingCart /></div>
                <h3 className="text-xl font-bold text-forest mb-2">Your cart is empty</h3>
                <p className="text-earth mb-6">Looks like you haven't added anything to your cart yet.</p>
                <Link to="/products" className="inline-block bg-primary text-white font-bold py-3 px-8 rounded-xl hover:bg-forest transition-colors">
                  Start Shopping
                </Link>
              </div>
            ) : (
              cartItems.map((item, i) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4 items-center"
                >
                  <img src={item.image || 'https://placehold.co/400x400/eeeeee/999999?text=No+Image'} alt={item.name} className="w-24 h-24 rounded-xl object-cover"  loading="lazy" decoding="async" onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x400/eeeeee/999999?text=No+Image"; }} />
                  <div className="flex-1">
                    <h3 className="font-bold text-forest text-lg">{item.name}</h3>
                    <div className="font-bold text-primary mb-2">₹{item.price} <span className="text-sm font-normal text-earth">/{item.unit}</span></div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3 bg-gray-55 rounded-lg p-1 border border-gray-200">
                        <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-white rounded-md text-earth"><FiMinus /></button>
                        <span className="font-medium w-6 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-white rounded-md text-earth"><FiPlus /></button>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-4 h-full justify-between">
                    <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 p-2"><FiTrash2 size={20} /></button>
                    <div className="font-bold text-lg text-forest">₹{item.price * item.quantity}</div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          <div className="w-full lg:w-96">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 sticky top-24"
            >
              <h2 className="text-xl font-bold text-forest mb-6">Order Summary</h2>
              <div className="space-y-4 text-earth">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-forest">₹{cartTotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee {totalKg > 50 && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded ml-1 font-bold">FREE</span>}</span>
                  <span className="font-medium text-forest">₹{delivery}</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Fee</span>
                  <span className="font-medium text-forest">₹{platformFee}</span>
                </div>
                <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
                  <span className="font-bold text-lg text-forest">Total</span>
                  <span className="font-bold text-2xl text-primary">₹{total}</span>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <button 
                  disabled={cartItems.length === 0}
                  onClick={() => navigate('/customer/checkout')}
                  className={`w-full py-4 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 ${cartItems.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:scale-[1.02]'}`}
                >
                  <FiCreditCard /> Checkout Now
                </button>
                <Link to="/products" className="block text-center w-full py-4 bg-gray-50 text-earth font-medium rounded-xl hover:bg-gray-100 transition-colors">
                  Continue Shopping
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
      <CustomerBottomNav />
    </div>
  );
}

