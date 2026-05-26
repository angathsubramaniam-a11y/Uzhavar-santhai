 
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

const OrdersContext = createContext();

const defaultPayouts = {
  farmers: [],
  riders: []
};

export const getQtyNumber = (item) => {
  if (!item) return 0;
  if (typeof item.quantity === 'number') return item.quantity;
  if (typeof item.quantity === 'string') {
    const parsed = parseFloat(item.quantity);
    if (!isNaN(parsed)) return parsed;
  }
  if (item.qty) {
    const parsed = parseFloat(item.qty);
    if (!isNaN(parsed)) return parsed;
  }
  return 1;
};

export const OrdersProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [payouts, setPayouts] = useState(defaultPayouts);
  const [loading, setLoading] = useState(true);
  const [dbConnected, setDbConnected] = useState(null); // null = checking, true = connected, false = disconnected/offline fallback

  const [activeRequest, setActiveRequest] = useState(() => {
    const saved = localStorage.getItem('uzhavar_active_request');
    return saved ? JSON.parse(saved) : null;
  });

  // Persist activeRequest locally for safety on page loads
  useEffect(() => {
    localStorage.setItem('uzhavar_active_request', JSON.stringify(activeRequest));
  }, [activeRequest]);

  // Fetch initial data from Supabase
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // 1. Fetch Orders
        const { data: ordersData, error: ordersErr } = await supabase
          .from('orders')
          .select('*')
          .order('id', { ascending: false });
        if (ordersErr) throw ordersErr;

        // 2. Fetch Riders
        const { data: ridersData, error: ridersErr } = await supabase
          .from('riders')
          .select('*')
          .order('id', { ascending: true });
        if (ridersErr) throw ridersErr;

        // 3. Fetch Payouts
        const { data: payoutsData, error: payoutsErr } = await supabase
          .from('payouts')
          .select('*')
          .order('created_at', { ascending: false });
        if (payoutsErr) throw payoutsErr;

        // Fetch Customers to build customer lookup map
        const { data: customersData, error: customersErr } = await supabase
          .from('customers')
          .select('id, full_name');
        
        const customerMap = {};
        if (!customersErr && customersData) {
          customersData.forEach(c => {
            customerMap[c.id] = c.full_name;
          });
        }

        // Process Orders
        if (ordersData && ordersData.length > 0) {
          const formattedOrders = ordersData.map(o => {
            const parsedDeliveryInfo = typeof o.delivery_info === 'string' ? JSON.parse(o.delivery_info) : (o.delivery_info || {});
            return {
              id: o.id,
              customerId: o.customer_id,
              farmerId: o.farmer_id,
              status: o.status,
              items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items,
              total: Number(o.total),
              discount: Number(o.discount) || 0,
              deliveryFee: Number(o.delivery_fee) || 0,
              subtotal: Number(o.subtotal),
              address: o.address,
              paymentMethod: o.payment_method,
              paymentStatus: o.payment_status,
              deliveryInfo: parsedDeliveryInfo,
              distance: parsedDeliveryInfo.distance !== undefined ? parsedDeliveryInfo.distance : (Number(parsedDeliveryInfo.distance) || 0),
              eta: parsedDeliveryInfo.eta !== undefined ? parsedDeliveryInfo.eta : (Number(parsedDeliveryInfo.eta) || 0),
              pickupRoute: parsedDeliveryInfo.pickupRoute || [],
              savingsAmount: parsedDeliveryInfo.savingsAmount || 0,
              smartCombinedApplied: !!parsedDeliveryInfo.smartCombinedApplied,
              deliveryDetails: parsedDeliveryInfo.deliveryDetails || {},
              customerName: parsedDeliveryInfo.customerName || customerMap[o.customer_id] || 'Valued Customer',
              customer: customerMap[o.customer_id] || 'Valued Customer',
              liveCoordinates: typeof o.live_coordinates === 'string' ? JSON.parse(o.live_coordinates) : o.live_coordinates,
              rejectionHistory: typeof o.rejection_history === 'string' ? JSON.parse(o.rejection_history) : o.rejection_history || [],
              reassignmentFailed: o.reassignment_failed,
              createdAt: o.created_at,
              deliveredAt: o.delivered_at
            };
          });
          setOrders(formattedOrders);
        } else {
          const savedOrders = localStorage.getItem('uzhavar_orders');
          if (savedOrders) setOrders(JSON.parse(savedOrders));
        }

        // Process Riders
        if (ridersData && ridersData.length > 0) {
          const formattedRiders = ridersData.map(r => ({
            id: r.id,
            name: r.name,
            phone: r.phone,
            vehicle: r.vehicle,
            status: r.status,
            rating: Number(r.rating) || 5.0,
            distance: Number(r.distance) || 1.0,
            activeOrders: Number(r.active_orders) || 0,
            weeklyDeliveries: Number(r.weekly_deliveries) || 0,
            weeklyEarnings: Number(r.weekly_earnings) || 0,
            bonus: Number(r.bonus) || 0,
            acceptanceRate: Number(r.acceptance_rate) || 100,
            acceptances: Number(r.acceptances) || 0,
            rejections: Number(r.rejections) || 0,
            password: r.password
          }));
          setRiders(formattedRiders);
        } else {
          const savedRiders = localStorage.getItem('uzhavar_riders');
          if (savedRiders) setRiders(JSON.parse(savedRiders));
        }

        // Process Payouts
        if (payoutsData && payoutsData.length > 0) {
          const farmerPayouts = [];
          const riderPayouts = [];

          payoutsData.forEach(p => {
            const item = {
              id: p.id,
              recipientId: p.recipient_id,
              name: p.name,
              status: p.status,
              weekEndDate: p.week_end_date,
              createdAt: p.created_at
            };

            if (p.type === 'farmer') {
              farmerPayouts.push({
                ...item,
                farmerId: p.recipient_id,
                farmName: p.farm_name,
                totalSales: Number(p.total_sales) || 0,
                commission: Number(p.commission) || 0,
                netEarnings: Number(p.net_earnings) || 0
              });
            } else {
              riderPayouts.push({
                ...item,
                riderId: p.recipient_id,
                deliveryCount: p.delivery_count || 0,
                basePay: Number(p.net_earnings) || 0,
                bonusPay: 0,
                netEarnings: Number(p.net_earnings) || 0
              });
            }
          });

          setPayouts({
            farmers: farmerPayouts,
            riders: riderPayouts
          });
        } else {
          const savedPayouts = localStorage.getItem('uzhavar_payouts');
          if (savedPayouts) setPayouts(JSON.parse(savedPayouts));
        }
        setDbConnected(true);
      } catch (err) {
        console.error('Error fetching dashboard data from Supabase:', err);
        setDbConnected(false);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);


  // Real-time Database synchronizers
  useEffect(() => {
    // 1. Subscribe to orders
    const ordersChannel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;
          if (eventType === 'INSERT') {
            const parsedDeliveryInfo = typeof newRecord.delivery_info === 'string' ? JSON.parse(newRecord.delivery_info) : (newRecord.delivery_info || {});
            const formatted = {
              id: newRecord.id,
              customerId: newRecord.customer_id,
              farmerId: newRecord.farmer_id,
              status: newRecord.status,
              items: typeof newRecord.items === 'string' ? JSON.parse(newRecord.items) : newRecord.items,
              total: Number(newRecord.total),
              discount: Number(newRecord.discount) || 0,
              deliveryFee: Number(newRecord.delivery_fee) || 0,
              subtotal: Number(newRecord.subtotal),
              address: newRecord.address,
              paymentMethod: newRecord.payment_method,
              paymentStatus: newRecord.payment_status,
              deliveryInfo: parsedDeliveryInfo,
              distance: parsedDeliveryInfo.distance !== undefined ? parsedDeliveryInfo.distance : (Number(parsedDeliveryInfo.distance) || 0),
              eta: parsedDeliveryInfo.eta !== undefined ? parsedDeliveryInfo.eta : (Number(parsedDeliveryInfo.eta) || 0),
              pickupRoute: parsedDeliveryInfo.pickupRoute || [],
              savingsAmount: parsedDeliveryInfo.savingsAmount || 0,
              smartCombinedApplied: !!parsedDeliveryInfo.smartCombinedApplied,
              deliveryDetails: parsedDeliveryInfo.deliveryDetails || {},
              customerName: parsedDeliveryInfo.customerName || 'Valued Customer',
              customer: parsedDeliveryInfo.customerName || 'Valued Customer',
              liveCoordinates: typeof newRecord.live_coordinates === 'string' ? JSON.parse(newRecord.live_coordinates) : newRecord.live_coordinates,
              rejectionHistory: typeof newRecord.rejection_history === 'string' ? JSON.parse(newRecord.rejection_history) : newRecord.rejection_history || [],
              reassignmentFailed: newRecord.reassignment_failed,
              createdAt: newRecord.created_at,
              deliveredAt: newRecord.delivered_at
            };
            setOrders(prev => {
              if (prev.some(o => o.id === formatted.id)) return prev;
              return [formatted, ...prev];
            });
          } else if (eventType === 'UPDATE') {
            const parsedDeliveryInfo = typeof newRecord.delivery_info === 'string' ? JSON.parse(newRecord.delivery_info) : (newRecord.delivery_info || {});
            const formatted = {
              id: newRecord.id,
              customerId: newRecord.customer_id,
              farmerId: newRecord.farmer_id,
              status: newRecord.status,
              items: typeof newRecord.items === 'string' ? JSON.parse(newRecord.items) : newRecord.items,
              total: Number(newRecord.total),
              discount: Number(newRecord.discount) || 0,
              deliveryFee: Number(newRecord.delivery_fee) || 0,
              subtotal: Number(newRecord.subtotal),
              address: newRecord.address,
              paymentMethod: newRecord.payment_method,
              paymentStatus: newRecord.payment_status,
              deliveryInfo: parsedDeliveryInfo,
              distance: parsedDeliveryInfo.distance !== undefined ? parsedDeliveryInfo.distance : (Number(parsedDeliveryInfo.distance) || 0),
              eta: parsedDeliveryInfo.eta !== undefined ? parsedDeliveryInfo.eta : (Number(parsedDeliveryInfo.eta) || 0),
              pickupRoute: parsedDeliveryInfo.pickupRoute || [],
              savingsAmount: parsedDeliveryInfo.savingsAmount || 0,
              smartCombinedApplied: !!parsedDeliveryInfo.smartCombinedApplied,
              deliveryDetails: parsedDeliveryInfo.deliveryDetails || {},
              customerName: parsedDeliveryInfo.customerName || 'Valued Customer',
              customer: parsedDeliveryInfo.customerName || 'Valued Customer',
              liveCoordinates: typeof newRecord.live_coordinates === 'string' ? JSON.parse(newRecord.live_coordinates) : newRecord.live_coordinates,
              rejectionHistory: typeof newRecord.rejection_history === 'string' ? JSON.parse(newRecord.rejection_history) : newRecord.rejection_history || [],
              reassignmentFailed: newRecord.reassignment_failed,
              createdAt: newRecord.created_at,
              deliveredAt: newRecord.delivered_at
            };
            setOrders(prev => prev.map(o => o.id === formatted.id ? formatted : o));
 
            // Sync activeRequest trigger if current user is the rider receiving it
            // This enables cross-portal notification sync!
            if (newRecord.status === 'Pending' && newRecord.delivery_info?.riderId) {
              // Wait, activeRequest timer gets handled locally or via order updates
            }
          } else if (eventType === 'DELETE') {
            setOrders(prev => prev.filter(o => o.id !== oldRecord.id));
          }
        }
      )
      .subscribe();

    // 2. Subscribe to riders
    const ridersChannel = supabase
      .channel('riders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'riders' },
        (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;
          if (eventType === 'INSERT' || eventType === 'UPDATE') {
            const formatted = {
              id: newRecord.id,
              name: newRecord.name,
              phone: newRecord.phone,
              vehicle: newRecord.vehicle,
              status: newRecord.status,
              rating: Number(newRecord.rating) || 5.0,
              distance: Number(newRecord.distance) || 1.0,
              activeOrders: Number(newRecord.active_orders) || 0,
              weeklyDeliveries: Number(newRecord.weekly_deliveries) || 0,
              weeklyEarnings: Number(newRecord.weekly_earnings) || 0,
              bonus: Number(newRecord.bonus) || 0,
              acceptanceRate: Number(newRecord.acceptance_rate) || 100,
              acceptances: Number(newRecord.acceptances) || 0,
              rejections: Number(newRecord.rejections) || 0,
              password: newRecord.password
            };
            setRiders(prev => {
              const exists = prev.some(r => r.id === formatted.id);
              if (exists) {
                return prev.map(r => r.id === formatted.id ? formatted : r);
              }
              return [...prev, formatted];
            });
          } else if (eventType === 'DELETE') {
            setRiders(prev => prev.filter(r => r.id !== oldRecord.id));
          }
        }
      )
      .subscribe();

    // 3. Subscribe to payouts
    const payoutsChannel = supabase
      .channel('payouts-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payouts' },
        (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;
          if (eventType === 'INSERT' || eventType === 'UPDATE') {
            setPayouts(prev => {
              const isFarmer = newRecord.type === 'farmer';
              const targetList = isFarmer ? 'farmers' : 'riders';

              const item = {
                id: newRecord.id,
                recipientId: newRecord.recipient_id,
                name: newRecord.name,
                status: newRecord.status,
                weekEndDate: newRecord.week_end_date,
                createdAt: newRecord.created_at,
                ...(isFarmer ? {
                  farmerId: newRecord.recipient_id,
                  farmName: newRecord.farm_name,
                  totalSales: Number(newRecord.total_sales) || 0,
                  commission: Number(newRecord.commission) || 0,
                  netEarnings: Number(newRecord.net_earnings) || 0
                } : {
                  riderId: newRecord.recipient_id,
                  deliveryCount: newRecord.delivery_count || 0,
                  basePay: Number(newRecord.net_earnings) || 0,
                  bonusPay: 0,
                  netEarnings: Number(newRecord.net_earnings) || 0
                })
              };

              const filteredList = prev[targetList].filter(p => p.id !== item.id);
              return {
                ...prev,
                [targetList]: [item, ...filteredList]
              };
            });
          } else if (eventType === 'DELETE') {
            setPayouts(prev => {
              return {
                farmers: prev.farmers.filter(p => p.id !== oldRecord.id),
                riders: prev.riders.filter(p => p.id !== oldRecord.id)
              };
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(ridersChannel);
      supabase.removeChannel(payoutsChannel);
    };
  }, []);

  // Save changes to localStorage as a fallback backup
  useEffect(() => {
    if (orders.length > 0) localStorage.setItem('uzhavar_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    if (riders.length > 0) localStorage.setItem('uzhavar_riders', JSON.stringify(riders));
  }, [riders]);

  useEffect(() => {
    if (payouts.farmers.length > 0 || payouts.riders.length > 0) {
      localStorage.setItem('uzhavar_payouts', JSON.stringify(payouts));
    }
  }, [payouts]);

  // Cross-tab synchronization via localStorage (offline real-time fallback)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.newValue) {
        if (e.key === 'uzhavar_orders') setOrders(JSON.parse(e.newValue));
        if (e.key === 'uzhavar_riders') setRiders(JSON.parse(e.newValue));
        if (e.key === 'uzhavar_payouts') setPayouts(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // 30-second Accept/Reject Timer for delivery partner requests
  useEffect(() => {
    if (!activeRequest) return;

    const timer = setInterval(() => {
      setActiveRequest(prev => {
        if (!prev) return null;
        if (prev.timeLeft <= 1) {
          clearInterval(timer);
          setTimeout(() => {
            rejectRequest(prev.orderId, prev.riderId, 'System Auto-Reject (30s Timeout)');
          }, 0);
          return null;
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeRequest]);

  // Synchronize activeRequest from orders list (enables real-time cross-portal updates)
  useEffect(() => {
    // Find any order that is Pending and has a rider assigned
    const pendingOrderWithRider = orders.find(o => 
      o.status === 'Pending' && 
      o.deliveryInfo?.riderId && 
      (!o.rejectionHistory || !o.rejectionHistory.length || !o.rejectionHistory.some(h => String(h.riderId) === String(o.deliveryInfo.riderId)))
    );

    if (pendingOrderWithRider) {
      const orderId = pendingOrderWithRider.id;
      const riderId = pendingOrderWithRider.deliveryInfo.riderId;

      setActiveRequest(prev => {
        if (!prev || prev.orderId !== orderId || prev.riderId !== riderId) {
          return { orderId, riderId, timeLeft: 30 };
        }
        return prev;
      });
    } else {
      setActiveRequest(prev => (prev ? null : prev));
    }
  }, [orders]);

  const addOrder = async (order) => {
    // Optimistic local update
    const tempOrder = { 
      ...order, 
      id: order.id || Date.now(), 
      createdAt: new Date().toISOString(),
      customerName: order.customerName || 'Valued Customer',
      customer: order.customerName || 'Valued Customer'
    };
    setOrders(prev => [tempOrder, ...prev]);

    try {
      const discountVal = order.discount !== undefined ? order.discount : 0;
      const deliveryFeeVal = order.deliveryFee !== undefined ? order.deliveryFee : 0;
      const subtotalVal = order.subtotal !== undefined ? order.subtotal : order.total;
      
      let addressStr = 'Coimbatore, Tamil Nadu';
      if (order.address) {
        addressStr = typeof order.address === 'object' 
          ? `${order.address.title || ''}, ${order.address.line1 || ''}, ${order.address.line2 || ''}`.trim()
          : order.address;
      } else if (order.deliveryDetails?.address) {
        addressStr = typeof order.deliveryDetails.address === 'object'
          ? `${order.deliveryDetails.address.title || ''}, ${order.deliveryDetails.address.line1 || ''}, ${order.deliveryDetails.address.line2 || ''}`.trim()
          : order.deliveryDetails.address;
      }

      const deliveryInfoObj = {
        distance: order.distance,
        eta: order.eta,
        pickupRoute: order.pickupRoute,
        savingsAmount: order.savingsAmount,
        smartCombinedApplied: order.smartCombinedApplied,
        deliveryDetails: order.deliveryDetails,
        customerName: order.customerName || order.deliveryDetails?.customerName || 'Valued Customer',
        riderId: order.deliveryInfo?.riderId || null,
        person: order.deliveryInfo?.person || null,
        phone: order.deliveryInfo?.phone || null,
        vehicle: order.deliveryInfo?.vehicle || null
      };

      const { data, error } = await supabase
        .from('orders')
        .insert([{
          customer_id: order.customerId || null,
          farmer_id: order.farmerId || null,
          status: order.status || 'Pending',
          items: order.items,
          total: order.total,
          discount: discountVal,
          delivery_fee: deliveryFeeVal,
          subtotal: subtotalVal,
          address: addressStr,
          payment_method: order.paymentMethod || order.deliveryDetails?.paymentMethod || 'Cash on Delivery',
          payment_status: order.paymentStatus || 'Pending',
          delivery_info: deliveryInfoObj,
          live_coordinates: order.liveCoordinates || null,
          rejection_history: order.rejectionHistory || [],
          reassignment_failed: order.reassignmentFailed || false
        }])
        .select();

      if (error) throw error;

      if (data && data[0]) {
        const parsedDeliveryInfo = typeof data[0].delivery_info === 'string' ? JSON.parse(data[0].delivery_info) : (data[0].delivery_info || {});
        const formatted = {
          id: data[0].id,
          customerId: data[0].customer_id,
          farmerId: data[0].farmer_id,
          status: data[0].status,
          items: typeof data[0].items === 'string' ? JSON.parse(data[0].items) : data[0].items,
          total: Number(data[0].total),
          discount: Number(data[0].discount) || 0,
          deliveryFee: Number(data[0].delivery_fee) || 0,
          subtotal: Number(data[0].subtotal),
          address: data[0].address,
          paymentMethod: data[0].payment_method,
          paymentStatus: data[0].payment_status,
          deliveryInfo: parsedDeliveryInfo,
          distance: parsedDeliveryInfo.distance !== undefined ? parsedDeliveryInfo.distance : (Number(parsedDeliveryInfo.distance) || 0),
          eta: parsedDeliveryInfo.eta !== undefined ? parsedDeliveryInfo.eta : (Number(parsedDeliveryInfo.eta) || 0),
          pickupRoute: parsedDeliveryInfo.pickupRoute || [],
          savingsAmount: parsedDeliveryInfo.savingsAmount || 0,
          smartCombinedApplied: !!parsedDeliveryInfo.smartCombinedApplied,
          deliveryDetails: parsedDeliveryInfo.deliveryDetails || {},
          customerName: parsedDeliveryInfo.customerName || 'Valued Customer',
          customer: parsedDeliveryInfo.customerName || 'Valued Customer',
          liveCoordinates: typeof data[0].live_coordinates === 'string' ? JSON.parse(data[0].live_coordinates) : data[0].live_coordinates,
          rejectionHistory: typeof data[0].rejection_history === 'string' ? JSON.parse(data[0].rejection_history) : data[0].rejection_history || [],
          reassignmentFailed: data[0].reassignment_failed,
          createdAt: data[0].created_at,
          deliveredAt: data[0].delivered_at
        };

        // --- INVENTORY STOCK DECREMENTING ---
        const itemsList = formatted.items || [];
        for (const item of itemsList) {
          const productId = item.id;
          const qtyToDecrement = getQtyNumber(item);
          if (productId && qtyToDecrement > 0) {
            try {
              const { data: prodData, error: fetchErr } = await supabase
                .from('products')
                .select('stock')
                .eq('id', productId)
                .maybeSingle();
              if (!fetchErr && prodData) {
                const currentStock = prodData.stock || 0;
                const nextStock = Math.max(0, currentStock - qtyToDecrement);
                await supabase
                  .from('products')
                  .update({ stock: nextStock })
                  .eq('id', productId);
                console.log(`[Inventory] Decrementing product ${productId}: stock ${currentStock} -> ${nextStock}`);
              }
            } catch (invErr) {
              console.error(`[Inventory] Error decrementing product stock:`, invErr);
            }
          }
        }
        // -------------------------------------

        setOrders(prev => prev.map(o => o.id === tempOrder.id ? formatted : o));
        return formatted;
      }
      return tempOrder;
    } catch (err) {
      console.error('Error placing order in Supabase:', err);
      // Already added to local state
      return tempOrder;
    }
  };

  const handleDeliveryPayouts = async (order) => {
    const riderId = order.deliveryInfo?.riderId;
    if (riderId) {
      // 1. Update rider weekly stats in Supabase
      const rider = riders.find(r => r.id === riderId);
      if (rider) {
        const nextDeliveries = rider.weeklyDeliveries + 1;
        const nextEarnings = nextDeliveries * 50; // ₹50 base pay

        try {
          await supabase
            .from('riders')
            .update({
              weekly_deliveries: nextDeliveries,
              weekly_earnings: nextEarnings,
              active_orders: Math.max(0, rider.activeOrders - 1),
              status: 'Online'
            })
            .eq('id', riderId);
        } catch (err) {
          console.error('Error updating rider payouts in DB:', err);
        }
      }

      // 2. Record/Update Rider Payout entry in Supabase
      try {
        const riderName = order.deliveryInfo?.person || 'Rider';
        
        // Check if there is an existing pending payout for this rider
        const { data: existingPayouts, error: checkErr } = await supabase
          .from('payouts')
          .select('*')
          .eq('recipient_id', riderId)
          .eq('type', 'rider')
          .eq('status', 'Pending')
          .limit(1);

        if (!checkErr && existingPayouts && existingPayouts.length > 0) {
          const activePayout = existingPayouts[0];
          const updatedCount = (activePayout.delivery_count || 0) + 1;
          const updatedNet = (Number(activePayout.net_earnings) || 0) + 50;

          await supabase
            .from('payouts')
            .update({
              delivery_count: updatedCount,
              net_earnings: updatedNet
            })
            .eq('id', activePayout.id);
        } else {
          const payoutId = `RP-${Math.floor(1000 + Math.random() * 9000)}`;
          await supabase
            .from('payouts')
            .insert([{
              id: payoutId,
              type: 'rider',
              recipient_id: riderId,
              name: riderName,
              delivery_count: 1,
              net_earnings: 50.00,
              status: 'Pending',
              week_end_date: new Date().toISOString().split('T')[0]
            }]);
        }
      } catch (err) {
        console.error('Error recording rider payout row:', err);
      }
    }

    // 3. Record/Update Farmer Payout entry in Supabase (Proportional Multi-Vendor split)
    const items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
    const farmerGroups = {};
    let totalItemsSubtotal = 0;

    items.forEach(item => {
      const fId = item.farmerId || order.farmerId || 1;
      const fName = item.farmerName || item.farmer || 'Farmer Partner';
      const qty = getQtyNumber(item);
      const itemCost = (item.price || 0) * qty;

      if (!farmerGroups[fId]) {
        farmerGroups[fId] = {
          farmerId: fId,
          farmerName: fName,
          subtotal: 0
        };
      }
      farmerGroups[fId].subtotal += itemCost;
      totalItemsSubtotal += itemCost;
    });

    const orderDiscount = Number(order.discount) || 0;
    const farmerPayoutsList = Object.values(farmerGroups);

    for (const group of farmerPayoutsList) {
      const farmerId = group.farmerId;
      const farmerName = group.farmerName;

      // Proportional discount allocation
      const propShare = totalItemsSubtotal > 0 ? (group.subtotal / totalItemsSubtotal) : 0;
      const farmerDiscount = orderDiscount * propShare;

      // Sales represents subtotal minus allocated discount
      const sales = parseFloat((group.subtotal - farmerDiscount).toFixed(2));
      const commission = parseFloat((sales * 0.05).toFixed(2));
      const net = parseFloat((sales - commission).toFixed(2));

      try {
        const { data: existingFarmerPayouts, error: checkErr } = await supabase
          .from('payouts')
          .select('*')
          .eq('recipient_id', farmerId)
          .eq('type', 'farmer')
          .eq('status', 'Pending')
          .limit(1);

        if (!checkErr && existingFarmerPayouts && existingFarmerPayouts.length > 0) {
          const activePayout = existingFarmerPayouts[0];
          const updatedSales = parseFloat(((Number(activePayout.total_sales) || 0) + sales).toFixed(2));
          const updatedComm = parseFloat(((Number(activePayout.commission) || 0) + commission).toFixed(2));
          const updatedNet = parseFloat(((Number(activePayout.net_earnings) || 0) + net).toFixed(2));

          await supabase
            .from('payouts')
            .update({
              total_sales: updatedSales,
              commission: updatedComm,
              net_earnings: updatedNet
            })
            .eq('id', activePayout.id);
        } else {
          const payoutId = `FP-${Math.floor(1000 + Math.random() * 9000)}`;
          const farmName = farmerName || 'Organic Farms';

          await supabase
            .from('payouts')
            .insert([{
              id: payoutId,
              type: 'farmer',
              recipient_id: farmerId,
              name: farmerName,
              farm_name: farmName,
              total_sales: sales,
              commission: commission,
              net_earnings: net,
              status: 'Pending',
              week_end_date: new Date().toISOString().split('T')[0]
            }]);
        }
      } catch (err) {
        console.error(`Error updating farmer ${farmerId} payouts in DB:`, err);
      }
    }
  };

  const updateOrder = async (orderId, updates) => {
    try {
      const dbUpdates = {};
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.paymentStatus !== undefined) dbUpdates.payment_status = updates.paymentStatus;
      if (updates.deliveryInfo !== undefined) dbUpdates.delivery_info = updates.deliveryInfo;
      if (updates.liveCoordinates !== undefined) dbUpdates.live_coordinates = updates.liveCoordinates;
      if (updates.rejectionHistory !== undefined) dbUpdates.rejection_history = updates.rejectionHistory;
      if (updates.reassignmentFailed !== undefined) dbUpdates.reassignment_failed = updates.reassignmentFailed;

      if (updates.status === 'Delivered') {
        dbUpdates.delivered_at = new Date().toISOString();
        
        // Handle delivery completion calculations
        const targetOrder = orders.find(o => o.id === orderId);
        if (targetOrder && targetOrder.status !== 'Delivered') {
          handleDeliveryPayouts(targetOrder);
        }
      }

      const { data, error } = await supabase
        .from('orders')
        .update(dbUpdates)
        .eq('id', orderId)
        .select();

      if (error) throw error;

      if (data && data[0]) {
        const parsedDeliveryInfo = typeof data[0].delivery_info === 'string' ? JSON.parse(data[0].delivery_info) : (data[0].delivery_info || {});
        const formatted = {
          id: data[0].id,
          customerId: data[0].customer_id,
          farmerId: data[0].farmer_id,
          status: data[0].status,
          items: typeof data[0].items === 'string' ? JSON.parse(data[0].items) : data[0].items,
          total: Number(data[0].total),
          discount: Number(data[0].discount) || 0,
          deliveryFee: Number(data[0].delivery_fee) || 0,
          subtotal: Number(data[0].subtotal),
          address: data[0].address,
          paymentMethod: data[0].payment_method,
          paymentStatus: data[0].payment_status,
          deliveryInfo: parsedDeliveryInfo,
          distance: parsedDeliveryInfo.distance !== undefined ? parsedDeliveryInfo.distance : (Number(parsedDeliveryInfo.distance) || 0),
          eta: parsedDeliveryInfo.eta !== undefined ? parsedDeliveryInfo.eta : (Number(parsedDeliveryInfo.eta) || 0),
          pickupRoute: parsedDeliveryInfo.pickupRoute || [],
          savingsAmount: parsedDeliveryInfo.savingsAmount || 0,
          smartCombinedApplied: !!parsedDeliveryInfo.smartCombinedApplied,
          deliveryDetails: parsedDeliveryInfo.deliveryDetails || {},
          customerName: parsedDeliveryInfo.customerName || 'Valued Customer',
          customer: parsedDeliveryInfo.customerName || 'Valued Customer',
          liveCoordinates: typeof data[0].live_coordinates === 'string' ? JSON.parse(data[0].live_coordinates) : data[0].live_coordinates,
          rejectionHistory: typeof data[0].rejection_history === 'string' ? JSON.parse(data[0].rejection_history) : data[0].rejection_history || [],
          reassignmentFailed: data[0].reassignment_failed,
          createdAt: data[0].created_at,
          deliveredAt: data[0].delivered_at
        };
        setOrders(prev => prev.map(o => o.id === orderId ? formatted : o));
      }
    } catch (err) {
      console.error('Error updating order in Supabase:', err);
      // Fallback local update
      setOrders(prev => prev.map(o => {
        if (o.id === orderId) {
          const nextStatus = updates.status;
          const nextUpdates = { ...updates };
          if (nextStatus === 'Delivered' && o.status !== 'Delivered') {
            nextUpdates.deliveredAt = new Date().toISOString();
            handleDeliveryPayouts(o);
          }
          return { ...o, ...nextUpdates };
        }
        return o;
      }));
    }
  };

  const updateRiderStatus = async (riderId, newStatus) => {
    try {
      await supabase
        .from('riders')
        .update({ status: newStatus })
        .eq('id', riderId);

      setRiders(prev => prev.map(r => r.id === riderId ? { ...r, status: newStatus } : r));
    } catch (err) {
      console.error('Error updating rider status:', err);
      setRiders(prev => prev.map(r => r.id === riderId ? { ...r, status: newStatus } : r));
    }
  };

  // Farmer Manual Assignment
  const manualAssignRider = async (orderId, riderId) => {
    const targetRider = riders.find(r => r.id === riderId);
    const existingOrder = orders.find(o => o.id === orderId);
    const deliveryPlaceholder = {
      ...(existingOrder?.deliveryInfo || {}),
      person: targetRider?.name || 'Assigned Rider',
      phone: targetRider?.phone || '',
      vehicle: targetRider?.vehicle || '',
      riderId: riderId
    };

    // 1. Optimistically update local orders state to avoid useEffect race conditions
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          status: 'Pending',
          reassignmentFailed: false,
          deliveryInfo: deliveryPlaceholder
        };
      }
      return o;
    }));

    // 2. Notify rider using activeRequest (local state and broadcast sync)
    setActiveRequest({
      orderId,
      riderId,
      timeLeft: 30
    });

    // 3. Set order status in Supabase
    try {
      await supabase
        .from('orders')
        .update({
          status: 'Pending',
          reassignment_failed: false,
          delivery_info: deliveryPlaceholder
        })
        .eq('id', orderId);
    } catch (err) {
      console.error('Error updating order during manual assignment:', err);
    }
  };

  // Farmer Auto Assignment (pick nearest and least busy rider)
  const autoAssignRider = (orderId) => {
    const onlineRiders = riders.filter(r => r.status === 'Online');
    if (onlineRiders.length === 0) {
      updateOrder(orderId, { reassignmentFailed: true });
      return false;
    }

    const sorted = [...onlineRiders].sort((a, b) => {
      if (a.activeOrders !== b.activeOrders) {
        return a.activeOrders - b.activeOrders;
      }
      return a.distance - b.distance;
    });

    const bestRider = sorted[0];
    manualAssignRider(orderId, bestRider.id);
    return bestRider;
  };

  // Reject Request
  async function rejectRequest(orderId, riderId, reason) {
    const rider = riders.find(r => r.id === riderId);
    if (!rider) return;

    // 1. Calculate next rider stats
    const nextRejections = rider.rejections + 1;
    const totalOffers = rider.acceptances + nextRejections;
    const nextRate = Math.round((rider.acceptances / totalOffers) * 100);

    // Optimistically update local riders state
    setRiders(prev => prev.map(r => r.id === riderId ? {
      ...r,
      rejections: nextRejections,
      acceptanceRate: nextRate,
      status: 'Online'
    } : r));

    try {
      await supabase
        .from('riders')
        .update({
          rejections: nextRejections,
          acceptance_rate: nextRate,
          status: 'Online'
        })
        .eq('id', riderId);
    } catch (err) {
      console.error('Error updating rider rejections in DB:', err);
    }

    // 2. Add to order rejection history
    const targetOrder = orders.find(o => o.id === orderId);
    if (targetOrder) {
      const history = [...(targetOrder.rejectionHistory || [])];
      const newHistory = [
        ...history,
        {
          riderId,
          riderName: rider.name || 'Delivery Partner',
          reason: reason || 'Busy with other order',
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        }
      ];

      const updatedDeliveryInfo = {
        ...(targetOrder.deliveryInfo || {}),
        riderId: null,
        person: null,
        phone: null,
        vehicle: null
      };

      // Optimistically update local order rejection history and clear rider details in deliveryInfo
      setOrders(prev => prev.map(o => o.id === orderId ? {
        ...o,
        rejectionHistory: newHistory,
        deliveryInfo: updatedDeliveryInfo
      } : o));

      try {
        await supabase
          .from('orders')
          .update({
            rejection_history: newHistory,
            delivery_info: updatedDeliveryInfo
          })
          .eq('id', orderId);
      } catch (err) {
        console.error('Error updating order rejection history in DB:', err);
      }
    }

    // Clear active request locally
    setActiveRequest(null);

    // 3. System automatically reassigns another rider
    setTimeout(() => {
      autoReassignAnotherRider(orderId, riderId);
    }, 1500);
  };

  const autoReassignAnotherRider = async (orderId, previousRiderId) => {
    // Read order history directly
    const currentOrder = orders.find(o => o.id === orderId);
    const rejectedRiderIds = (currentOrder?.rejectionHistory || []).map(h => h.riderId);
    if (previousRiderId && !rejectedRiderIds.includes(previousRiderId)) {
      rejectedRiderIds.push(previousRiderId);
    }

    // Find online riders who have not rejected this order yet
    const candidateRiders = riders.filter(r => r.status === 'Online' && !rejectedRiderIds.includes(r.id));

    if (candidateRiders.length > 0) {
      const sorted = [...candidateRiders].sort((a, b) => {
        if (a.activeOrders !== b.activeOrders) {
          return a.activeOrders - b.activeOrders;
        }
        return a.distance - b.distance;
      });

      const nextRider = sorted[0];
      manualAssignRider(orderId, nextRider.id);
    } else {
      // No more riders, optimistically set reassignment failed flag
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, reassignmentFailed: true } : o));

      try {
        await supabase
          .from('orders')
          .update({ reassignment_failed: true })
          .eq('id', orderId);
      } catch (err) {
        console.error('Error setting reassignment failed in DB:', err);
      }
    }
  };

  // Accept Request
  const acceptRequest = async (orderId, riderId) => {
    const rider = riders.find(r => r.id === riderId);
    if (!rider) return;

    // 1. Calculate stats
    const nextAcceptances = rider.acceptances + 1;
    const totalOffers = nextAcceptances + rider.rejections;
    const nextRate = Math.round((nextAcceptances / totalOffers) * 100);

    // Optimistically update local riders state
    setRiders(prev => prev.map(r => r.id === riderId ? {
      ...r,
      acceptances: nextAcceptances,
      acceptanceRate: nextRate,
      activeOrders: r.activeOrders + 1,
      status: 'Busy'
    } : r));

    try {
      await supabase
        .from('riders')
        .update({
          acceptances: nextAcceptances,
          acceptance_rate: nextRate,
          active_orders: rider.activeOrders + 1,
          status: 'Busy'
        })
        .eq('id', riderId);
    } catch (err) {
      console.error('Error updating rider accept stats in DB:', err);
    }

    // 2. Prepare delivery details (shallow merge to preserve checkout-time metrics!)
    const existingOrder = orders.find(o => o.id === orderId);
    const deliveryDetails = {
      ...(existingOrder?.deliveryInfo || {}),
      person: rider.name,
      phone: rider.phone,
      vehicle: rider.vehicle,
      riderId: rider.id
    };

    // Optimistically update local orders state
    setOrders(prev => prev.map(o => o.id === orderId ? {
      ...o,
      status: 'Packed',
      deliveryInfo: deliveryDetails,
      liveCoordinates: { percent: 10 }
    } : o));

    try {
      await supabase
        .from('orders')
        .update({
          status: 'Packed',
          delivery_info: deliveryDetails,
          live_coordinates: { percent: 10 }
        })
        .eq('id', orderId);
    } catch (err) {
      console.error('Error updating order delivery info in DB:', err);
    }

    // Clear active request locally
    setActiveRequest(null);
  };

  // Advance order status simulation
  const advanceOrderStatus = async (orderId, nextStatus) => {
    const updates = { status: nextStatus };

    if (nextStatus === 'Delivered') {
      updates.deliveredAt = new Date().toISOString();
      const targetOrder = orders.find(o => o.id === orderId);
      if (targetOrder && targetOrder.status !== 'Delivered') {
        handleDeliveryPayouts(targetOrder);
      }
    }

    // Coordinate simulator
    if (nextStatus === 'Packed') updates.liveCoordinates = { percent: 15 };
    if (nextStatus === 'Picked Up') updates.liveCoordinates = { percent: 35 };
    if (nextStatus === 'On The Way') updates.liveCoordinates = { percent: 65 };
    if (nextStatus === 'Near Customer') updates.liveCoordinates = { percent: 88 };
    if (nextStatus === 'Delivered') updates.liveCoordinates = { percent: 100 };

    updateOrder(orderId, updates);
  };

  // Admin Approve Payout
  const approvePayout = async (type, payoutId) => {
    try {
      const { error } = await supabase
        .from('payouts')
        .update({ status: 'Paid' })
        .eq('id', payoutId);

      if (error) throw error;

      if (type === 'rider') {
        const payout = payouts.riders.find(p => p.id === payoutId);
        const riderId = payout ? (payout.recipientId || payout.riderId) : null;
        if (riderId) {
          const { error: riderErr } = await supabase
            .from('riders')
            .update({
              weekly_earnings: 0.00,
              weekly_deliveries: 0
            })
            .eq('id', riderId);
          if (riderErr) {
            console.error('Error resetting rider stats in Supabase:', riderErr);
          } else {
            setRiders(prev => prev.map(r => r.id === riderId ? {
              ...r,
              weeklyEarnings: 0,
              weeklyDeliveries: 0
            } : r));
          }
        }
      }

      setPayouts(prev => {
        const targetList = type === 'farmer' ? 'farmers' : 'riders';
        return {
          ...prev,
          [targetList]: prev[targetList].map(p => p.id === payoutId ? { ...p, status: 'Paid' } : p)
        };
      });
    } catch (err) {
      console.error('Error approving payout in Supabase:', err);
      // Fallback local update
      if (type === 'rider') {
        const payout = payouts.riders.find(p => p.id === payoutId);
        const riderId = payout ? (payout.recipientId || payout.riderId) : null;
        if (riderId) {
          setRiders(prev => prev.map(r => r.id === riderId ? {
            ...r,
            weeklyEarnings: 0,
            weeklyDeliveries: 0
          } : r));
        }
      }
      setPayouts(prev => {
        const targetList = type === 'farmer' ? 'farmers' : 'riders';
        return {
          ...prev,
          [targetList]: prev[targetList].map(p => p.id === payoutId ? { ...p, status: 'Paid' } : p)
        };
      });
    }
  };

  const addRider = async (newRider) => {
    try {
      const { data, error } = await supabase
        .from('riders')
        .insert([{
          name: newRider.name,
          phone: newRider.phone,
          vehicle: newRider.vehicle,
          status: newRider.status || 'Online',
          rating: newRider.rating || 5.0,
          distance: newRider.distance || 1.0,
          active_orders: newRider.activeOrders || 0,
          weekly_deliveries: newRider.weeklyDeliveries || 0,
          weekly_earnings: newRider.weeklyEarnings || 0.00,
          bonus: newRider.bonus || 0.00,
          acceptance_rate: newRider.acceptanceRate || 100,
          acceptances: newRider.acceptances || 0,
          rejections: newRider.rejections || 0,
          password: newRider.password || 'password123'
        }])
        .select();

      if (error) throw error;

      if (data && data[0]) {
        const formatted = {
          id: data[0].id,
          name: data[0].name,
          phone: data[0].phone,
          vehicle: data[0].vehicle,
          status: data[0].status,
          rating: Number(data[0].rating) || 5.0,
          distance: Number(data[0].distance) || 1.0,
          activeOrders: Number(data[0].active_orders) || 0,
          weeklyDeliveries: Number(data[0].weekly_deliveries) || 0,
          weeklyEarnings: Number(data[0].weekly_earnings) || 0,
          bonus: Number(data[0].bonus) || 0,
          acceptanceRate: Number(data[0].acceptance_rate) || 100,
          acceptances: Number(data[0].acceptances) || 0,
          rejections: Number(data[0].rejections) || 0,
          password: data[0].password
        };
        setRiders(prev => [...prev, formatted]);
        return formatted;
      }
    } catch (err) {
      console.error('Error adding rider to Supabase:', err);
      const tempRider = { ...newRider, id: newRider.id || Date.now() };
      setRiders(prev => [...prev, tempRider]);
      return tempRider;
    }
  };

  const updateRiderProfile = async (riderId, updatedFields) => {
    try {
      const dbUpdates = {};
      if (updatedFields.name !== undefined) dbUpdates.name = updatedFields.name;
      if (updatedFields.phone !== undefined) dbUpdates.phone = updatedFields.phone;
      if (updatedFields.vehicle !== undefined) dbUpdates.vehicle = updatedFields.vehicle;
      if (updatedFields.status !== undefined) dbUpdates.status = updatedFields.status;
      if (updatedFields.rating !== undefined) dbUpdates.rating = updatedFields.rating;
      if (updatedFields.password !== undefined) dbUpdates.password = updatedFields.password;

      const { data, error } = await supabase
        .from('riders')
        .update(dbUpdates)
        .eq('id', riderId)
        .select();

      if (error) throw error;

      if (data && data[0]) {
        const formatted = {
          id: data[0].id,
          name: data[0].name,
          phone: data[0].phone,
          vehicle: data[0].vehicle,
          status: data[0].status,
          rating: Number(data[0].rating) || 5.0,
          distance: Number(data[0].distance) || 1.0,
          activeOrders: Number(data[0].active_orders) || 0,
          weeklyDeliveries: Number(data[0].weekly_deliveries) || 0,
          weeklyEarnings: Number(data[0].weekly_earnings) || 0,
          bonus: Number(data[0].bonus) || 0,
          acceptanceRate: Number(data[0].acceptance_rate) || 100,
          acceptances: Number(data[0].acceptances) || 0,
          rejections: Number(data[0].rejections) || 0,
          password: data[0].password
        };
        setRiders(prev => prev.map(r => r.id === riderId ? formatted : r));
      }
    } catch (err) {
      console.error('Error updating rider profile in DB:', err);
      setRiders(prev => prev.map(r => r.id === riderId ? { ...r, ...updatedFields } : r));
    }
  };

  const clearCustomerHistory = async (customerId) => {
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('customer_id', customerId);
      if (error) throw error;
      setOrders(prev => prev.filter(o => String(o.customerId) !== String(customerId)));
    } catch (err) {
      console.error('Error clearing customer history:', err);
      setOrders(prev => prev.filter(o => String(o.customerId) !== String(customerId)));
    }
  };

  return (
    <OrdersContext.Provider value={{ 
      orders, 
      addOrder, 
      updateOrder,
      riders,
      addRider,
      updateRiderProfile,
      payouts,
      activeRequest,
      setActiveRequest,
      manualAssignRider,
      autoAssignRider,
      acceptRequest,
      rejectRequest,
      advanceOrderStatus,
      approvePayout,
      updateRiderStatus,
      clearCustomerHistory,
      loading,
      dbConnected
    }}>
      {children}
    </OrdersContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrdersContext);
  if (!context) throw new Error('useOrders must be used within an OrdersProvider');
  return context;
};
