import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

const CustomerContext = createContext();

export function CustomerProvider({ children }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch customers from Supabase on mount
  useEffect(() => {
    async function fetchCustomers() {
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('*');

        if (error) throw error;

        if (data) {
          const formatted = data.map(c => ({
            id: c.id,
            fullName: c.full_name,
            phone: c.phone,
            location: c.location,
            email: c.email,
            password: c.password
          }));
          setCustomers(formatted);
        }
      } catch (err) {
        console.error('Error fetching customers from Supabase:', err);
        // Fallback: load from localStorage
        const saved = localStorage.getItem('uzhavar_customers');
        if (saved) {
          setCustomers(JSON.parse(saved));
        }
      } finally {
        setLoading(false);
      }
    }

    fetchCustomers();
  }, []);

  // Real-time listener for customers table changes
  useEffect(() => {
    const channel = supabase
      .channel('customers-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'customers' },
        (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;

          if (eventType === 'INSERT') {
            const formatted = {
              id: newRecord.id,
              fullName: newRecord.full_name,
              phone: newRecord.phone,
              location: newRecord.location,
              email: newRecord.email,
              password: newRecord.password
            };
            setCustomers(prev => {
              if (prev.some(c => c.id === formatted.id)) return prev;
              return [...prev, formatted];
            });
          } else if (eventType === 'UPDATE') {
            const formatted = {
              id: newRecord.id,
              fullName: newRecord.full_name,
              phone: newRecord.phone,
              location: newRecord.location,
              email: newRecord.email,
              password: newRecord.password
            };
            setCustomers(prev => prev.map(c => c.id === formatted.id ? formatted : c));
          } else if (eventType === 'DELETE') {
            setCustomers(prev => prev.filter(c => c.id !== oldRecord.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Save to localStorage as a fallback sync
  useEffect(() => {
    if (customers.length > 0) {
      localStorage.setItem('uzhavar_customers', JSON.stringify(customers));
    }
  }, [customers]);

  const addCustomer = async (customer) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([{
          full_name: customer.fullName,
          phone: customer.phone,
          location: customer.location,
          email: customer.email,
          password: customer.password
        }])
        .select();

      if (error) throw error;

      if (data && data[0]) {
        const formatted = {
          id: data[0].id,
          fullName: data[0].full_name,
          phone: data[0].phone,
          location: data[0].location,
          email: data[0].email,
          password: data[0].password
        };
        setCustomers(prev => [...prev, formatted]);
        return formatted;
      }
    } catch (err) {
      console.error('Error adding customer to Supabase:', err);
      // Fallback local update
      const tempCustomer = { ...customer, id: customer.id || Date.now() };
      setCustomers(prev => [...prev, tempCustomer]);
      return tempCustomer;
    }
  };

  const getCustomerByEmail = (email) => {
    return customers.find(c => c.email === email);
  };

  const updateCustomer = async (updatedCustomer) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .update({
          full_name: updatedCustomer.fullName,
          phone: updatedCustomer.phone,
          location: updatedCustomer.location,
          email: updatedCustomer.email,
          password: updatedCustomer.password
        })
        .eq('id', updatedCustomer.id)
        .select();

      if (error) throw error;

      if (data && data[0]) {
        const formatted = {
          id: data[0].id,
          fullName: data[0].full_name,
          phone: data[0].phone,
          location: data[0].location,
          email: data[0].email,
          password: data[0].password
        };
        setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? formatted : c));
      }
    } catch (err) {
      console.error('Error updating customer in Supabase:', err);
      setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
    }
  };

  return (
    <CustomerContext.Provider value={{ customers, loading, addCustomer, updateCustomer, getCustomerByEmail }}>
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomers() {
  return useContext(CustomerContext);
}
