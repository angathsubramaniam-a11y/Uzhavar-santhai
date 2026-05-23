import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiSearch, FiShoppingCart, FiFilter, FiArrowLeft, FiPlus, FiMinus, FiTrash2, FiCheckCircle, FiStar } from 'react-icons/fi';
import { GiBroccoli, GiMilkCarton, GiPlantSeed } from 'react-icons/gi';
import { LuApple, LuMilk, LuWheat, LuSprout, LuShoppingCart } from 'react-icons/lu';
import { useCart } from '../../context/CartContext';
import { useProducts } from '../../context/ProductContext';
import { useFarmers } from '../../context/FarmerContext';
import CustomerBottomNav from '../../components/CustomerBottomNav';

const CATEGORIES = [
  { id: 'all', name: 'All Products', icon: <LuShoppingCart />, image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&auto=format&fit=crop&fm=webp' },
  { id: 'Vegetables', name: 'Vegetables', icon: <GiBroccoli />, image: 'https://images.unsplash.com/photo-1566385101027-46fae4eb2451?w=300&auto=format&fit=crop&fm=webp' },
  { id: 'Fruits', name: 'Fruits', icon: <LuApple />, image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=300&auto=format&fit=crop&fm=webp' },
  { id: 'Dairy', name: 'Dairy Products', icon: <LuMilk />, image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&auto=format&fit=crop&fm=webp' }
];

export default function CustomerProducts() {
  const { cartItems, addToCart, removeFromCart, updateQuantity, setExactQuantity } = useCart();
  const { products } = useProducts();
  const { farmers } = useFarmers();
  
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    // Simulate loading skeletons
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleQuantityChange = (productId, value) => {
    let val = parseInt(value);
    if (isNaN(val)) val = 10;
    if (val < 10) val = 10; // clamp minimum to 10
    setQuantities(prev => ({ ...prev, [productId]: val }));
  };

  const handleAddToCart = (product) => {
    const qty = quantities[product.id] === undefined ? 10 : quantities[product.id];
    if (qty < 10) {
      setToast({ message: 'Minimum order quantity is 10 KG', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    addToCart(product, qty);
    setToast({ message: `${product.name} added to cart!`, type: 'success' });
    setTimeout(() => setToast(null), 3000);
    // Reset local quantity input
    setQuantities(prev => ({ ...prev, [product.id]: 10 }));
  };

  const verifiedFarmerIds = useMemo(() => {
    return new Set((farmers || []).filter(f => f.status === 'Verified').map(f => String(f.id)));
  }, [farmers]);

  // Filter and Sort Logic
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCategory = activeCategory === 'all' || p.category === activeCategory;
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchVerifiedFarmer = verifiedFarmerIds.has(String(p.farmerId));
      return matchCategory && matchSearch && matchVerifiedFarmer;
    }).sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      return 0; // Default popular/new
    });
  }, [products, activeCategory, searchQuery, sortBy, verifiedFarmerIds]);

  // Smart Pricing Logic for Cart Sidebar
  const totalKg = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const rawTotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  let discountPercent = 0;
  if (totalKg >= 25 && totalKg <= 50) discountPercent = 0.05;
  if (totalKg > 50) discountPercent = 0.10;
  
  const discountAmount = rawTotal * discountPercent;
  const deliveryCharge = totalKg > 0 ? (totalKg > 50 ? 0 : 30) : 0; // Free delivery over 50kg
  const finalPrice = rawTotal - discountAmount + deliveryCharge;

  return (
    <div className="min-h-screen bg-gray-50 pb-28 md:pb-20 font-sans relative">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full font-bold shadow-xl flex items-center gap-3 ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}
          >
            {toast.type === 'success' && <FiCheckCircle size={20} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-40 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/customer/market" className="text-gray-500 hover:text-primary transition-colors bg-gray-100 p-2 rounded-full">
              <FiArrowLeft size={20} />
            </Link>
            <h1 className="font-black text-2xl text-gray-800 tracking-tight">Wholesale Market</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex relative">
              <input 
                type="text" 
                placeholder="Search products..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-gray-50"
              />
              <FiSearch className="absolute left-4 top-2.5 text-gray-400" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 pt-8 flex flex-col lg:flex-row gap-8">
        
        {/* Left Content Area (Categories & Products) */}
        <div className="flex-1 space-y-10">
          
          {/* Categories Section */}
          <section>
            <div className="flex justify-between items-end mb-6">
              <h2 className="text-xl font-black text-gray-800 tracking-tight">Categories</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {CATEGORIES.map(cat => (
                <motion.div 
                  key={cat.id}
                  whileHover={{ scale: 1.03, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`relative h-32 rounded-2xl overflow-hidden cursor-pointer shadow-sm group ${activeCategory === cat.id ? 'ring-4 ring-primary ring-offset-2' : ''}`}
                >
                  <img src={cat.image || 'https://placehold.co/400x400/eeeeee/999999?text=No+Image'} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"  loading="lazy" decoding="async" onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x400/eeeeee/999999?text=No+Image"; }} />
                  <div className={`absolute inset-0 bg-gradient-to-t ${activeCategory === cat.id ? 'from-primary/90 to-black/20' : 'from-black/80 to-transparent group-hover:from-primary/80'} transition-colors duration-300`}></div>
                  <div className="absolute bottom-3 left-3 text-white">
                    <div className="text-2xl mb-1 drop-shadow-md">{cat.icon}</div>
                    <div className="font-bold text-sm tracking-wide drop-shadow-md">{cat.name}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Filters & Sorting */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="text-gray-500 font-medium">Showing {filteredProducts.length} products</div>
            <div className="flex gap-3 w-full sm:w-auto">
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 sm:flex-none bg-gray-50 border border-gray-200 text-gray-700 rounded-xl px-4 py-2 font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="popular">Popularity</option>
                <option value="new">New Arrivals</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
              <button className="bg-gray-50 border border-gray-200 text-gray-700 p-2.5 rounded-xl hover:bg-gray-100 transition-colors">
                <FiFilter size={20} />
              </button>
            </div>
          </div>

          {/* Product Grid */}
          <section>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {loading ? (
                /* Loading Skeletons */
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm animate-pulse">
                    <div className="w-full h-48 bg-gray-200 rounded-2xl mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded-md w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded-md w-1/2 mb-4"></div>
                    <div className="flex justify-between mt-6">
                      <div className="h-8 bg-gray-200 rounded-md w-1/3"></div>
                      <div className="h-8 bg-gray-200 rounded-md w-1/3"></div>
                    </div>
                  </div>
                ))
              ) : (
                filteredProducts.map((product) => (
                  <div key={product.id} className="bg-white/80 backdrop-blur-xl rounded-3xl p-4 border border-white shadow-[0_4px_20px_rgb(0,0,0,0.04)] hover:shadow-xl transition-all duration-300 group flex flex-col relative overflow-hidden">
                    <div className="absolute top-6 left-6 z-10 bg-green-500/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                      {product.stock} {product.unit?.toUpperCase() || 'KG'} In Stock
                    </div>
                    
                    <div className="w-full h-48 rounded-2xl overflow-hidden mb-4 relative">
                      <img src={product.image || 'https://placehold.co/400x400/eeeeee/999999?text=No+Image'} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"  loading="lazy" decoding="async" onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x400/eeeeee/999999?text=No+Image"; }} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                    
                    <div className="flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-black text-gray-800 text-lg tracking-tight">{product.name}</h3>
                        <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded-lg text-xs font-bold">
                          <FiStar size={12} className="fill-current" /> 4.8
                        </div>
                      </div>
                      <div className="text-sm font-medium text-primary mb-3">{product.farmer || 'Uzhavar Verified Farm'}</div>
                      
                      <div className="flex items-end gap-2 mb-6">
                        <span className="text-2xl font-black text-gray-800">₹{product.price}</span>
                        <span className="text-gray-500 font-medium mb-1">/ {product.unit?.toUpperCase() || 'KG'}</span>
                      </div>

                      <div className="mt-auto bg-gray-50 p-3 rounded-2xl border border-gray-100">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex-1">
                            <button 
                              onClick={() => handleQuantityChange(product.id, (quantities[product.id] === undefined ? 10 : quantities[product.id]) - 1)}
                              className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-red-500 transition-colors"
                            >
                              <FiMinus />
                            </button>
                            <input 
                              type="number" 
                              min="0"
                              value={quantities[product.id] === undefined ? 10 : quantities[product.id]}
                              onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                              className="w-full text-center font-bold text-gray-800 focus:outline-none"
                            />
                            <div className="pr-2 text-xs font-bold text-gray-400">{product.unit?.toUpperCase() || 'KG'}</div>
                            <button 
                              onClick={() => handleQuantityChange(product.id, (quantities[product.id] === undefined ? 10 : quantities[product.id]) + 1)}
                              className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-green-500 transition-colors border-l border-gray-100"
                            >
                              <FiPlus />
                            </button>
                          </div>
                          
                          <button 
                            onClick={() => handleAddToCart(product)}
                            className="bg-primary text-white h-10 px-4 rounded-xl font-bold shadow-sm hover:bg-primary-light hover:-translate-y-0.5 transition-all flex items-center gap-2 flex-shrink-0"
                          >
                            Add
                          </button>
                        </div>
                        <div className="text-[10px] font-bold text-gray-500 mt-2 text-center">
                          *Minimum 10 {product.unit?.toUpperCase() || 'KG'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {!loading && filteredProducts.length === 0 && (
              <div className="text-center py-20 text-gray-400 font-bold text-xl">
                No products found matching your search.
              </div>
            )}
          </section>
        </div>

        {/* Right Sidebar - Sticky Cart */}
        <aside className="w-full lg:w-96 flex-shrink-0">
          <div className="sticky top-24 bg-white/80 backdrop-blur-xl rounded-[2rem] p-6 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex flex-col max-h-[calc(100vh-120px)]">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-primary/10 p-3 rounded-2xl text-primary">
                <FiShoppingCart size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-800 tracking-tight">Wholesale Cart</h2>
                <div className="text-sm font-medium text-gray-500">{cartItems.length} Items Selected</div>
              </div>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar mb-6">
              {cartItems.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center text-gray-400 space-y-3">
                  <div className="text-5xl opacity-50"><LuShoppingCart /></div>
                  <div className="font-bold">Your cart is empty</div>
                  <div className="text-xs text-center px-4">Add bulk items (min 10 units) to see smart pricing discounts!</div>
                </div>
              ) : (
                cartItems.map(item => (
                  <div key={item.id} className="flex gap-4 p-3 bg-gray-50 rounded-2xl border border-gray-100 group relative">
                    <img src={item.image || 'https://placehold.co/400x400/eeeeee/999999?text=No+Image'} alt={item.name} className="w-16 h-16 rounded-xl object-cover"  loading="lazy" decoding="async" onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x400/eeeeee/999999?text=No+Image"; }} />
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="font-bold text-gray-800 text-sm leading-tight mb-1 pr-6">{item.name}</div>
                      <div className="text-xs font-medium text-primary mb-2">₹{item.price} / {item.unit?.toUpperCase() || 'KG'}</div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 bg-white border border-gray-200 rounded flex items-center justify-center text-gray-500 hover:text-red-500">-</button>
                        <span className="text-xs font-bold w-12 text-center">{item.quantity} {item.unit?.toUpperCase() || 'KG'}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 bg-white border border-gray-200 rounded flex items-center justify-center text-gray-500 hover:text-green-500">+</button>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors bg-white rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100"
                    >
                      <FiTrash2 size={14} />
                    </button>
                    <div className="absolute bottom-3 right-3 font-black text-gray-800">
                      ₹{item.price * item.quantity}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Smart Pricing Summary */}
            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-3 relative overflow-hidden">
              {discountPercent > 0 && (
                <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl shadow-sm">
                  Bulk Discount Applied!
                </div>
              )}
              
              <div className="flex justify-between text-sm font-medium text-gray-600">
                <span>Total Quantity</span>
                <span className="font-bold text-gray-800">{totalKg} Units</span>
              </div>
              <div className="flex justify-between text-sm font-medium text-gray-600">
                <span>Subtotal</span>
                <span className="font-bold text-gray-800">₹{rawTotal.toFixed(2)}</span>
              </div>
              
              {discountPercent > 0 && (
                <div className="flex justify-between text-sm font-bold text-green-600">
                  <span>Bulk Discount ({(discountPercent * 100)}%)</span>
                  <span>- ₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between text-sm font-medium text-gray-600">
                <span>Delivery Charge {totalKg > 50 && <span className="text-xs bg-green-100 text-green-700 px-1 py-0.5 rounded ml-1 font-bold">FREE</span>}</span>
                <span className="font-bold text-gray-800">₹{deliveryCharge.toFixed(2)}</span>
              </div>
              
              <div className="pt-3 border-t border-gray-200 flex justify-between items-end">
                <span className="text-gray-500 font-bold uppercase tracking-wider text-xs">Total Amount</span>
                <span className="text-2xl font-black text-primary">₹{finalPrice.toFixed(2)}</span>
              </div>
            </div>

            <button 
              disabled={cartItems.length === 0}
              className={`w-full py-4 rounded-xl font-black text-lg mt-4 transition-all shadow-md ${cartItems.length === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-primary text-white hover:bg-primary-light hover:shadow-lg hover:-translate-y-0.5'}`}
            >
              Proceed to Checkout
            </button>
          </div>
        </aside>

      </main>
      <CustomerBottomNav />
    </div>
  );
}
