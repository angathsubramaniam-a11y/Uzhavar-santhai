  import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useOrders } from '../../context/OrdersContext';
import { FiCheckCircle, FiMapPin, FiEdit2, FiTruck, FiCalendar, FiClock, FiArrowRight, FiZap, FiSunrise, FiMoon, FiCreditCard, FiCloud, FiCrosshair } from 'react-icons/fi';
import { LuLeaf } from 'react-icons/lu';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const DELIVERY_TYPES = [
  { id: 'express', label: 'Express Delivery', sub: '30 mins', icon: <FiZap />, badge: 'Fastest ★', color: 'text-orange-500' },
  { id: 'scheduled', label: 'Scheduled', sub: 'Pick your slot', icon: <FiCalendar />, badge: null, color: '' },
  { id: 'morning', label: 'Morning', sub: '6 AM – 12 PM', icon: <FiSunrise />, badge: null, color: '' },
  { id: 'evening', label: 'Evening', sub: '4 PM – 8 PM', icon: <FiMoon />, badge: null, color: '' },
];

const TIME_SLOTS = [
  { id: '6-8', label: '6 AM – 8 AM', full: false },
  { id: '8-10', label: '8 AM – 10 AM', full: false },
  { id: '10-12', label: '10 AM – 12 PM', full: true },
  { id: '12-2', label: '12 PM – 2 PM', full: true },
  { id: '2-4', label: '2 PM – 4 PM', full: false },
  { id: '4-6', label: '4 PM – 6 PM', full: false },
  { id: '6-8pm', label: '6 PM – 8 PM', full: false },
  { id: '8-10pm', label: '8 PM – 10 PM', full: true },
];

const QUICK_TAGS = ['Leave at door', 'Call before delivery', 'Ring bell', 'Near gate'];

function generateDates() {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return {
      id: i,
      day: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : days[d.getDay()],
      date: d.getDate(),
      month: months[d.getMonth()],
    };
  });
}

