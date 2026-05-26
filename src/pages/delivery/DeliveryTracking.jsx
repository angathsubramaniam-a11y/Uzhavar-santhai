import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { FiArrowLeft, FiNavigation, FiClock, FiMapPin } from 'react-icons/fi';
import { useOrders } from '../../context/OrdersContext';

// Fix Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const riderIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3209/3209935.png', // Scooter icon
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -38]
});

const customerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png', // Default icon for customer
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  className: 'hue-rotate-[150deg] filter' // Make it green/redish
});

const farmerIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3082/3082008.png', // Shop/farm icon
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36]
});

// Component to dynamically update map bounds
function ChangeView({ bounds }) {
  const map = useMap();
  if (bounds) {
    map.fitBounds(bounds, { padding: [50, 50] });
  }
  return null;
}

export default function DeliveryTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { orders, loading } = useOrders();

  const [riderLocation, setRiderLocation] = useState(null);
  const [route, setRoute] = useState(null);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState('');

  const order = orders.find(o => String(o.id) === String(id));

  // 1. Get customer and pickup locations safely
  const customerLat = order?.deliveryDetails?.lat || 11.0168;
  const customerLng = order?.deliveryDetails?.lng || 76.9558;
  const customerLoc = [customerLat, customerLng];
  const pickupLoc = [11.0045, 76.9616]; // Default Uzhavar Santhai Market Hub
  const orderStatus = order?.status || 'Pending';

  // 2. Track rider location
  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setRiderLocation([latitude, longitude]);
      },
      (err) => {
        console.error(err);
        setError('Unable to retrieve your location');
        // Fallback for demo: near the customer
        setRiderLocation([customerLat - 0.02, customerLng - 0.02]);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [customerLat, customerLng]);

  // 3. Fetch route from OSRM when riderLocation updates
  useEffect(() => {
    if (!riderLocation) return;
    
    const fetchRoute = async () => {
      try {
        const [rLat, rLng] = riderLocation;
        // OSRM expects: lon,lat
        let url = `https://router.project-osrm.org/route/v1/driving/${rLng},${rLat};${customerLng},${customerLat}?overview=full&geometries=geojson`;
        
        // If order is Pending, the rider needs to go to the Pickup Location first
        if (orderStatus === 'Pending') {
          url = `https://router.project-osrm.org/route/v1/driving/${rLng},${rLat};${pickupLoc[1]},${pickupLoc[0]};${customerLng},${customerLat}?overview=full&geometries=geojson`;
        }

        const res = await fetch(url);
        const data = await res.json();
        
        if (data.routes && data.routes.length > 0) {
          const routeData = data.routes[0];
          // OSRM returns coordinates as [lon, lat], Leaflet polyline needs [lat, lon]
          const coordinates = routeData.geometry.coordinates.map(coord => [coord[1], coord[0]]);
          setRoute(coordinates);
          setDistance((routeData.distance / 1000).toFixed(1)); // km
          setDuration(Math.round(routeData.duration / 60)); // mins
        }
      } catch (err) {
        console.error("Error fetching route:", err);
      }
    };

    fetchRoute();
    // Update route every 10 seconds
    const interval = setInterval(fetchRoute, 10000);
    return () => clearInterval(interval);
  }, [riderLocation, customerLat, customerLng, orderStatus, pickupLoc[0], pickupLoc[1]]);

  if (loading) {
    return <div className="h-screen flex items-center justify-center bg-gray-50"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!order) {
    return <div className="p-8 text-center">Order not found</div>;
  }

  const bounds = riderLocation && route 
    ? L.latLngBounds([riderLocation, customerLoc, ...(order.status === 'Pending' ? [pickupLoc] : [])]) 
    : null;

  const openNavigation = () => {
    if (riderLocation) {
      // If pending, navigate to pickup, else navigate to customer
      const destLat = order.status === 'Pending' ? pickupLoc[0] : customerLat;
      const destLng = order.status === 'Pending' ? pickupLoc[1] : customerLng;
      const url = `https://www.google.com/maps/dir/?api=1&origin=${riderLocation[0]},${riderLocation[1]}&destination=${destLat},${destLng}&travelmode=driving`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 relative font-sans">
      {/* Header */}
      <div className="bg-white px-4 py-4 shadow-md z-[1000] flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
            <FiArrowLeft size={20} className="text-gray-700" />
          </button>
          <div>
            <h1 className="font-black text-gray-900 leading-tight">Delivery Tracking</h1>
            <p className="text-xs text-gray-500 font-bold">{order.id}</p>
          </div>
        </div>
        <button onClick={openNavigation} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold shadow-md hover:bg-blue-700 active:scale-95 transition-all text-sm">
          <FiNavigation /> <span className="hidden sm:inline">Navigate</span>
        </button>
      </div>

      {/* Error Bar */}
      {error && (
        <div className="bg-red-100 text-red-600 px-4 py-2 text-xs font-bold z-[1000] text-center border-b border-red-200">
          {error}
        </div>
      )}

      {/* Map Container */}
      <div className="flex-1 relative z-0">
        {!riderLocation && !error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 z-10">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-500 font-bold">Getting your location...</p>
          </div>
        ) : (
          <MapContainer 
            center={customerLoc} 
            zoom={13} 
            style={{ width: '100%', height: '100%', minHeight: '400px' }}
            className="absolute inset-0 z-0"
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {bounds && <ChangeView bounds={bounds} />}

            {riderLocation && (
              <Marker position={riderLocation} icon={riderIcon}>
                <Popup className="font-bold">You (Rider)</Popup>
              </Marker>
            )}

            {order.status === 'Pending' && (
              <Marker position={pickupLoc} icon={farmerIcon}>
                <Popup>
                  <div className="font-bold text-gray-800">Uzhavar Santhai Market</div>
                  <div className="text-xs text-gray-500">Pickup Location</div>
                </Popup>
              </Marker>
            )}

            <Marker position={customerLoc} icon={customerIcon}>
              <Popup>
                <div className="font-bold text-gray-800">{order.customerName}</div>
                <div className="text-xs text-gray-500">{order.deliveryDetails?.address?.line1 || 'Delivery Location'}</div>
              </Popup>
            </Marker>

            {route && (
              <Polyline positions={route} color="#2563eb" weight={5} opacity={0.7} dashArray="10, 10" />
            )}
          </MapContainer>
        )}
      </div>

      {/* Bottom Info Sheet */}
      <div className="bg-white p-5 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-[1000] flex flex-col gap-4">
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-2" />
        
        <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
          <div className="flex flex-col items-center">
            <span className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Est. Distance</span>
            <div className="flex items-center gap-1 text-gray-900 font-black text-xl">
              <FiMapPin className="text-primary" size={18} /> {distance} <span className="text-sm">km</span>
            </div>
          </div>
          <div className="w-px h-10 bg-gray-200" />
          <div className="flex flex-col items-center">
            <span className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Est. Time</span>
            <div className="flex items-center gap-1 text-gray-900 font-black text-xl">
              <FiClock className="text-orange-500" size={18} /> {duration} <span className="text-sm">min</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-black text-gray-900 text-lg mb-1">{order.customerName}</h3>
          <p className="text-sm text-gray-600 font-medium">{order.deliveryDetails?.address?.title}</p>
          <p className="text-xs text-gray-500">{order.deliveryDetails?.address?.line1}, {order.deliveryDetails?.address?.line2}</p>
        </div>
      </div>
    </div>
  );
}
