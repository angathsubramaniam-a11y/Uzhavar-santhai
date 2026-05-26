import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

const FarmerContext = createContext();

export function FarmerProvider({ children }) {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch farmers from Supabase on mount
  useEffect(() => {
    async function fetchFarmers() {
      try {
        const { data, error } = await supabase
          .from('farmers')
          .select('*')
          .order('id', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          // Format keys to camelCase for frontend parity
          const formatted = data.map(f => ({
            id: f.id,
            name: f.name,
            farmName: f.farm_name,
            phone: f.phone,
            location: f.location,
            email: f.email,
            password: f.password,
            rating: Number(f.rating) || 0,
            status: f.status,
            joinedDate: f.joined_date ? f.joined_date.split('T')[0] : '',
            image: f.image,
            bankDetails: f.bank_details || null
          }));
          setFarmers(formatted);
        } else {
          throw new Error('Supabase returned 0 rows. Loading from local fallback.');
        }
      } catch (err) {
        console.error('Error fetching farmers from Supabase:', err);
        // Fallback: load from localStorage
        const saved = localStorage.getItem('uzhavar_farmers');
        if (saved) {
          setFarmers(JSON.parse(saved));
        }
      } finally {
        setLoading(false);
      }
    }

    fetchFarmers();
  }, []);

  // Save to localStorage as a fallback backup
  useEffect(() => {
    if (farmers.length > 0) {
      localStorage.setItem('uzhavar_farmers', JSON.stringify(farmers));
    }
  }, [farmers]);

  // Cross-tab synchronization via localStorage (offline real-time fallback)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'uzhavar_farmers' && e.newValue) {
        setFarmers(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Real-time listener for farmers table updates
  useEffect(() => {
    const channel = supabase
      .channel('farmers-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'farmers' },
        (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;

          if (eventType === 'INSERT') {
            const formatted = {
              id: newRecord.id,
              name: newRecord.name,
              farmName: newRecord.farm_name,
              phone: newRecord.phone,
              location: newRecord.location,
              email: newRecord.email,
              password: newRecord.password,
              rating: Number(newRecord.rating) || 0,
              status: newRecord.status,
              joinedDate: newRecord.joined_date ? newRecord.joined_date.split('T')[0] : '',
              image: newRecord.image,
              bankDetails: newRecord.bank_details || null
            };
            setFarmers(prev => {
              if (prev.some(f => f.id === formatted.id)) return prev;
              return [...prev, formatted];
            });
          } else if (eventType === 'UPDATE') {
            const formatted = {
              id: newRecord.id,
              name: newRecord.name,
              farmName: newRecord.farm_name,
              phone: newRecord.phone,
              location: newRecord.location,
              email: newRecord.email,
              password: newRecord.password,
              rating: Number(newRecord.rating) || 0,
              status: newRecord.status,
              joinedDate: newRecord.joined_date ? newRecord.joined_date.split('T')[0] : '',
              image: newRecord.image,
              bankDetails: newRecord.bank_details || null
            };
            setFarmers(prev => prev.map(f => f.id === formatted.id ? formatted : f));
          } else if (eventType === 'DELETE') {
            setFarmers(prev => prev.filter(f => f.id !== oldRecord.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addFarmer = async (newFarmer) => {
    // Optimistic local update
    const tempFarmer = { ...newFarmer, id: newFarmer.id || Date.now() };
    setFarmers(prev => [...prev, tempFarmer]);

    try {
      const { data, error } = await supabase
        .from('farmers')
        .insert([{
          name: newFarmer.name,
          farm_name: newFarmer.farmName,
          phone: newFarmer.phone,
          location: newFarmer.location,
          email: newFarmer.email,
          password: newFarmer.password || 'password123',
          rating: newFarmer.rating || 0.0,
          status: newFarmer.status || 'Pending',
          image: newFarmer.image,
          bank_details: newFarmer.bankDetails || null
        }])
        .select();

      if (error) throw error;
      
      if (data && data[0]) {
        const formatted = {
          id: data[0].id,
          name: data[0].name,
          farmName: data[0].farm_name,
          phone: data[0].phone,
          location: data[0].location,
          email: data[0].email,
          password: data[0].password,
          rating: Number(data[0].rating) || 0,
          status: data[0].status,
          joinedDate: data[0].joined_date ? data[0].joined_date.split('T')[0] : '',
          image: data[0].image,
          bankDetails: data[0].bank_details || null
        };
        // Replace optimistic temp farmer with real one
        setFarmers(prev => prev.map(f => f.id === tempFarmer.id ? formatted : f));
        return formatted;
      }
      return tempFarmer;
    } catch (err) {
      console.error('Error adding farmer to Supabase:', err);
      // Already in local state
      return tempFarmer;
    }
  };

  const getFarmerById = (id) => {
    return farmers.find(f => String(f.id) === String(id));
  };

  const updateFarmer = async (id, updatedData) => {
    try {
      // Map frontend camelCase to backend snake_case
      const dbUpdates = {};
      if (updatedData.name !== undefined) dbUpdates.name = updatedData.name;
      if (updatedData.farmName !== undefined) dbUpdates.farm_name = updatedData.farmName;
      if (updatedData.phone !== undefined) dbUpdates.phone = updatedData.phone;
      if (updatedData.location !== undefined) dbUpdates.location = updatedData.location;
      if (updatedData.email !== undefined) dbUpdates.email = updatedData.email;
      if (updatedData.password !== undefined) dbUpdates.password = updatedData.password;
      if (updatedData.rating !== undefined) dbUpdates.rating = updatedData.rating;
      if (updatedData.status !== undefined) dbUpdates.status = updatedData.status;
      if (updatedData.image !== undefined) dbUpdates.image = updatedData.image;
      if (updatedData.bankDetails !== undefined) dbUpdates.bank_details = updatedData.bankDetails;

      const { data, error } = await supabase
        .from('farmers')
        .update(dbUpdates)
        .eq('id', id)
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        const formatted = {
          id: data[0].id,
          name: data[0].name,
          farmName: data[0].farm_name,
          phone: data[0].phone,
          location: data[0].location,
          email: data[0].email,
          password: data[0].password,
          rating: Number(data[0].rating) || 0,
          status: data[0].status,
          joinedDate: data[0].joined_date ? data[0].joined_date.split('T')[0] : '',
          image: data[0].image,
          bankDetails: data[0].bank_details || null
        };
        setFarmers(prev => prev.map(f => String(f.id) === String(id) ? formatted : f));
      } else {
        throw new Error('Supabase returned 0 rows. Record might only exist in offline local storage.');
      }
    } catch (err) {
      console.error('Error updating farmer in Supabase:', err);
      // Fallback local update
      setFarmers(prev => prev.map(f => String(f.id) === String(id) ? { ...f, ...updatedData } : f));
    }
  };

  const deleteFarmer = async (id) => {
    try {
      const { error } = await supabase
        .from('farmers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setFarmers(prev => prev.filter(f => String(f.id) !== String(id)));
    } catch (err) {
      console.error('Error deleting farmer from Supabase:', err);
      // Fallback local update
      setFarmers(prev => prev.filter(f => String(f.id) !== String(id)));
    }
  };

  return (
    <FarmerContext.Provider value={{ farmers, loading, addFarmer, getFarmerById, updateFarmer, deleteFarmer }}>
      {children}
    </FarmerContext.Provider>
  );
}

export function useFarmers() {
  return useContext(FarmerContext);
}
