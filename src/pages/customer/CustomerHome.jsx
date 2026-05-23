import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiShoppingCart, FiUser, FiMapPin, FiStar, FiChevronDown, FiPlus, FiMinus, FiCheckCircle, FiArrowLeft, FiPackage, FiX } from 'react-icons/fi';
import { LuLeaf } from 'react-icons/lu';
import { GiSprout, GiFarmTractor } from 'react-icons/gi';
import { useCart } from '../../context/CartContext';
import { useProducts } from '../../context/ProductContext';
import { useFarmers } from '../../context/FarmerContext';
import { useAuth } from '../../context/AuthContext';
import { useCustomers } from '../../context/CustomerContext';
import { FiCamera } from 'react-icons/fi';
import CustomerBottomNav from '../../components/CustomerBottomNav';

export default function CustomerHome() {
  const navigate = useNavigate();
  const { cartCount, addToCart } = useCart();
  const { products, updateProduct } = useProducts();
  const { farmers, updateFarmer } = useFarmers();
  const { user, login } = useAuth();
  const { updateCustomer } = useCustomers();
  const [addingId, setAddingId] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [toast, setToast] = useState(null);
  const [selectedFarmerId, setSelectedFarmerId] = useState(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [tempLocation, setTempLocation] = useState(user?.location || 'Coimbatore, Tamil Nadu 641001');

  const handleSaveLocation = () => {
    if (!tempLocation.trim()) return;
    const updatedUser = { ...user, location: tempLocation };
    login(updatedUser);
    if (updatedUser.id) {
      updateCustomer(updatedUser);
    }
    setToast({ message: 'Delivery location updated!', type: 'success' });
    setTimeout(() => setToast(null), 2000);
    setIsLocationModalOpen(false);
  };

  const verifiedFarmerIds = useMemo(() => {
    return new Set((farmers || []).filter(f => f.status === 'Verified').map(f => String(f.id)));
  }, [farmers]);

  const verifiedFarmers = useMemo(() => {
    return (farmers || []).filter(f => f.status === 'Verified');
  }, [farmers]);

  const filteredProducts = useMemo(() => {
    const verifiedProducts = products.filter(p => verifiedFarmerIds.has(String(p.farmerId)));
    return selectedFarmerId
      ? verifiedProducts.filter(p => String(p.farmerId) === String(selectedFarmerId))
      : verifiedProducts;
  }, [products, selectedFarmerId, verifiedFarmerIds]);


  const handleQuantityChange = (productId, value) => {
    let val = parseInt(value);
    if (isNaN(val)) val = 10;
    if (val < 10) val = 10; // clamp minimum to 10
    setQuantities(prev => ({ ...prev, [productId]: val }));
  };

  const handleAddToCart = (product) => {
    const qty = quantities[product.id] === undefined ? 10 : quantities[product.id];
    const unit = product.unit?.toUpperCase() || 'KG';
    if (qty < 10) {
      setToast({ message: `Minimum order quantity is 10 ${unit}`, type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    setAddingId(product.id);
    addToCart(product, qty);
    setToast({ message: `${qty} ${unit} of ${product.name} added!`, type: 'success' });
    setTimeout(() => {
      setAddingId(null);
      setToast(null);
    }, 2000);
    setQuantities(prev => ({ ...prev, [product.id]: 10 }));
  };

  const scrollToProducts = () => {
    const section = document.getElementById('products-section');
    if (section) section.scrollIntoView({ behavior: 'smooth' });
  };

  const selectFarmer = (id) => {
    setSelectedFarmerId(id);
    setTimeout(scrollToProducts, 100);
  };

  return (
    <div className="min-h-screen bg-white pb-28 md:pb-20 font-sans relative">

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

      {/* Location Selector Modal */}
      <AnimatePresence>
        {isLocationModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-100 flex flex-col gap-4 relative"
            >
              <button
                onClick={() => setIsLocationModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <FiX size={20} />
              </button>

              <div className="flex items-center gap-3 text-primary mb-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xl">
                  <FiMapPin />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-lg">Delivery Location</h3>
                  <p className="text-xs text-gray-500">Update your current shipping address</p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Address details</label>
                <textarea
                  value={tempLocation}
                  onChange={(e) => setTempLocation(e.target.value)}
                  placeholder="Enter full address (e.g. Flat/House No, Street, City, Pincode)"
                  className="w-full border border-gray-200 rounded-2xl p-4 focus:ring-2 focus:ring-primary focus:outline-none text-sm font-medium text-gray-700 resize-none bg-gray-50 focus:bg-white transition-colors"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Quick Select Coimbatore Locations</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    'RS Puram, Coimbatore - 641002',
                    'Peelamedu, Coimbatore - 641004',
                    'Gandhipuram, Coimbatore - 641012',
                    'Saravanampatti, Coimbatore - 641035',
                    'Coimbatore central,- 641018',
                  ].map((loc) => (
                    <button
                      key={loc}
                      onClick={() => setTempLocation(loc)}
                      className="text-xs font-bold text-gray-600 bg-gray-100 hover:bg-primary hover:text-white px-3.5 py-2 rounded-xl transition-colors truncate max-w-full"
                    >
                      {loc.split(',')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSaveLocation}
                className="w-full py-4 mt-2 bg-primary text-white font-bold rounded-2xl hover:bg-primary-light transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] text-sm"
              >
                Update Delivery Location
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header - Swiggy Style */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-gray-500 hover:text-primary transition-colors bg-white shadow-sm p-2 rounded-full border border-gray-200" title="Back to Home">
              <FiArrowLeft size={20} />
            </Link>
            <Link to="/" className="flex items-center gap-2 hover:scale-105 transition-transform text-primary">
              <GiSprout size={32} />
            </Link>
            <div
              onClick={() => {
                setTempLocation(user?.location || 'Coimbatore, Tamil Nadu 641001');
                setIsLocationModalOpen(true);
              }}
              className="hidden sm:flex items-center gap-2 cursor-pointer group"
            >
              <div className="flex items-center gap-1 text-sm font-bold border-b-2 border-black group-hover:text-primary group-hover:border-primary transition-colors">
                <span>Other</span>
              </div>
              <span className="text-sm text-gray-500 truncate max-w-[200px]" title={user?.location || 'Coimbatore, Tamil Nadu 641001'}>
                {user?.location || 'Coimbatore, Tamil Nadu 641001'}
              </span>
              <FiChevronDown className="text-primary" />
            </div>
          </div>

          <div className="flex items-center gap-8">
            <Link to="/products" className="hidden md:flex items-center gap-2 text-gray-600 font-medium hover:text-primary cursor-pointer transition-colors">
              <FiSearch size={20} />
              <span>Search</span>
            </Link>
            <Link to="/customer/orders" className="hidden md:flex items-center gap-2 text-gray-600 font-medium hover:text-primary cursor-pointer transition-colors">
              <FiPackage size={20} />
              <span>My Orders</span>
            </Link>
            <Link to="/customer/profile" className="hidden md:flex items-center gap-2 text-gray-600 font-medium hover:text-primary cursor-pointer transition-colors">
              <FiUser size={20} />
              <span>Profile</span>
            </Link>
            <Link to="/customer/cart" className="flex items-center gap-2 text-gray-600 font-medium hover:text-primary transition-colors">
              <div className="relative">
                <FiShoppingCart size={20} />
                {cartCount > 0 && <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] font-bold rounded-sm w-4 h-4 flex items-center justify-center animate-bounce">{cartCount}</span>}
              </div>
              <span>Cart</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 pt-6 flex flex-col md:flex-row gap-8">

        {/* Left Sidebar - Farmer List (Hidden on mobile) */}
        <aside className="w-full md:w-64 flex-shrink-0 hidden md:block">
          <div className="sticky top-24">
            <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
              <span className="text-primary"><LuLeaf /></span> Our Farmers
            </h2>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setSelectedFarmerId(null)}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-sm ${selectedFarmerId === null ? 'bg-primary text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${selectedFarmerId === null ? 'bg-white/20' : 'bg-gray-100'}`}><GiFarmTractor /></div>
                All Farmers
              </button>
              {verifiedFarmers.map(farmer => (
                <div key={farmer.id} className="flex flex-col">
                  <button
                    onClick={() => setSelectedFarmerId(selectedFarmerId === farmer.id ? null : farmer.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left font-bold text-sm ${selectedFarmerId === farmer.id ? 'bg-primary text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <img src={farmer.image || 'https://images.unsplash.com/photo-1595841696677-6489ff3f8c8b?w=100&auto=format&fit=crop&fm=webp'} alt="" className="w-8 h-8 rounded-full object-cover border border-white/20 bg-gray-200" loading="lazy" decoding="async" onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/400x400/eeeeee/999999?text=No+Image"; }} />
                    <div className="truncate flex-1">
                      <div className={selectedFarmerId === farmer.id ? 'text-white' : 'text-gray-800'}>{farmer.farmName}</div>
                      <div className={`text-[10px] font-medium ${selectedFarmerId === farmer.id ? 'text-white/70' : 'text-gray-400'}`}>{farmer.name}</div>
                    </div>
                    <FiChevronDown className={`transition-transform ${selectedFarmerId === farmer.id ? 'rotate-180 text-white' : 'text-gray-400'}`} />
                  </button>
                  {selectedFarmerId === farmer.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="ml-4 mt-2 mb-2 p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-600 flex flex-col gap-2 overflow-hidden"
                    >
                      <p><strong>Location:</strong> {farmer.location}</p>
                      <p><strong>Rating:</strong> {farmer.rating} <FiStar className="inline text-sun fill-current" size={12} /></p>
                      <div className="mt-2">
                        <strong>Products:</strong>
                        <ul className="list-disc pl-4 mt-1 space-y-1">
                          {products.filter(p => String(p.farmerId) === String(farmer.id)).slice(0, 3).map(p => (
                            <li key={p.id} className="truncate">{p.name}</li>
                          ))}
                          {products.filter(p => String(p.farmerId) === String(farmer.id)).length > 3 && (
                            <li className="text-gray-400 italic">...and more</li>
                          )}
                          {products.filter(p => String(p.farmerId) === String(farmer.id)).length === 0 && (
                            <li className="text-gray-400 italic">No products listed</li>
                          )}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 bg-green-50 rounded-2xl border border-green-100">
              <p className="text-xs font-bold text-green-700 leading-relaxed">
                Supporting local farmers helps sustain traditional farming and ensures you get the freshest produce possible.
              </p>
            </div>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          {/* Mobile Farmer Horizontal Selector */}
          <div className="md:hidden mb-8 bg-gray-55/40 p-4 rounded-3xl border border-gray-100">
            <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-primary"><LuLeaf /></span> Our Farmers
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x">
              <button
                onClick={() => setSelectedFarmerId(null)}
                className="flex-shrink-0 flex flex-col items-center gap-2 snap-start focus:outline-none"
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl transition-all shadow-sm ${selectedFarmerId === null ? 'bg-primary text-white scale-105 ring-2 ring-primary ring-offset-2' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}><GiFarmTractor /></div>
                <span className={`text-[10px] font-black tracking-wider uppercase ${selectedFarmerId === null ? 'text-primary' : 'text-gray-500'}`}>All</span>
              </button>
              {verifiedFarmers.map(farmer => (
                <button
                  key={farmer.id}
                  onClick={() => setSelectedFarmerId(selectedFarmerId === farmer.id ? null : farmer.id)}
                  className="flex-shrink-0 flex flex-col items-center gap-2 snap-start focus:outline-none"
                >
                  <img src={farmer.image || 'https://images.unsplash.com/photo-1595841696677-6489ff3f8c8b?w=100&auto=format&fit=crop&fm=webp'} alt="" className={`w-14 h-14 rounded-full object-cover transition-all bg-gray-200 shadow-sm ${selectedFarmerId === farmer.id ? 'scale-105 ring-2 ring-primary ring-offset-2 border-transparent' : 'border border-gray-200'}`} />
                  <span className={`text-[10px] font-bold truncate max-w-[72px] text-center ${selectedFarmerId === farmer.id ? 'text-primary font-black' : 'text-gray-600'}`}>{farmer.farmName}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Categories - "What's on your mind?" */}
          <section className="mb-10">
            <h2 className="text-2xl font-black text-gray-900 mb-6 tracking-tight">What's on your mind?</h2>
            <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x">
              {['Fresh Veggies', 'Fruits', 'Dairy Daily'].map((cat, i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => window.location.href = '/products'}
                  className="flex-shrink-0 w-36 cursor-pointer snap-start group"
                >
                  <div className="w-36 h-36 rounded-full overflow-hidden mb-3 shadow-md group-hover:shadow-lg transition-shadow">
                    <img
                      src={`https://images.unsplash.com/photo-${(
                        i === 0 ? '1597362925123-77861d3fbac7' :
                          i === 1 ? '1610832958506-aa56368176cf' :
                            '1550583724-b2692b85b150'
                      )}?w=300&auto=format&fit=crop&fm=webp`}
                      alt={cat}
                      className="w-full h-full object-cover"
                      loading="lazy" decoding="async" onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/400x400/eeeeee/999999?text=No+Image"; }} />
                  </div>
                  <p className="text-center font-medium text-gray-700">{cat}</p>
                </motion.div>
              ))}
            </div>
            <hr className="my-8 border-gray-100" />
          </section>



          {/* Popular Products - Swiggy Item Style */}
          <section id="products-section" className="mb-20 scroll-mt-28">
            <div className="flex flex-col sm:flex-row justify-between items-baseline gap-4 mb-8">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                {selectedFarmerId
                  ? `Fresh harvest from ${farmers.find(f => f.id === selectedFarmerId)?.farmName}`
                  : "Fresh harvest for you"}
              </h2>
              {selectedFarmerId && (
                <button
                  onClick={() => setSelectedFarmerId(null)}
                  className="text-primary font-bold text-sm hover:underline"
                >
                  Show All Products
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {filteredProducts.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-6 p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors rounded-xl"
                >
                  <div className="flex-1 flex flex-col justify-center">
                    {product.isOrganic && (
                      <div className="flex items-center gap-1 text-green-600 text-xs font-bold mb-1">
                        <span className="border border-green-600 rounded-sm p-0.5"><FiStar size={10} className="fill-current" /></span> Bestseller
                      </div>
                    )}
                    <h3 className="font-bold text-gray-800 text-lg mb-1">{product.name}</h3>
                    <div className="font-medium text-gray-900 mb-2">₹{product.price}</div>
                    <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{product.description || `Freshly harvested ${product.name.toLowerCase()} direct from local farms. Handpicked for quality and taste.`}</p>
                  </div>

                  <div className="w-48 flex-shrink-0 flex flex-col justify-between group">
                    <div className="relative w-full h-40 mb-3 overflow-hidden rounded-2xl shadow-sm">
                      <img src={product.image || 'https://placehold.co/400x400/eeeeee/999999?text=No+Image'} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" decoding="async" onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/400x400/eeeeee/999999?text=No+Image"; }} />

                      {addingId === product.id && (
                        <div className="absolute inset-0 bg-green-500/20 backdrop-blur-sm flex items-center justify-center z-10 pointer-events-none">
                          <FiCheckCircle className="text-white w-10 h-10 animate-bounce" />
                        </div>
                      )}
                    </div>

                    <div className="bg-gray-50 p-2 rounded-xl border border-gray-100 flex flex-col gap-2">
                      <div className="flex items-center bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                        <button
                          onClick={() => handleQuantityChange(product.id, (quantities[product.id] === undefined ? 10 : quantities[product.id]) - 1)}
                          className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-red-500 transition-colors"
                        >
                          <FiMinus size={14} />
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={quantities[product.id] === undefined ? 10 : quantities[product.id]}
                          onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                          className="w-full text-center text-sm font-bold text-gray-800 focus:outline-none"
                        />
                        <div className="pr-1 text-[10px] font-bold text-gray-400">{product.unit?.toUpperCase() || 'KG'}</div>
                        <button
                          onClick={() => handleQuantityChange(product.id, (quantities[product.id] === undefined ? 10 : quantities[product.id]) + 1)}
                          className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-green-500 transition-colors border-l border-gray-100"
                        >
                          <FiPlus size={14} />
                        </button>
                      </div>

                      <button
                        onClick={() => handleAddToCart(product)}
                        className="w-full font-bold bg-white text-green-600 border border-gray-200 px-4 py-2 rounded-lg shadow-sm transition-all text-xs hover:bg-green-600 hover:text-white hover:border-green-600"
                      >
                        ADD TO CART
                      </button>
                      <div className="text-[10px] font-bold text-gray-500 text-center">
                        *Minimum 10 {product.unit?.toUpperCase() || 'KG'}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </div>
      </div>
      <CustomerBottomNav />
    </div>
  );
}
