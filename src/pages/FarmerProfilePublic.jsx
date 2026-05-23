import { motion } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import { FiStar, FiMapPin, FiPhone, FiMail, FiCheckCircle, FiChevronLeft, FiPlus, FiMinus, FiShoppingCart, FiArrowLeft, FiShield } from 'react-icons/fi';
import { GiSprout } from 'react-icons/gi';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductContext';
import { useFarmers } from '../context/FarmerContext';

export default function FarmerProfilePublic() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { products } = useProducts();
  const { getFarmerById } = useFarmers();
  
  const farmerId = parseInt(id);
  const farmer = getFarmerById(id) || { name: 'Unknown Farmer', farmName: 'Private Farm', image: 'https://images.unsplash.com/photo-1595856728032-47d06634b070?w=500&auto=format&fit=crop&fm=webp', rating: 4.5, location: 'Tamil Nadu' };
  const farmerProducts = products.filter(p => p.farmerId === farmerId);

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <header className="bg-white shadow-sm py-4 px-8 sticky top-0 z-50 flex justify-between items-center">
        <Link to="/" className="text-2xl font-black text-forest flex items-center gap-2">
          <span className="text-primary"><GiSprout size={24} /></span> Uzhavar Sandhai
        </Link>
      </header>

      {/* Cover */}
      <div className="h-64 bg-forest relative w-full overflow-hidden">
        <img src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1200&auto=format&fit=crop&fm=webp" className="w-full h-full object-cover opacity-60 mix-blend-overlay" alt=""  loading="lazy" decoding="async" onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x400/eeeeee/999999?text=No+Image"; }} />
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-24 relative z-10 animate-fade-in">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-8 items-start">
          <img src={farmer.image || 'https://placehold.co/400x400/eeeeee/999999?text=No+Image'} alt={farmer.name} className="w-40 h-40 rounded-2xl object-cover shadow-lg border-4 border-white"  loading="lazy" decoding="async" onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x400/eeeeee/999999?text=No+Image"; }} />
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-black text-gray-900">{farmer.name}</h1>
                <p className="text-xl text-primary font-bold mt-1">{farmer.farmName}</p>
              </div>
              <div className="bg-green-100 text-green-700 px-4 py-2 rounded-xl flex items-center gap-2 font-bold">
                <FiStar className="fill-green-700" /> {farmer.rating} / 5.0
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-gray-500 mt-4 font-medium">
              <FiMapPin /> {farmer.location}
            </div>

            <div className="flex gap-4 mt-6">
              <span className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-bold"><FiShield /> Verified Farmer</span>
              <span className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-sm font-bold"><FiShield /> Fresh Produce</span>
            </div>
          </div>
        </div>

        <div className="mt-12 space-y-6">
          <h2 className="text-2xl font-black text-gray-900">Products from {farmer.farmName}</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {farmerProducts.map((product, i) => (
              <motion.div 
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 group flex flex-col"
              >
                <div className="relative h-48 overflow-hidden">
                  <img src={product.image || 'https://placehold.co/400x400/eeeeee/999999?text=No+Image'} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"  loading="lazy" decoding="async" onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x400/eeeeee/999999?text=No+Image"; }} />
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">{product.category}</span>
                  <h3 className="font-bold text-gray-800 text-lg mt-1 flex-1">{product.name}</h3>
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                    <div className="font-black text-xl text-gray-900">₹{product.price}<span className="text-xs text-gray-500 font-normal">/{product.unit}</span></div>
                    <button onClick={() => addToCart(product)} className="bg-primary text-white px-4 py-2 rounded-xl font-bold hover:bg-primary-light transition-colors text-sm shadow-md">
                      ADD
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
