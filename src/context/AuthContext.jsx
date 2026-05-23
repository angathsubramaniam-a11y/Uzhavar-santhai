import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('uzhavar_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);

  // Check URL for OAuth errors on load
  useEffect(() => {
    const handleUrlParams = () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const searchParams = new URLSearchParams(window.location.search);
      
      const error = hashParams.get('error') || searchParams.get('error');
      const errorDescription = hashParams.get('error_description') || searchParams.get('error_description');
      
      if (error) {
        console.error('Supabase Auth error from URL:', error, errorDescription);
        alert(`Authentication Error:\n\nMessage: ${errorDescription || error}\n\nPlease verify your Supabase Dashboard -> Authentication -> Providers -> Google configuration settings.`);
        window.history.replaceState(null, '', window.location.pathname);
      }
    };
    
    handleUrlParams();
  }, []);

  // Sync Supabase Auth session on load & change
  useEffect(() => {
    let safetyTimer = null;
    let isFirstEvent = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthContext] onAuthStateChange event:', event, 'session user:', session?.user?.email);
      
      if (session?.user) {
        isFirstEvent = false;
        setLoading(true);
        // Safety timeout to prevent infinite loading screen
        if (safetyTimer) clearTimeout(safetyTimer);
        safetyTimer = setTimeout(() => {
          console.warn('[AuthContext] Auth synchronization took too long, safety timeout triggered.');
          setLoading(false);
        }, 2500);

        const email = session.user.email;
        const fullName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'Google User';
        const avatarUrl = session.user.user_metadata?.avatar_url || '';

        try {
          let resolvedUser = null;
          console.log('[AuthContext] Attempting to resolve database user for:', email);

          // 1. Try matching customer table
          console.log('[AuthContext] Querying customers table...');
          const { data: customer, error: customerErr } = await supabase
            .from('customers')
            .select('*')
            .eq('email', email)
            .maybeSingle();

          if (customerErr) {
            console.error('[AuthContext] Supabase customer lookup error:', customerErr);
          }

          if (customer) {
            console.log('[AuthContext] Found customer record:', customer.id);
            resolvedUser = {
              id: customer.id,
              fullName: customer.full_name,
              phone: customer.phone,
              location: customer.location,
              email: customer.email,
              role: 'customer',
              authProvider: 'google'
            };
          } else {
            // 2. Try matching farmer table
            console.log('[AuthContext] Customer not found. Querying farmers table...');
            const { data: farmer, error: farmerErr } = await supabase
              .from('farmers')
              .select('*')
              .eq('email', email)
              .maybeSingle();

            if (farmerErr) {
              console.error('[AuthContext] Supabase farmer lookup error:', farmerErr);
            }

            if (farmer) {
              console.log('[AuthContext] Found farmer record:', farmer.id);
              resolvedUser = {
                id: farmer.id,
                name: farmer.name,
                farmName: farmer.farm_name,
                phone: farmer.phone,
                location: farmer.location,
                email: farmer.email,
                role: 'farmer',
                rating: Number(farmer.rating) || 0,
                status: farmer.status,
                image: farmer.image,
                bankDetails: farmer.bank_details || null,
                authProvider: 'google'
              };
            } else {
              // 3. Try matching riders table
              console.log('[AuthContext] Farmer not found. Querying riders table...');
              const { data: rider, error: riderErr } = await supabase
                .from('riders')
                .select('*')
                .eq('email', email)
                .maybeSingle();

              if (riderErr) {
                console.error('[AuthContext] Supabase rider lookup error:', riderErr);
              }

              if (rider) {
                console.log('[AuthContext] Found rider record:', rider.id);
                resolvedUser = {
                  id: rider.id,
                  name: rider.name,
                  phone: rider.phone,
                  email: rider.email,
                  vehicle: rider.vehicle,
                  status: rider.status,
                  rating: Number(rider.rating) || 5.0,
                  distance: Number(rider.distance) || 1.0,
                  activeOrders: Number(rider.active_orders) || 0,
                  weeklyDeliveries: Number(rider.weekly_deliveries) || 0,
                  weeklyEarnings: Number(rider.weekly_earnings) || 0,
                  bonus: Number(rider.bonus) || 0,
                  acceptanceRate: Number(rider.acceptance_rate) || 100,
                  acceptances: Number(rider.acceptances) || 0,
                  rejections: Number(rider.rejections) || 0,
                  role: 'delivery',
                  authProvider: 'google'
                };
              }
            }
          }

          // 4. Fallback Auto-register depending on the preferred role stored in localStorage
          if (!resolvedUser) {
            const preferredRole = localStorage.getItem('oauth_preferred_role') || 'customer';
            const tempPassword = 'oauth-' + Math.random().toString(36).substring(2, 10);
            const randomSuffix = Math.random().toString(36).substring(2, 7);

            console.log(`[AuthContext] User not found in database. Auto-registering as preferred role: ${preferredRole}`);

            if (preferredRole === 'farmer') {
              // Register as Farmer
              const { data: newFarmer, error: insertErr } = await supabase
                .from('farmers')
                .insert([{
                  name: fullName,
                  farm_name: `${fullName}'s Farm`,
                  phone: `Google-${randomSuffix}`,
                  location: 'Coimbatore, Tamil Nadu',
                  email: email,
                  password: tempPassword,
                  rating: 5.0,
                  status: 'Pending',
                  image: avatarUrl || 'https://images.unsplash.com/photo-1595856728032-47d06634b070?w=500&auto=format&fit=crop&fm=webp'
                }])
                .select()
                .single();

              if (insertErr) {
                console.error('[AuthContext] Supabase farmer auto-registration failure:', insertErr);
              }

              if (!insertErr && newFarmer) {
                resolvedUser = {
                  id: newFarmer.id,
                  name: newFarmer.name,
                  farmName: newFarmer.farm_name,
                  phone: newFarmer.phone,
                  location: newFarmer.location,
                  email: newFarmer.email,
                  role: 'farmer',
                  rating: Number(newFarmer.rating) || 5.0,
                  status: newFarmer.status,
                  image: newFarmer.image,
                  bankDetails: newFarmer.bank_details || null,
                  authProvider: 'google'
                };
              }
            } else if (preferredRole === 'delivery' || preferredRole === 'rider') {
              // Register as Rider
              const { data: newRider, error: insertErr } = await supabase
                .from('riders')
                .insert([{
                  name: fullName,
                  phone: `Google-${randomSuffix}`,
                  email: email,
                  vehicle: 'Electric Bike (Eco-friendly)',
                  status: 'Online',
                  rating: 5.0,
                  distance: 1.2,
                  password: tempPassword
                }])
                .select()
                .single();

              if (insertErr) {
                console.error('[AuthContext] Supabase rider auto-registration failure:', insertErr);
              }

              if (!insertErr && newRider) {
                resolvedUser = {
                  id: newRider.id,
                  name: newRider.name,
                  phone: newRider.phone,
                  email: newRider.email,
                  vehicle: newRider.vehicle,
                  status: newRider.status,
                  rating: Number(newRider.rating) || 5.0,
                  distance: Number(newRider.distance) || 1.0,
                  activeOrders: 0,
                  weeklyDeliveries: 0,
                  weeklyEarnings: 0,
                  bonus: 0,
                  acceptanceRate: 100,
                  acceptances: 0,
                  rejections: 0,
                  role: 'delivery',
                  authProvider: 'google'
                };
              }
            } else {
              // Default to Customer
              const { data: newCustomer, error: insertErr } = await supabase
                .from('customers')
                .insert([{
                  full_name: fullName,
                  email: email,
                  phone: 'Not Provided',
                  location: 'Not Provided',
                  password: tempPassword
                }])
                .select()
                .single();

              if (insertErr) {
                console.error('[AuthContext] Supabase customer auto-registration failure:', insertErr);
              }

              if (!insertErr && newCustomer) {
                resolvedUser = {
                  id: newCustomer.id,
                  fullName: newCustomer.full_name,
                  phone: newCustomer.phone,
                  location: newCustomer.location,
                  email: newCustomer.email,
                  role: 'customer',
                  authProvider: 'google'
                };
              }
            }
          }

          if (resolvedUser) {
            console.log('[AuthContext] User resolved successfully:', resolvedUser);
            setUser(resolvedUser);
            localStorage.setItem('uzhavar_user', JSON.stringify(resolvedUser));

            // Check if we need to perform post-login redirect for Google OAuth
            const preferred = localStorage.getItem('oauth_preferred_role');
            if (preferred) {
              localStorage.removeItem('oauth_preferred_role');
              
              if (resolvedUser.role === 'farmer' && resolvedUser.status !== 'Verified') {
                console.log('[AuthContext] Farmer is not verified, redirecting to login with error.');
                window.location.assign(window.location.origin + '/farmer/login?error=not_verified');
                return;
              }

              let targetRoute = '/';
              if (resolvedUser.role === 'customer') targetRoute = '/customer/home';
              else if (resolvedUser.role === 'farmer') targetRoute = '/farmer/dashboard';
              else if (resolvedUser.role === 'delivery') targetRoute = '/delivery/dashboard';

              console.log('[AuthContext] Performing redirect for OAuth to:', targetRoute);
              window.location.assign(window.location.origin + targetRoute);
            }
          } else {
            console.error('[AuthContext] Google Auth was successful but could not resolve or register user in public database schemas.');
          }
        } catch (err) {
          console.error('[AuthContext] Error synchronizing Google Auth session:', err);
        } finally {
          if (safetyTimer) clearTimeout(safetyTimer);
          setLoading(false);
          console.log('[AuthContext] Finished loading user authentication.');
        }
      } else {
        isFirstEvent = false;
        console.log('[AuthContext] No active session user found in Supabase Auth. Event:', event);
      }
    });

    return () => {
      if (safetyTimer) clearTimeout(safetyTimer);
      subscription?.unsubscribe();
    };
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('uzhavar_user', JSON.stringify(userData));
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('uzhavar_user');
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Error signing out of Supabase Auth:', e);
    }
  };

  const loginWithGoogle = async (preferredRole = 'customer') => {
    setLoading(true);
    localStorage.setItem('oauth_preferred_role', preferredRole);
    try {
      console.log(`Initiating Google OAuth for role: ${preferredRole}`);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
      
      if (data?.url) {
        console.log(`Redirecting browser to OAuth URL: ${data.url}`);
        window.location.assign(data.url);
      } else {
        console.warn('OAuth initiation did not return a redirect URL.');
      }
    } catch (err) {
      console.error('Error initiating Google Login:', err);
      setLoading(false);
      alert(`Failed to connect to Google OAuth:\n\n${err.message || err}`);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, loginWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
