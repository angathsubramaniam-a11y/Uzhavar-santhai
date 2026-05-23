import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiMapPin, FiPhone, FiMail, FiEdit3, FiSave, FiX, FiCamera, FiShield, FiArrowLeft } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useCustomers } from '../../context/CustomerContext';
import CustomerBottomNav from '../../components/CustomerBottomNav';

export default function CustomerProfile() {
  const { user, login, logout } = useAuth();
  const { updateCustomer } = useCustomers();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [passwordMsg, setPasswordMsg] = useState(null);
  const [formData, setFormData] = useState({
    name: user?.fullName || user?.name || 'Suresh Kumar',
    email: user?.email || 'suresh.kumar@example.com',
    phone: user?.phone || '+91 98765 43210',
    location: user?.location || '12, RS Puram, Coimbatore, Tamil Nadu - 641002',
    image: user?.image || 'https://images.unsplash.com/photo-1595856728032-47d06634b070?w=400&auto=format&fit=crop&fm=webp'
  });

  const handleSave = () => {
    const updatedUser = { ...user, ...formData, fullName: formData.name };
    login(updatedUser);
    if (updatedUser.id) {
      updateCustomer(updatedUser);
    }
    setIsEditing(false);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordData.new !== passwordData.confirm) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (passwordData.new.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }
    login({ ...user, password: passwordData.new });
    setPasswordMsg({ type: 'success', text: 'Password updated successfully' });
    setPasswordData({ current: '', new: '', confirm: '' });
    setTimeout(() => { setPasswordMsg(null); setShowPasswordForm(false); }, 2000);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50/50 py-12 pb-28 px-4 relative overflow-hidden font-sans">
      {/* Decorative blurred background shapes */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>

      <div className="max-w-4xl mx-auto space-y-6 relative z-10">
        
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 font-bold hover:text-primary transition-colors bg-white/50 backdrop-blur-md px-4 py-2 rounded-xl shadow-sm w-max hover:-translate-x-1"
        >
          <FiArrowLeft /> Back
        </button>

        {/* Profile Card with Glassmorphism */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/80 overflow-hidden"
        >
          {/* Top Banner Area */}
          <div className="h-32 bg-gradient-to-r from-primary/80 to-secondary/80 relative">
             <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
          </div>

          <div className="px-8 pb-8 sm:px-12 sm:pb-12">
            {/* Avatar & Action Button Row */}
            <div className="flex flex-col sm:flex-row justify-between items-center sm:items-end -mt-16 mb-8 gap-6">
              
              {/* Profile Image with Hover Effects */}
              <div className="relative group">
                <div className="w-32 h-32 rounded-full p-1.5 bg-white shadow-xl transition-transform duration-500 group-hover:scale-105">
                  <img 
                    src={formData.image || 'https://placehold.co/400x400/eeeeee/999999?text=No+Image'} 
                    alt="Profile" 
                    className="w-full h-full rounded-full object-cover"
                   loading="lazy" decoding="async" onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x400/eeeeee/999999?text=No+Image"; }} />
                  {isEditing && (
                    <div className="absolute inset-1.5 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <FiCamera className="text-white text-2xl" />
                    </div>
                  )}
                </div>
                {/* Online Status Dot */}
                <div className="absolute bottom-3 right-3 w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
              </div>

              {/* Edit / Save Actions */}
              <div className="flex w-full sm:w-auto justify-center">
                {isEditing ? (
                  <div className="flex gap-3">
                    <button onClick={() => setIsEditing(false)} className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-all shadow-sm">
                      <FiX /> Cancel
                    </button>
                    <button onClick={handleSave} className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-primary text-white font-bold hover:bg-primary-light transition-all shadow-glow hover:-translate-y-0.5">
                      <FiSave /> Save Changes
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setIsEditing(true)} className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-white border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 hover:shadow-md transition-all">
                    <FiEdit3 /> Edit Profile
                  </button>
                )}
              </div>
            </div>

            {/* Profile Info Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              
              {/* Left Column: Primary Identity */}
              <div className="lg:col-span-4 space-y-6 text-center sm:text-left">
                <div>
                  {isEditing ? (
                    <input 
                      type="text" 
                      name="name" 
                      value={formData.name} 
                      onChange={handleChange} 
                      className="w-full text-3xl font-black text-gray-800 bg-white border border-gray-200 rounded-xl px-4 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-center sm:text-left" 
                    />
                  ) : (
                    <h2 className="text-3xl font-black text-gray-800 tracking-tight">{user?.fullName || user?.name || formData.name}</h2>
                  )}
                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                    <FiShield className="text-primary" />
                    <span className="text-primary font-bold tracking-wide">Premium Member</span>
                  </div>
                </div>

                {isEditing && (
                  <div className="text-left bg-gray-50 p-4 rounded-2xl border border-gray-100 shadow-inner">
                    <label className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2 block flex items-center gap-2">
                      <FiCamera /> Upload Profile Photo
                    </label>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleImageUpload} 
                      className="w-full text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer" 
                    />
                  </div>
                )}
              </div>

              {/* Right Column: Detailed Information */}
              <div className="lg:col-span-8">
                <div className="bg-white/50 rounded-3xl p-1 shadow-sm border border-gray-100 backdrop-blur-md">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    
                    {/* Email Block */}
                    <div className="p-5 rounded-2xl hover:bg-white transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                          <FiMail />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Email Address</div>
                          {isEditing ? (
                            <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full font-bold text-gray-800 bg-white border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-primary transition-colors" />
                          ) : (
                            <div className="font-bold text-gray-800">{user?.email || formData.email}</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Phone Block */}
                    <div className="p-5 rounded-2xl hover:bg-white transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-green-50 text-green-500 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                          <FiPhone />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Phone Number</div>
                          {isEditing ? (
                            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full font-bold text-gray-800 bg-white border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-primary transition-colors" />
                          ) : (
                            <div className="font-bold text-gray-800">{user?.phone || formData.phone}</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Location Block (Full Width) */}
                    <div className="p-5 rounded-2xl hover:bg-white transition-colors group md:col-span-2">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center text-xl group-hover:scale-110 transition-transform flex-shrink-0">
                          <FiMapPin />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1 mt-1">Delivery Address</div>
                          {isEditing ? (
                            <textarea 
                              name="location" 
                              value={formData.location} 
                              onChange={handleChange} 
                              rows={2}
                              className="w-full font-bold text-gray-800 bg-white border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-primary transition-colors resize-none" 
                            />
                          ) : (
                            <div className="font-bold text-gray-800 leading-relaxed">{user?.location || formData.location}</div>
                          )}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

            </div>
          </div>
        </motion.div>

        {/* Security / Logout Panel */}
        <div className="flex flex-col gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="flex flex-col sm:flex-row justify-between items-center bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/80 shadow-[0_4px_20px_rgb(0,0,0,0.03)]"
          >
            <div className="text-sm font-bold text-gray-500 mb-4 sm:mb-0">
              Account created in 2024 • Secured by Uzhavar Sandhai
            </div>
            <div className="flex gap-4 w-full sm:w-auto">
              <button onClick={() => setShowPasswordForm(!showPasswordForm)} className={`flex-1 sm:flex-none px-6 py-2.5 rounded-full font-bold transition-colors text-sm ${showPasswordForm ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                Change Password
              </button>
              <button onClick={logout} className="flex-1 sm:flex-none px-6 py-2.5 bg-red-50 text-red-600 rounded-full font-bold hover:bg-red-100 transition-colors text-sm">
                Sign Out
              </button>
            </div>
          </motion.div>

          {showPasswordForm && (
            <motion.form 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              onSubmit={handlePasswordSubmit} 
              className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-white/80 shadow-[0_4px_20px_rgb(0,0,0,0.03)] max-w-md mx-auto w-full space-y-4"
            >
              <h3 className="font-bold text-gray-800 text-lg mb-4">Change Password</h3>
              {passwordMsg && <div className={`text-sm font-bold p-3 rounded-xl ${passwordMsg.type === 'error' ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50'}`}>{passwordMsg.text}</div>}
              
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Current Password</label>
                <input type="password" value={passwordData.current} onChange={e => setPasswordData({...passwordData, current: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-primary" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">New Password</label>
                <input type="password" value={passwordData.new} onChange={e => setPasswordData({...passwordData, new: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-primary" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Confirm New Password</label>
                <input type="password" value={passwordData.confirm} onChange={e => setPasswordData({...passwordData, confirm: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-primary" required />
              </div>
              
              <button type="submit" className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary-light transition-colors mt-2">
                Update Password
              </button>
            </motion.form>
          )}
        </div>

      </div>
      <CustomerBottomNav />
    </div>
  );
}
