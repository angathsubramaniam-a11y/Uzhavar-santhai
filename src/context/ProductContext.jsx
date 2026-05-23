import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

const ProductContext = createContext();

export function ProductProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch products from Supabase on mount
  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('id', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          const formatted = data.map(p => ({
            id: p.id,
            farmerId: p.farmer_id,
            farmerName: p.farmer_name,
            name: p.name,
            category: p.category,
            price: Number(p.price),
            unit: p.unit,
            stock: Number(p.stock),
            isOrganic: p.is_organic,
            image: p.image,
            description: p.description
          }));
          setProducts(formatted);
        } else {
          throw new Error('Supabase returned 0 rows. Loading from local fallback.');
        }
      } catch (err) {
        console.error('Error fetching products from Supabase:', err);
        // Fallback: load from localStorage
        const saved = localStorage.getItem('uzhavar_products');
        if (saved) {
          setProducts(JSON.parse(saved));
        }
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  // Save to localStorage as a fallback backup
  useEffect(() => {
    if (products.length > 0) {
      try {
        localStorage.setItem('uzhavar_products', JSON.stringify(products));
      } catch (e) {
        console.warn('Could not save products to localStorage (possibly quota exceeded):', e);
      }
    }
  }, [products]);

  // Cross-tab synchronization via localStorage (offline real-time fallback)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'uzhavar_products' && e.newValue) {
        setProducts(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);


  // Real-time listener for products table changes
  useEffect(() => {
    const channel = supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;

          if (eventType === 'INSERT') {
            const formatted = {
              id: newRecord.id,
              farmerId: newRecord.farmer_id,
              farmerName: newRecord.farmer_name,
              name: newRecord.name,
              category: newRecord.category,
              price: Number(newRecord.price),
              unit: newRecord.unit,
              stock: Number(newRecord.stock),
              isOrganic: newRecord.is_organic,
              image: newRecord.image,
              description: newRecord.description
            };
            setProducts(prev => {
              if (prev.some(p => p.id === formatted.id)) return prev;
              return [formatted, ...prev];
            });
          } else if (eventType === 'UPDATE') {
            const formatted = {
              id: newRecord.id,
              farmerId: newRecord.farmer_id,
              farmerName: newRecord.farmer_name,
              name: newRecord.name,
              category: newRecord.category,
              price: Number(newRecord.price),
              unit: newRecord.unit,
              stock: Number(newRecord.stock),
              isOrganic: newRecord.is_organic,
              image: newRecord.image,
              description: newRecord.description
            };
            setProducts(prev => prev.map(p => p.id === formatted.id ? formatted : p));
          } else if (eventType === 'DELETE') {
            setProducts(prev => prev.filter(p => p.id !== oldRecord.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addProduct = async (newProduct) => {
    // Optimistic local update
    const tempProduct = { ...newProduct, id: newProduct.id || Date.now() };
    setProducts(prev => [tempProduct, ...prev]);

    try {
      const insertPromise = supabase
        .from('products')
        .insert([{
          farmer_id: newProduct.farmerId,
          farmer_name: newProduct.farmerName,
          name: newProduct.name,
          category: newProduct.category,
          price: newProduct.price,
          unit: newProduct.unit,
          stock: newProduct.stock,
          is_organic: newProduct.isOrganic,
          image: newProduct.image,
          description: newProduct.description
        }])
        .select();

      // Add 5-second timeout
      const { data, error } = await Promise.race([
        insertPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Database timeout')), 5000))
      ]);

      if (error) throw error;

      if (data && data[0]) {
        const formatted = {
          id: data[0].id,
          farmerId: data[0].farmer_id,
          farmerName: data[0].farmer_name,
          name: data[0].name,
          category: data[0].category,
          price: Number(data[0].price),
          unit: data[0].unit,
          stock: Number(data[0].stock),
          isOrganic: data[0].is_organic,
          image: data[0].image,
          description: data[0].description
        };
        // Replace optimistic temp product with real one
        setProducts(prev => prev.map(p => p.id === tempProduct.id ? formatted : p));
        return formatted;
      }
    } catch (err) {
      console.error('Error adding product to Supabase or timeout:', err);
      // It's already in the local state, so we don't need to do anything else.
      return tempProduct;
    }
  };

  const deleteProduct = async (id) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Error deleting product from Supabase:', err);
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  const updateProduct = async (id, updatedData) => {
    try {
      // Map front-end camelCase parameters to snake_case db parameters
      const dbUpdates = {};
      if (updatedData.farmerId !== undefined) dbUpdates.farmer_id = updatedData.farmerId;
      if (updatedData.farmerName !== undefined) dbUpdates.farmer_name = updatedData.farmerName;
      if (updatedData.name !== undefined) dbUpdates.name = updatedData.name;
      if (updatedData.category !== undefined) dbUpdates.category = updatedData.category;
      if (updatedData.price !== undefined) dbUpdates.price = updatedData.price;
      if (updatedData.unit !== undefined) dbUpdates.unit = updatedData.unit;
      if (updatedData.stock !== undefined) dbUpdates.stock = updatedData.stock;
      if (updatedData.isOrganic !== undefined) dbUpdates.is_organic = updatedData.isOrganic;
      if (updatedData.image !== undefined) dbUpdates.image = updatedData.image;
      if (updatedData.description !== undefined) dbUpdates.description = updatedData.description;

      const { data, error } = await supabase
        .from('products')
        .update(dbUpdates)
        .eq('id', id)
        .select();

      if (error) throw error;

      if (data && data[0]) {
        const formatted = {
          id: data[0].id,
          farmerId: data[0].farmer_id,
          farmerName: data[0].farmer_name,
          name: data[0].name,
          category: data[0].category,
          price: Number(data[0].price),
          unit: data[0].unit,
          stock: Number(data[0].stock),
          isOrganic: data[0].is_organic,
          image: data[0].image,
          description: data[0].description
        };
        setProducts(prev => prev.map(p => p.id === id ? formatted : p));
      }
    } catch (err) {
      console.error('Error updating product in Supabase:', err);
      // Fallback local update
      setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updatedData } : p));
    }
  };

  const updateFarmerProducts = async (farmerId, farmerDetails) => {
    const farmName = farmerDetails.farmName || farmerDetails.name;
    try {
      const { error } = await supabase
        .from('products')
        .update({ farmer_name: farmName })
        .eq('farmer_id', farmerId);

      if (error) throw error;

      setProducts(prev => prev.map(p => String(p.farmerId) === String(farmerId) ? { 
        ...p, 
        farmerName: farmName,
        farmer: farmName
      } : p));
    } catch (err) {
      console.error('Error updating farmer products in Supabase:', err);
      setProducts(prev => prev.map(p => String(p.farmerId) === String(farmerId) ? { 
        ...p, 
        farmerName: farmName,
        farmer: farmName
      } : p));
    }
  };

  return (
    <ProductContext.Provider value={{ products, loading, addProduct, deleteProduct, updateProduct, updateFarmerProducts }}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  return useContext(ProductContext);
}
