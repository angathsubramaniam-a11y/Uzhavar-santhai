import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FiSearch, FiFilter, FiShoppingCart } from 'react-icons/fi';
import { GiSprout } from 'react-icons/gi';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductContext';
import { useFarmers } from '../context/FarmerContext';
import { Link } from 'react-router-dom';
import CustomerBottomNav from '../components/CustomerBottomNav';

export default function ProductListingPage() {
  const { cartCount, addToCart } = useCart();
  const { products } = useProducts();
  const { farmers } = useFarmers();
  const [activeCategory, setActiveCategory] = useState('All Categories');
  const [priceRange, setPriceRange] = useState(1000);
  const [searchQuery, setSearchQuery] = useState('');

  const verifiedFarmerIds = useMemo(() => {
    return new Set((farmers || []).filter(f => f.status === 'Verified').map(f => String(f.id)));
  }, [farmers]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (activeCategory !== 'All Categories' && p.category !== activeCategory) return false;
      if (p.price > priceRange) return false;
      if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (!verifiedFarmerIds.has(String(p.farmerId))) return false;
      return true;
    });
  }, [products, activeCategory, priceRange, searchQuery, verifiedFarmerIds]);

  return (
    <div className="min-h-screen bg-cream pb-28 md:pb-0 font-sans relative">
      {/* ... header ... */}
      <header className="bg-white shadow-sm py-4 px-8 sticky top-0 z-50 flex justify-between items-center">
        <Link to="/" className="text-2xl font-black text-forest flex items-center gap-2 group">
          <span className="transition-transform group-hover:scale-110 text-primary"><GiSprout size={24} /></span> Uzhavar Sandhai
        </Link>
        <div className="flex items-center gap-6">
          <Link to="/customer/cart" className="flex items-center gap-2 text-earth hover:text-primary transition-colors relative">
            <FiShoppingCart size={24} />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] font-bold rounded-sm w-4 h-4 flex items-center justify-center animate-bounce">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fade-in flex flex-col md:flex-row gap-8">
        
        {/* Left Sidebar */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="sticky top-24">
            <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
              <FiFilter className="text-primary" /> Filters
            </h2>
            
            <div className="mb-8">
              <h3 className="font-bold text-gray-800 mb-4">Categories</h3>
              <div className="flex flex-col gap-2">
                {['All Categories', 'Vegetables', 'Fruits', 'Dairy'].map(cat => (
                  <button 
                    key={cat} 
                    onClick={() => setActiveCategory(cat)}
                    className={`text-left px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeCategory === cat ? 'bg-primary text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <h3 className="font-bold text-gray-800 mb-4">Price Range (up to ₹{priceRange})</h3>
              <input 
                type="range" 
                min="10" 
                max="1000" 
                value={priceRange} 
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className="w-full accent-primary" 
              />
              <div className="flex justify-between text-xs text-gray-500 font-bold mt-2">
                <span>₹10</span>
                <span>₹1000</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Explore Fresh Produce</h1>
            <div className="relative w-full md:w-64">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search vegetables..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-100 rounded-2xl bg-white shadow-sm focus:ring-2 focus:ring-primary outline-none" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product, i) => (
              <motion.div 
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 group flex flex-col transition-all duration-300"
              >
                <div className="relative h-48 overflow-hidden">
                  <img src={product.image || 'https://images.unsplash.com/photo-1595841696677-6489ff3f8c8b?w=400&auto=format&fit=crop&fm=webp'} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 bg-gray-100"  loading="lazy" decoding="async" onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x400/eeeeee/999999?text=No+Image"; }} />
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <span className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mb-1">{product.category}</span>
                  <h3 className="font-bold text-gray-800 text-lg mb-4 flex-1">{product.name}</h3>
                  <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 font-bold uppercase">Price</span>
                      <span className="font-black text-xl text-gray-900">₹{product.price}<span className="text-xs text-gray-500 font-normal">/{product.unit}</span></span>
                    </div>
                    <button onClick={() => addToCart(product)} className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-300 shadow-sm">
                      <FiShoppingCart size={20} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
      <CustomerBottomNav />
    </div>
  );
}
