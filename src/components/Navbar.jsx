import { Link, useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiShoppingCart, FiUser, FiLogOut, FiSun, FiMoon } from 'react-icons/fi';
import { GiSprout } from 'react-icons/gi';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="fixed w-full z-50 glass-card transition-all duration-300 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          {/* ... logo ... */}
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2 group">
              <span className="text-3xl transition-transform group-hover:scale-110 text-primary"><GiSprout /></span>
              <span className="font-bold text-2xl text-gradient tracking-tight">Uzhavar Sandhai</span>
            </Link>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-earth hover:text-primary font-medium transition-colors">Home</Link>
            <Link to="/products" className="text-earth hover:text-primary font-medium transition-colors">Market</Link>
            
            <button 
              onClick={toggleTheme}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-earth hover:text-primary transition-all"
            >
              {isDarkMode ? <FiSun /> : <FiMoon />}
            </button>

            {user ? (
              <>
                {user.role === 'customer' && (
                  <>
                    <Link to="/customer/orders" className="text-earth hover:text-primary font-medium transition-colors">My Orders</Link>
                    <Link to="/customer/cart" aria-label="View shopping cart" className="relative p-2 text-earth hover:text-primary transition-colors">
                      <FiShoppingCart size={22} />
                      {cartCount > 0 && (
                        <span className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm animate-bounce">
                          {cartCount}
                        </span>
                      )}
                    </Link>
                    <Link to="/customer/home" className="text-earth hover:text-primary font-medium transition-colors">My Portal</Link>
                  </>
                )}
                {user.role === 'farmer' && (
                  <Link to="/farmer/dashboard" className="text-earth hover:text-primary font-medium transition-colors">Farmer Dashboard</Link>
                )}
                {user.role === 'delivery' && (
                  <Link to="/delivery/dashboard" className="text-earth hover:text-primary font-medium transition-colors">Rider Dashboard</Link>
                )}

                <div className="h-6 w-px bg-gray-200 mx-2"></div>
                <button onClick={handleLogout} aria-label="Logout" className="flex items-center gap-2 text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl transition-all font-medium">
                  <FiLogOut /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/customer/login" className="px-6 py-2 text-earth font-medium hover:text-primary transition-colors">Login</Link>
                <Link to="/customer/signup" className="px-6 py-2 rounded-full bg-gradient-to-r from-primary to-secondary text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all font-medium">Join Now</Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            <button onClick={toggleTheme} aria-label="Toggle theme" className="p-2 text-earth">
              {isDarkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
            </button>
            <button onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu" className="text-earth hover:text-primary p-2">
              {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden glass-card absolute w-full pb-4 shadow-xl animate-slide-down">
          <div className="px-4 pt-2 pb-3 space-y-2 flex flex-col">
            <Link to="/" className="px-3 py-2 text-earth hover:bg-primary/10 rounded-lg font-medium">Home</Link>
            <Link to="/products" className="px-3 py-2 text-earth hover:bg-primary/10 rounded-lg font-medium">Market</Link>
            
            <button 
              onClick={toggleTheme}
              className="px-3 py-2 text-earth hover:bg-primary/10 rounded-lg font-medium flex items-center gap-2"
            >
              {isDarkMode ? <FiSun /> : <FiMoon />} {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
            
            {user ? (
              <>
                <div className="h-px bg-gray-200 my-2"></div>
                {user.role === 'customer' && (
                  <>
                    <Link to="/customer/orders" className="px-3 py-2 text-earth hover:bg-primary/10 rounded-lg font-medium">My Orders</Link>
                    <Link to="/customer/cart" className="px-3 py-2 text-earth hover:bg-primary/10 rounded-lg font-medium flex items-center gap-2">
                      <FiShoppingCart /> Cart ({cartCount})
                    </Link>
                    <Link to="/customer/home" className="px-3 py-2 text-earth hover:bg-primary/10 rounded-lg font-medium">My Portal</Link>
                  </>
                )}
                {user.role === 'farmer' && (
                  <Link to="/farmer/dashboard" className="px-3 py-2 text-earth hover:bg-primary/10 rounded-lg font-medium">Farmer Dashboard</Link>
                )}
                {user.role === 'delivery' && (
                  <Link to="/delivery/dashboard" className="px-3 py-2 text-earth hover:bg-primary/10 rounded-lg font-medium">Rider Dashboard</Link>
                )}

                <button onClick={handleLogout} className="px-3 py-2 text-red-500 font-medium flex items-center gap-2">
                  <FiLogOut /> Logout
                </button>
              </>
            ) : (
              <>
                <div className="h-px bg-gray-200 my-2"></div>
                <Link to="/customer/login" className="px-3 py-2 text-primary bg-primary/5 rounded-lg font-medium">Login</Link>
                <Link to="/customer/signup" className="px-3 py-2 text-primary font-medium">Signup</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
