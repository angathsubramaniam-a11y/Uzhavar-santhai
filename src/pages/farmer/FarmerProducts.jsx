import { useState } from 'react';
import { motion } from 'framer-motion';
import { useProducts } from '../../context/ProductContext';
import { useAuth } from '../../context/AuthContext';
import { FiGrid, FiList, FiEdit2, FiTrash2, FiSearch, FiFilter, FiAlertCircle, FiCamera, FiCheckCircle } from 'react-icons/fi';
import { AnimatePresence } from 'framer-motion';

export default function FarmerProducts() {
  const { products, addProduct, deleteProduct, updateProduct } = useProducts();
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [newProductImage, setNewProductImage] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [toast, setToast] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');

  const farmerId = user?.id;
  const ownedProducts = products.filter(p => String(p.farmerId) === String(farmerId));
  const localProducts = ownedProducts.filter(p => {
    const matchCategory = selectedCategory === 'All Categories' || p.category === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      deleteProduct(id);
    }
  };

  const openEditModal = (product) => {
    setEditProduct({ ...product });
    setShowEditModal(true);
  };

  const handleEdit = (e) => {
    e.preventDefault();
    updateProduct(editProduct.id, {
      name: e.target.name.value,
      category: e.target.category.value,
      price: parseFloat(e.target.price.value),
      unit: e.target.unit.value,
      stock: parseInt(e.target.stock.value),
      description: e.target.description.value,
      image: editProduct.image,
    });
    setShowEditModal(false);
    setEditProduct(null);
    setToast({ message: 'Product updated successfully!', type: 'success' });
    setTimeout(() => setToast(null), 3000);
  };

  const compressImage = (file, callback) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const scale = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        callback(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleProductImageUpload = (e, productId) => {
    const file = e.target.files[0];
    if (file) {
      compressImage(file, (compressedDataUrl) => {
        updateProduct(productId, { image: compressedDataUrl });
      });
    }
  };

  const handleAdd = (e) => {
    e.preventDefault();
    const newProduct = {
      id: Date.now(),
      farmerId: farmerId,
      farmerName: user?.farmName || "Unnamed Farm",
      name: e.target.name.value,
      category: e.target.category.value,
      price: parseFloat(e.target.price.value),
      unit: e.target.unit.value,
      stock: parseInt(e.target.stock.value),
      description: e.target.description.value,
      isOrganic: true, // Defaulting to organic for this farm
      image: newProductImage || "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&fm=webp"
    };
    addProduct(newProduct);
    setShowModal(false);
    setNewProductImage(null);
    setToast({ message: 'New product published!', type: 'success' });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 right-8 z-[100] bg-primary text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 font-bold">
            <FiCheckCircle /> {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Inventory Management</h2>
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-lg p-1 border border-gray-200 flex">
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-gray-100 text-primary' : 'text-gray-400'}`}><FiList /></button>
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-gray-100 text-primary' : 'text-gray-400'}`}><FiGrid /></button>
          </div>
          <button onClick={() => { setShowModal(true); setNewProductImage(null); }} className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold shadow-md hover:bg-primary-light transition-colors">
            + Add Product
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-3 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search products..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-xl bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary" 
          />
        </div>
        <div className="flex gap-4">
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border rounded-xl px-4 py-2 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="All Categories">All Categories</option>
            <option value="Vegetables">Vegetables</option>
            <option value="Fruits">Fruits</option>
            <option value="Dairy">Dairy</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 border rounded-xl text-gray-600 hover:bg-gray-50">
            <FiFilter /> Filter
          </button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'list' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-gray-50 text-gray-600 border-b border-gray-100 text-sm">
                  <th className="p-4 font-medium">Product Name</th>
                  <th className="p-4 font-medium">Category</th>
                  <th className="p-4 font-medium">Price</th>
                  <th className="p-4 font-medium">Stock Level</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {localProducts.map(p => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 flex items-center gap-3">
                      <div className="relative group/image overflow-hidden rounded-xl w-12 h-12 flex-shrink-0 cursor-pointer">
                        <img src={p.image || 'https://placehold.co/400x400/eeeeee/999999?text=No+Image'} alt={p.name} className="w-full h-full object-cover"  loading="lazy" decoding="async" onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x400/eeeeee/999999?text=No+Image"; }} />
                        <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity cursor-pointer z-10">
                          <FiCamera className="text-white w-4 h-4" />
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => handleProductImageUpload(e, p.id)} 
                          />
                        </label>
                      </div>
                      <div>
                        <div className="font-bold text-gray-800">{p.name}</div>
                        {p.isOrganic && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">ORGANIC</span>}
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">{p.category}</td>
                    <td className="p-4 text-gray-900 font-bold">₹{p.price}<span className="text-gray-500 font-normal text-sm">/{p.unit}</span></td>
                    <td className="p-4">
                      {p.stock < 10 ? (
                        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max">
                          <FiAlertCircle /> {p.stock} {p.unit}
                        </span>
                      ) : (
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold w-max inline-block">
                          {p.stock} {p.unit}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-3">
                      <button onClick={() => openEditModal(p)} className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition-colors"><FiEdit2 size={18} /></button>
                      <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"><FiTrash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {localProducts.length === 0 && <div className="p-8 text-center text-gray-500">No products found.</div>}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {localProducts.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group">
              <div className="relative h-48 group/image cursor-pointer">
                <img src={p.image || 'https://placehold.co/400x400/eeeeee/999999?text=No+Image'} alt={p.name} className="w-full h-full object-cover group-hover/image:scale-105 transition-transform"  loading="lazy" decoding="async" onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x400/eeeeee/999999?text=No+Image"; }} />
                <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity cursor-pointer z-20">
                  <FiCamera className="text-white w-8 h-8 mb-1 drop-shadow-md" />
                  <span className="text-white text-[10px] font-bold uppercase tracking-wider">Change Image</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => handleProductImageUpload(e, p.id)} 
                  />
                </label>
                {p.stock < 10 && <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md z-30">Low Stock: {p.stock}</div>}
              </div>
              <div className="p-4">
                <div className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wider">{p.category}</div>
                <h3 className="font-bold text-gray-800 text-lg">{p.name}</h3>
                <div className="font-black text-gray-900 mt-2">₹{p.price}<span className="text-sm text-gray-500 font-normal">/{p.unit}</span></div>
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                  <button onClick={() => openEditModal(p)} className="flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-700"><FiEdit2 /> Edit</button>
                  <button onClick={() => handleDelete(p.id)} className="flex items-center gap-1 text-sm font-bold text-red-600 hover:text-red-700"><FiTrash2 /> Delete</button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-8 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-black text-gray-800 mb-6">Add New Product</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Product Name</label>
                <input name="name" required className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                <select name="category" className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-primary outline-none">
                  <option value="Vegetables">Vegetables</option>
                  <option value="Fruits">Fruits</option>
                  <option value="Dairy">Dairy</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Price (₹)</label>
                  <input name="price" type="number" required className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Unit</label>
                  <input name="unit" placeholder="kg, bunch, piece" required className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Initial Stock Quantity</label>
                <input name="stock" type="number" required className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                <textarea name="description" rows="3" className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50"></textarea>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Product Image</label>
                <div className="flex items-center gap-4">
                  {newProductImage ? (
                    <img src={newProductImage} alt="Preview" className="w-16 h-16 rounded-xl object-cover border border-gray-200" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400">
                      <FiCamera size={24} />
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      compressImage(file, (compressed) => setNewProductImage(compressed));
                    }
                  }} className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                </div>
              </div>
              <div className="flex gap-4 mt-8">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-3.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/30 hover:bg-primary-light transition-colors">Publish Product</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editProduct && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-8 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-black text-gray-800 mb-1">Edit Product</h3>
            <p className="text-sm text-gray-400 mb-6">Update the details for <span className="font-bold text-primary">{editProduct.name}</span></p>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Product Name</label>
                <input name="name" required defaultValue={editProduct.name} className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                <select name="category" defaultValue={editProduct.category} className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-primary outline-none">
                  <option value="Vegetables">Vegetables</option>
                  <option value="Fruits">Fruits</option>
                  <option value="Dairy">Dairy</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Price (₹)</label>
                  <input name="price" type="number" required defaultValue={editProduct.price} className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Unit</label>
                  <input name="unit" required defaultValue={editProduct.unit} className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Stock Quantity</label>
                <input name="stock" type="number" required defaultValue={editProduct.stock} className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                <textarea name="description" rows="3" defaultValue={editProduct.description} className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-primary"></textarea>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Product Image</label>
                <div className="flex items-center gap-4">
                  <img src={editProduct.image || 'https://placehold.co/400x400/eeeeee/999999?text=No+Image'} alt="Preview" className="w-16 h-16 rounded-xl object-cover border border-gray-200" />
                  <input type="file" accept="image/*" onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      compressImage(file, (compressed) => setEditProduct(prev => ({ ...prev, image: compressed })));
                    }
                  }} className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100" />
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <button type="button" onClick={() => { setShowEditModal(false); setEditProduct(null); }} className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-3.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-colors">Save Changes</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