export default function CheckoutPage() {
  const { cartItems, clearCart } = useCart();
  const { user } = useAuth();
  const { addOrder } = useOrders();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1=delivery, 2=payment
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [deliveryType, setDeliveryType] = useState('express');
  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState('6-8');
  const [selectedTags, setSelectedTags] = useState([]);
  const [instructions, setInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [paymentError, setPaymentError] = useState('');
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [address, setAddress] = useState({
    title: 'Home — Flat 4B, Green Valley Apt.',
    line1: '14th Cross, Indiranagar, Coimbatore',
    line2: 'Tamil Nadu 641001'
  });
  
  // Custom Map Coordinate State
  const [mapCenter, setMapCenter] = useState([11.0168, 76.9558]);
  const [exactLocation, setExactLocation] = useState(null);
  const [selectedAreaName, setSelectedAreaName] = useState('');
  
  // Custom Map Event Hook
  function LocationPickerMarker() {
    useMapEvents({
      click(e) {
        setMapCenter([e.latlng.lat, e.latlng.lng]);
        setExactLocation([e.latlng.lat, e.latlng.lng]);
        reverseGeocode(e.latlng.lat, e.latlng.lng);
      },
    });

    return (
      <Marker position={mapCenter} draggable={true} 
        eventHandlers={{
          dragend: (e) => {
            const marker = e.target;
            const pos = marker.getLatLng();
            setMapCenter([pos.lat, pos.lng]);
            setExactLocation([pos.lat, pos.lng]);
            reverseGeocode(pos.lat, pos.lng);
          }
        }} 
      >
        {selectedAreaName && (
          <Popup className="font-bold text-gray-800">
            Selected Area: <span className="text-primary">{selectedAreaName}</span>
          </Popup>
        )}
      </Marker>
    );
  }

  function FlyToLocation({ center }) {
    const map = useMap();
    useEffect(() => {
      if (center) {
        map.flyTo(center, 15);
      }
    }, [center, map]);
    return null;
  }

  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        const area = addr.suburb || addr.neighbourhood || addr.road || addr.village || addr.county || 'Selected Location';
        
        setSelectedAreaName(area);
        
        // Auto-fill only the Area input as requested
        const areaInput = document.getElementById('checkout-area-input');
        if (areaInput) areaInput.value = area;
      }
    } catch (err) {
      console.error("Reverse geocoding error:", err);
    }
  };

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        setMapCenter([latitude, longitude]);
        setExactLocation([latitude, longitude]);
        reverseGeocode(latitude, longitude);
      });
    }
  };

  const dates = generateDates();

  const getDistanceForAddress = (addrString) => {
    let hash = 0;
    for (let i = 0; i < addrString.length; i++) {
      hash = addrString.charCodeAt(i) + ((hash << 5) - hash);
    }
    return parseFloat(((Math.abs(hash % 98) / 10) + 1.2).toFixed(1)); // distance in KM (e.g. 1.2 to 11.0 KM)
  };

  const totalKg = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const rawTotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const uniqueFarmers = Array.from(new Set(cartItems.map(item => item.farmerId || 1)));
  const uniqueFarmerNames = Array.from(new Set(cartItems.map(item => item.farmerName || 'Local Farmer')));
  const isCombined = uniqueFarmers.length > 1;

  const distance = getDistanceForAddress(address.line1 + ' ' + address.line2);

  let deliveryCharge = 20;
  if (distance > 2 && distance <= 5) deliveryCharge = 40;
  else if (distance > 5 && distance <= 10) deliveryCharge = 70;
  else if (distance > 10) deliveryCharge = 120;
  
  if (deliveryType === 'express') {
    deliveryCharge += 10;
  }

  const separateFee = uniqueFarmers.length * 40;
  const savingsAmount = isCombined ? Math.max(0, separateFee - deliveryCharge) : 0;
  
  const eta = Math.round(distance * 5 + 12); // ETA in minutes

  let discountPercent = 0;
  if (totalKg >= 25 && totalKg <= 50) discountPercent = 0.05;
  if (totalKg > 50) discountPercent = 0.10;
  const discountAmount = rawTotal * discountPercent;
  const platformFee = 10;
  const gstRate = 0.05; // 5% GST
  const gstAmount = rawTotal * gstRate;
  const finalPrice = rawTotal - discountAmount + deliveryCharge + platformFee + gstAmount;

  const availableSlots = TIME_SLOTS.filter(slot => {
    if (deliveryType === 'morning') return ['6-8', '8-10', '10-12'].includes(slot.id);
    if (deliveryType === 'evening') return ['4-6', '6-8pm', '8-10pm'].includes(slot.id);
    return true;
  });
  const activeSlot = availableSlots.find(s => s.id === selectedSlot) || availableSlots[0];
  const toggleTag = (tag) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    setAddress({
      title: `${formData.get('type')} — ${formData.get('house')}`,
      line1: formData.get('area'),
      line2: `${formData.get('city')} ${formData.get('pincode')}`
    });
    setIsEditingAddress(false);
  };

  const [isGeocoding, setIsGeocoding] = useState(false);

  const handlePlaceOrder = async () => {
    if (!paymentMethod) {
      setPaymentError('Please select a payment method to proceed.');
      return;
    }
    setPaymentError('');
    setIsGeocoding(true);

    // Geocoding logic via Nominatim
    let lat = 11.0168; // Default Coimbatore Lat
    let lng = 76.9558; // Default Coimbatore Lng
    try {
      let data = [];
      // 1. Try full address
      let query = encodeURIComponent(`${address.line1}, ${address.line2}`);
      let res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`);
      data = await res.json();
      
      // 2. Fallback: Try just area and city
      if (!data || data.length === 0) {
        const area = address.line1.split(',')[0]; 
        query = encodeURIComponent(`${area}, ${address.line2}`);
        res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`);
        data = await res.json();
      }

      // 3. Fallback: Try just city/pincode (line 2)
      if (!data || data.length === 0) {
        query = encodeURIComponent(address.line2);
        res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`);
        data = await res.json();
      }

      if (data && data.length > 0) {
        lat = parseFloat(data[0].lat);
        lng = parseFloat(data[0].lon);
      } else {
        console.warn("Geocoding failed on all fallbacks, using default coordinates");
      }
      
      // Override with precise map marker if user placed it
      if (exactLocation) {
        lat = exactLocation[0];
        lng = exactLocation[1];
      }
    } catch (err) {
      console.error("Geocoding error:", err);
    }

    const activeDate = dates[selectedDate];
    const newOrder = {
       
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      customerId: user?.id,
      customerName: user?.fullName || user?.name || 'Valued Customer',
      farmerId: isCombined ? null : (cartItems[0]?.farmerId || null),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      total: parseFloat(finalPrice.toFixed(2)),
      subtotal: parseFloat(rawTotal.toFixed(2)),
      discount: parseFloat(discountAmount.toFixed(2)),
      status: 'Pending',
      farmer: isCombined ? 'Multiple Farmers (Grouped)' : (cartItems[0]?.farmerName || 'Local Farmer'),
      items: cartItems.map(item => ({ ...item, qty: `${item.quantity} ${item.unit}` })),
      smartCombinedApplied: isCombined,
      savingsAmount: savingsAmount,
      distance: distance,
      eta: eta,
      deliveryFee: deliveryCharge,
      pickupRoute: isCombined ? [...uniqueFarmerNames, 'Customer (You)'] : [uniqueFarmerNames[0] || 'Farmer', 'Customer (You)'],
      deliveryDetails: {
        type: DELIVERY_TYPES.find(t => t.id === deliveryType)?.label,
        scheduledDate: `${activeDate.day}, ${activeDate.date} ${activeDate.month}`,
        scheduledSlot: deliveryType === 'express' ? `${eta} Minutes` : activeSlot?.label,
        address: address,
        lat: lat,
        lng: lng,
        instructions: instructions,
        tags: selectedTags,
        paymentMethod: paymentMethod,
        customerName: user?.fullName || user?.name || 'Valued Customer'
      }
    };
    setIsGeocoding(false);
    addOrder(newOrder);
    setOrderPlaced(true);
    clearCart();
    setTimeout(() => navigate('/customer/orders'), 3000);
  };

  if (cartItems.length === 0 && !orderPlaced) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Your cart is empty!</h2>
        <button onClick={() => navigate('/customer/market')} className="bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-forest transition-colors">Go Shopping</button>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-white border border-gray-100 p-12 rounded-3xl shadow-xl flex flex-col items-center text-center max-w-md w-full">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}>
            <FiCheckCircle className="text-primary w-24 h-24 mb-6" />
          </motion.div>
          <h2 className="text-3xl font-black text-gray-900 mb-2">Order Placed!</h2>
          <p className="text-gray-500 mb-8">Your fresh produce will be delivered to you shortly.</p>
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400 mt-4 font-medium">Redirecting to your orders...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8faf9] text-gray-800 font-sans relative overflow-hidden">
      {/* Decorative Light Background Elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Step Indicator */}
      <div className="pt-8 pb-6 flex justify-center relative z-10">
        <div className="flex items-center gap-3">
          {/* Step 1 - Cart */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-md shadow-primary/30">
              <FiCheckCircle size={16} className="text-white" />
            </div>
            <span className="text-gray-600 font-bold text-sm">Cart</span>
          </div>
          <div className="w-12 h-0.5 bg-primary" />
          {/* Step 2 - Delivery */}
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm ${step >= 1 ? 'border-primary bg-primary/10 text-primary' : 'border-gray-300 text-gray-400 bg-white'}`}>2</div>
            <span className={`font-bold text-sm ${step >= 1 ? 'text-primary' : 'text-gray-400'}`}>Delivery</span>
          </div>
          <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-primary' : 'bg-gray-200'}`} />
          {/* Step 3 - Payment */}
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm ${step >= 2 ? 'border-primary bg-primary/10 text-primary' : 'border-gray-300 text-gray-400 bg-white'}`}>3</div>
            <span className={`font-bold text-sm ${step >= 2 ? 'text-gray-800' : 'text-gray-400'}`}>Payment</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT PANEL */}
          <div className="lg:col-span-2 space-y-6">

            {step === 1 && (
              <>
                {/* Delivery Address */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-gray-100 shadow-sm rounded-3xl p-7">
                  <div className="flex items-center gap-2 text-primary font-bold mb-4 text-lg">
                    <FiMapPin /> Delivery Address
                  </div>
                  {isEditingAddress ? (
                    <div className="space-y-4">
                      {/* Leaflet Picker Map */}
                      <div className="relative w-full h-48 sm:h-64 rounded-2xl overflow-hidden border-2 border-primary/20 shadow-inner z-0">
                        <MapContainer center={mapCenter} zoom={13} style={{ width: '100%', height: '100%' }} zoomControl={false}>
                          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                          <FlyToLocation center={mapCenter} />
                          <LocationPickerMarker />
                        </MapContainer>
                        
                        <div className="absolute top-3 right-3 z-[1000]">
                          <button type="button" onClick={handleLocateMe} className="bg-white text-primary border border-primary/20 px-3 py-2 rounded-xl shadow-md font-bold text-xs flex items-center gap-1 hover:bg-primary hover:text-white transition-colors">
                            <FiCrosshair size={14} /> Locate Me
                          </button>
                        </div>
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-gray-900/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider z-[1000] pointer-events-none">
                          Drag marker or tap map to set location
                        </div>
                      </div>

                      <form onSubmit={handleAddressSubmit} className="space-y-4 pt-2">
                        <div className="grid grid-cols-2 gap-3">
                          <input name="type" placeholder="Address Type (Home/Office)" defaultValue={address.title.split(' — ')[0]} required className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                          <input name="house" placeholder="Flat/House No" defaultValue={address.title.split(' — ')[1]} required className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                        </div>
                        <input id="checkout-area-input" name="area" placeholder="Area/Street" defaultValue={address.line1} required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                        <div className="grid grid-cols-2 gap-3">
                          <input id="checkout-city-input" name="city" placeholder="City" defaultValue={address.line2.split(' ')[0]} required className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                          <input id="checkout-pincode-input" name="pincode" placeholder="Pincode" defaultValue={address.line2.split(' ')[1]} required className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                        </div>
                        <div className="flex gap-3 mt-2">
                          <button type="button" onClick={() => setIsEditingAddress(false)} className="flex-1 py-3.5 border border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 transition-colors">Cancel</button>
                          <button type="submit" className="flex-1 py-3.5 bg-primary text-white rounded-xl font-bold shadow-md shadow-primary/20 hover:bg-forest transition-colors">Save Address</button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-gray-900 text-lg">{address.title}</p>
                        <p className="text-gray-500 text-sm mt-1">{address.line1}</p>
                        <p className="text-gray-500 text-sm">{address.line2}</p>
                      </div>
                      <button onClick={() => setIsEditingAddress(true)} className="border-2 border-primary/20 text-primary px-4 py-1.5 rounded-xl text-sm font-bold hover:bg-primary/10 transition-colors">
                        Change
                      </button>
                    </div>
                  )}
                </motion.div>

                {/* Map-Based Route Visualization */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 }}
                  className="bg-white border border-gray-100 shadow-sm rounded-3xl p-7 space-y-5">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-primary font-bold text-lg">
                      <FiMapPin /> Map & Route Optimization
                    </div>
                    <span className="text-xs bg-primary/10 text-primary font-bold px-3 py-1.5 rounded-full border border-primary/20">
                      📍 {distance} KM Away · ⏱️ {eta} Mins
                    </span>
                  </div>
                  
                  {isCombined ? (
                    <div className="bg-primary/5 border border-primary/10 p-5 rounded-2xl space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] bg-primary text-white font-black px-2.5 py-1 rounded-md uppercase tracking-wider">Smart Combined Delivery</span>
                        <span className="text-xs text-primary font-bold">Saved ₹{savingsAmount} in fees!</span>
                      </div>
                      <p className="text-xs text-gray-600 font-medium">
                        Picking up from multiple nearby farmers in one single trip. Optimized Route:
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-700 font-bold overflow-x-auto pb-1">
                        {uniqueFarmerNames.map((name, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 flex-shrink-0">
                            <span className="bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm">🌾 {name}</span>
                            <span className="text-gray-400">➔</span>
                          </div>
                        ))}
                        <span className="bg-forest text-white px-3 py-1.5 rounded-lg shadow-sm">🏠 You</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-100 p-5 rounded-2xl space-y-3">
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Direct Route</p>
                      <div className="flex items-center gap-2 text-xs text-gray-800 font-bold">
                        <span className="bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm">🌾 {uniqueFarmerNames[0] || 'Local Farmer'}</span>
                        <span className="text-gray-400">➔</span>
                        <span className="bg-primary text-white px-3 py-1.5 rounded-lg shadow-sm">🏠 You</span>
                      </div>
                    </div>
                  )}

                  {/* High-Fidelity SVG Route Line Simulation */}
                  <div className="relative h-28 bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden flex items-center justify-between px-10 shadow-inner">
                    <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />
                    
                    <div className="relative flex flex-col items-center z-10">
                      <div className="w-10 h-10 rounded-full bg-white border-2 border-primary flex items-center justify-center text-lg shadow-md">🌾</div>
                      <span className="text-[10px] text-gray-600 mt-2 font-bold uppercase tracking-wider">Farmer</span>
                    </div>

                    {isCombined && (
                      <div className="relative flex flex-col items-center z-10">
                        <div className="w-10 h-10 rounded-full bg-white border-2 border-primary flex items-center justify-center text-lg shadow-md">🌾</div>
                        <span className="text-[10px] text-gray-600 mt-2 font-bold uppercase tracking-wider">Farmer</span>
                      </div>
                    )}

                    {/* Moving Scooter animation */}
                    <div className="absolute left-[42%] animate-pulse z-10 flex flex-col items-center">
                      <div className="bg-primary text-white text-sm p-2 rounded-full shadow-lg shadow-primary/40">
                        🚚
                      </div>
                      <span className="text-[10px] text-primary font-bold mt-1.5">Optimizing...</span>
                    </div>

                    <div className="absolute left-10 right-10 h-0.5 border-t-2 border-dashed border-primary/30 top-[45px] z-0" />

                    <div className="relative flex flex-col items-center z-10">
                      <div className="w-10 h-10 rounded-full bg-forest border-2 border-forest flex items-center justify-center text-lg shadow-md text-white">🏠</div>
                      <span className="text-[10px] text-gray-600 mt-2 font-bold uppercase tracking-wider">Home</span>
                    </div>
                  </div>
                </motion.div>

                {/* Delivery Type */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                  className="bg-white border border-gray-100 shadow-sm rounded-3xl p-7">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex items-center gap-2 text-primary font-bold text-lg">
                      <FiTruck /> Delivery Type
                    </div>
                    <span className="flex items-center gap-1.5 text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-bold border border-primary/20">
                      <span className="w-2 h-2 bg-primary rounded-full inline-block animate-pulse" /> Live
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {DELIVERY_TYPES.map(dt => (
                      <button key={dt.id} onClick={() => {
                        setDeliveryType(dt.id);
                        if (dt.id === 'morning') setSelectedSlot('6-8');
                        if (dt.id === 'evening') setSelectedSlot('4-6');
                        if (dt.id === 'scheduled') setSelectedSlot('6-8');
                      }}
                        className={`relative flex flex-col items-center justify-center gap-1.5 p-5 rounded-2xl border-2 transition-all ${deliveryType === dt.id ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' : 'border-gray-100 hover:border-gray-200 bg-gray-50'}`}>
                        {dt.badge && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] bg-orange-100 text-orange-600 font-black px-2 py-0.5 rounded-full border border-orange-200 shadow-sm whitespace-nowrap">{dt.badge}</span>}
                        <span className={`text-3xl mb-1 ${deliveryType === dt.id ? 'text-primary' : 'text-gray-400'}`}>{dt.icon}</span>
                        <span className={`font-bold text-sm text-center ${deliveryType === dt.id ? 'text-primary' : 'text-gray-700'}`}>{dt.label}</span>
                        <span className="text-gray-500 text-xs font-medium">{dt.sub}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>

                {/* Select Date */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  className={`bg-white border border-gray-100 shadow-sm rounded-3xl p-7 transition-opacity ${deliveryType === 'express' ? 'opacity-50 grayscale pointer-events-none' : 'opacity-100'}`}>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2 text-primary font-bold text-lg">
                      <FiCalendar /> Select Date
                    </div>
                    {deliveryType === 'express' && <span className="text-[10px] bg-orange-100 text-orange-600 px-3 py-1.5 rounded-full font-black uppercase tracking-wider">Not needed for Express</span>}
                  </div>
                  <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                    {dates.map(d => (
                      <button key={d.id} onClick={() => setSelectedDate(d.id)}
                        className={`flex-shrink-0 flex flex-col items-center px-5 py-4 rounded-2xl border-2 transition-all min-w-[85px] ${selectedDate === d.id ? 'border-primary bg-primary text-white shadow-lg shadow-primary/30' : 'border-gray-100 text-gray-500 hover:border-gray-200 bg-gray-50 hover:bg-gray-100'}`}>
                        <span className={`text-xs font-bold uppercase tracking-wider ${selectedDate === d.id ? 'text-white/80' : 'text-gray-400'}`}>{d.day}</span>
                        <span className="text-2xl font-black mt-1">{d.date}</span>
                        <span className={`text-xs font-medium mt-1 ${selectedDate === d.id ? 'text-white/80' : 'text-gray-400'}`}>{d.month}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>

                {/* Time Slots */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                  className={`bg-white border border-gray-100 shadow-sm rounded-3xl p-7 transition-opacity ${deliveryType === 'express' ? 'opacity-50 grayscale pointer-events-none' : 'opacity-100'}`}>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2 text-primary font-bold text-lg">
                      <FiClock /> Select Time Slot
                    </div>
                    <span className="text-gray-500 text-sm font-bold bg-gray-100 px-3 py-1 rounded-full">{availableSlots.filter(s => !s.full).length} slots left</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {availableSlots.map(slot => (
                      <button key={slot.id} disabled={slot.full}
                        onClick={() => !slot.full && setSelectedSlot(slot.id)}
                        className={`relative flex items-center justify-center px-4 py-4 rounded-xl border-2 text-sm font-bold transition-all ${slot.full ? 'border-gray-200 text-gray-400 cursor-not-allowed line-through bg-gray-50' : selectedSlot === slot.id ? 'border-primary bg-primary/5 text-primary shadow-sm' : 'border-gray-100 text-gray-600 hover:border-gray-300 bg-white'}`}>
                        {slot.full && (
                          <span className="absolute -top-2.5 right-2 bg-red-100 text-red-600 text-[10px] font-black px-2 py-0.5 rounded-full border border-red-200 shadow-sm">Full</span>
                        )}
                        {selectedSlot === slot.id && !slot.full && (
                          <FiCheckCircle className="text-primary mr-2 flex-shrink-0" size={16} />
                        )}
                        {slot.label}
                      </button>
                    ))}
                  </div>
                  {activeSlot && !activeSlot.full && (
                    <div className="mt-5 flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl px-5 py-3 text-primary text-sm font-bold">
                      <FiCheckCircle size={16} /> Slot confirmed — <span className="text-forest font-black">{activeSlot.label}</span>
                    </div>
                  )}
                </motion.div>

                {/* Delivery Instructions */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  className="bg-white border border-gray-100 shadow-sm rounded-3xl p-7">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2 text-primary font-bold text-lg">
                      <FiEdit2 size={18} /> Delivery Instructions
                    </div>
                    <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Optional</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {QUICK_TAGS.map(tag => (
                      <button key={tag} onClick={() => toggleTag(tag)}
                        className={`px-4 py-2 rounded-full border-2 text-sm font-bold transition-all ${selectedTags.includes(tag) ? 'border-primary bg-primary/10 text-primary' : 'border-gray-100 text-gray-500 hover:border-gray-300 bg-white'}`}>
                        {tag}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={instructions}
                    onChange={e => setInstructions(e.target.value)}
                    rows={3}
                    placeholder="Any special instructions for your delivery partner..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-800 placeholder-gray-400 resize-none outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm font-medium"
                  />
                </motion.div>

                <button onClick={() => setStep(2)}
                  className="w-full py-4.5 bg-gradient-to-r from-primary to-forest hover:shadow-xl text-white font-black text-lg rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-primary/30 hover:-translate-y-0.5">
                  Proceed to Payment <FiArrowRight size={20} />
                </button>
              </>
            )}

            {step === 2 && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-gray-100 shadow-sm rounded-3xl p-7 space-y-6">
                <div className="flex items-center gap-2 text-primary font-bold text-lg mb-4">
                  <FiCreditCard /> Payment Method
                </div>
                {['UPI (Google Pay, PhonePe)', 'Credit / Debit Card', 'Cash on Delivery'].map(method => (
                  <label key={method}
                    className={`flex items-center gap-4 p-5 border-2 rounded-2xl cursor-pointer transition-all ${paymentMethod === method ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' : 'border-gray-100 hover:border-gray-200 bg-gray-50'}`}>
                    <input type="radio" name="payment" value={method} checked={paymentMethod === method}
                      onChange={e => { setPaymentMethod(e.target.value); setPaymentError(''); }} className="w-5 h-5 accent-primary" />
                    <span className="font-bold text-gray-800 text-base">{method}</span>
                  </label>
                ))}
                {paymentError && (
                  <div className="text-red-600 text-sm font-bold bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 inline-block" /> {paymentError}
                  </div>
                )}
                <div className="flex gap-4 pt-4">
                  <button onClick={() => setStep(1)}
                    className="flex-1 py-4.5 border-2 border-gray-200 rounded-2xl text-gray-600 font-bold hover:bg-gray-50 hover:border-gray-300 transition-all text-lg">
                    ← Back
                  </button>
                  <button onClick={handlePlaceOrder}
                    className="flex-[2] py-4.5 bg-gradient-to-r from-primary to-forest text-white font-black text-lg rounded-2xl transition-all shadow-lg shadow-primary/30 hover:shadow-xl hover:-translate-y-0.5">
                    Pay ₹{finalPrice.toFixed(2)} & Place Order
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* RIGHT PANEL - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-100 shadow-md rounded-3xl p-7 sticky top-6 space-y-6">
              <h3 className="text-gray-900 font-black text-xl border-b border-gray-100 pb-4">Order Summary</h3>

              {/* Items list */}
              <div className="space-y-4 max-h-[260px] overflow-y-auto scrollbar-hide pr-2">
                {cartItems.map((item, i) => (
                  <div key={i} className="flex justify-between items-start text-sm">
                    <span className="text-gray-600 flex-1 pr-3 font-medium leading-tight">
                      {item.name} <span className="text-gray-400 font-bold ml-1">×{item.quantity}</span>
                    </span>
                    <span className="text-gray-900 font-black flex-shrink-0">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {isCombined && (
                <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 text-xs space-y-1.5 shadow-inner">
                  <div className="flex items-center gap-2 text-primary font-bold">
                    <FiTruck size={16} /> Smart Combined Delivery
                  </div>
                  <div className="text-gray-600 font-medium">
                    Pickup route optimized. Savings of <span className="text-primary font-black bg-white px-1.5 py-0.5 rounded shadow-sm inline-block">₹{savingsAmount}</span> applied!
                  </div>
                </div>
              )}

              <div className="border-t border-gray-100 pt-5 space-y-3.5 text-sm">
                <div className="flex justify-between text-gray-500 font-medium">
                  <span>Subtotal</span><span className="text-gray-800 font-bold">₹{rawTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-500 font-medium">
                  <span>Distance (Map-calculated)</span>
                  <span className="text-gray-800 font-bold">{distance} KM</span>
                </div>
                <div className="flex justify-between text-gray-500 font-medium">
                  <span>Delivery Fee</span>
                  <span className="text-primary font-black">₹{deliveryCharge.toFixed(2)}</span>
                </div>
                {savingsAmount > 0 && (
                  <div className="flex justify-between text-primary font-black bg-primary/5 px-3 py-2 rounded-lg border border-primary/10">
                    <span>Combined Savings</span>
                    <span>-₹{savingsAmount}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-500 font-medium">
                  <span>Platform Fee</span>
                  <span className="text-gray-800 font-bold">₹{platformFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-500 font-medium items-center">
                  <span className="flex items-center gap-1.5">GST <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-black border border-gray-200">5%</span></span>
                  <span className="text-gray-800 font-bold">₹{gstAmount.toFixed(2)}</span>
                </div>
                {discountPercent > 0 && (
                  <div className="flex justify-between text-primary font-black bg-primary/5 px-3 py-2 rounded-lg border border-primary/10">
                    <span>Bulk Discount ({discountPercent * 100}%)</span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-500 font-bold text-xs items-center bg-orange-50 px-3 py-2 rounded-lg border border-orange-100">
                  <span>Estimated Time</span>
                  <span className="text-orange-600 font-black text-sm">
                    ~{eta} Mins
                  </span>
                </div>
              </div>

              <div className="border-t-2 border-gray-100 pt-5 flex justify-between items-center">
                <span className="text-gray-900 font-black text-xl">Total</span>
                <span className="text-primary font-black text-3xl tracking-tight">₹{finalPrice.toFixed(2)}</span>
              </div>

              <button onClick={() => step === 1 ? setStep(2) : handlePlaceOrder()} disabled={isGeocoding}
                className="w-full py-4.5 bg-gradient-to-r from-primary to-forest hover:shadow-xl text-white font-black rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-primary/30 text-lg hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed">
                {step === 1 ? 'Proceed to Payment' : isGeocoding ? 'Locating...' : `Pay ₹${finalPrice.toFixed(2)}`} <FiArrowRight size={20} />
              </button>

              {/* Info badges */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2.5 bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-green-700 text-xs font-bold">
                  <LuLeaf size={16} className="text-green-600 flex-shrink-0" /> Eco-Friendly Packaging & Carbon Neutral
                </div>
                <div className="flex items-center gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-blue-700 text-xs font-bold">
                  <FiCloud size={16} className="text-blue-600 flex-shrink-0" /> Covered delivery for freshness assured
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
