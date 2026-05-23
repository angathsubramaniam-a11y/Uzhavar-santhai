import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiSearch, FiShoppingCart, FiPackage, FiUser } from 'react-icons/fi';
import { useCart } from '../context/CartContext';

export default function CustomerBottomNav() {
  const location = useLocation();
  const { cartCount } = useCart();

  const navItems = [
    { path: '/customer/home', label: 'Home', icon: <FiHome size={20} /> },
    { path: '/products', label: 'Search', icon: <FiSearch size={20} /> },
    { path: '/customer/cart', label: 'Cart', icon: (
      <div className="relative">
        <FiShoppingCart size={20} />
        {cartCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center">
            {cartCount}
          </span>
        )}
      </div>
    )},
    { path: '/customer/orders', label: 'Orders', icon: <FiPackage size={20} /> },
    { path: '/customer/profile', label: 'Profile', icon: <FiUser size={20} /> }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-150 py-2 px-2 flex justify-around items-center z-40 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path || 
          (item.path === '/customer/home' && location.pathname === '/customer/market');
        return (
          <Link
            key={item.label}
            to={item.path}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition-all ${isActive ? 'text-primary' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <span className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-gray-500'}`}>
              {item.icon}
            </span>
            <span className="mt-0.5">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
