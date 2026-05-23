import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiMapPin, FiPhone, FiMail, FiEdit3, FiShield, FiSave, FiX, FiCamera, FiStar } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useFarmers } from '../../context/FarmerContext';
import { useProducts } from '../../context/ProductContext';

export default function FarmerProfile() {
  const { user, login } = useAuth();
  const { updateFarmer } = useFarmers();
  const { updateFarmerProducts } = useProducts();
  const [isEditing, setIsEditing] = useState(false);
  
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [passwordMsg, setPasswordMsg] = useState(null);

  const [showBankForm, setShowBankForm] = useState(false);
  const [bankData, setBankData] = useState({ 
    accountName: user?.bankDetails?.accountName || '', 
    accountNumber: user?.bankDetails?.accountNumber || '', 
    ifsc: user?.bankDetails?.ifsc || '' 
  });
  const [bankMsg, setBankMsg] = useState(null);
  const [formData, setFormData] = useState({
    name: user?.name || 'Farmer',
    farmName: user?.farmName || 'Your Farm',
    location: user?.location || 'Tamil Nadu',
    phone: user?.phone || 'Not provided',
    email: user?.email || 'Not provided',
    image: user?.image || 'https://images.unsplash.com/photo-1595856728032-47d06634b070?w=200&auto=format&fit=crop&fm=webp'
  });

  const handleSave = () => {
    const updatedUser = { ...user, ...formData };
    login(updatedUser);
    updateFarmer(user.id, formData);
    updateFarmerProducts(user.id, formData);
    setIsEditing(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleProfileImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const profileData = {
    ...formData,
    joined: 'Jan 2024',
    rating: user?.rating || 4.5,
    certifications: ['FSSAI Certified', '100% Fresh Verified', 'State Agri Board']
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
    updateFarmer(user.id, { password: passwordData.new });
    setPasswordMsg({ type: 'success', text: 'Password updated successfully' });
    setPasswordData({ current: '', new: '', confirm: '' });
    setTimeout(() => { setPasswordMsg(null); setShowPasswordForm(false); }, 2000);
  };

  const handleBankSubmit = (e) => {
    e.preventDefault();
    if (!bankData.accountName || !bankData.accountNumber || !bankData.ifsc) {
      setBankMsg({ type: 'error', text: 'All fields are required' });
      return;
    }
    login({ ...user, bankDetails: bankData });
    updateFarmer(user.id, { bankDetails: bankData });
    setBankMsg({ type: 'success', text: 'Bank details updated successfully' });
    setTimeout(() => { setBankMsg(null); setShowBankForm(false); }, 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">My Profile</h2>
        {isEditing ? (
          <div className="flex gap-3">
            <button onClick={() => setIsEditing(false)} className="flex items-center gap-2 bg-white text-red-500 border border-red-200 px-4 py-2 rounded-xl font-bold shadow-sm hover:bg-red-50 transition-colors">
              <FiX /> Cancel
            </button>
            <button onClick={handleSave} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl font-bold shadow-sm hover:bg-primary-light transition-colors">
              <FiSave /> Save Changes
            </button>
          </div>
        ) : (
          <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-xl font-bold shadow-sm hover:bg-gray-50 transition-colors">
            <FiEdit3 /> Edit Profile
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Cover Image */}
        <div className="h-48 bg-gradient-to-r from-primary to-primary-light relative">
          <img src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1000&auto=format&fit=crop&fm=webp" className="w-full h-full object-cover opacity-50 mix-blend-overlay" alt="Farm Cover"  loading="lazy" decoding="async" onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x400/eeeeee/999999?text=No+Image"; }} />
          <div className="absolute -bottom-16 left-8">
            <div className={`relative group w-32 h-32 rounded-full border-4 border-white shadow-lg bg-white overflow-hidden ${isEditing ? 'cursor-pointer' : ''}`}>
              <img src={profileData.image || 'https://placehold.co/400x400/eeeeee/999999?text=No+Image'} className="w-full h-full object-cover" alt="Profile"  loading="lazy" decoding="async" onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x400/eeeeee/999999?text=No+Image"; }} />
              {isEditing && (
                <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10">
                  <FiCamera className="text-white w-6 h-6 mb-1" />
                  <span className="text-white text-[10px] font-bold">CHANGE</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleProfileImageUpload} />
                </label>
              )}
            </div>
          </div>
        </div>

        <div className="pt-20 px-8 pb-8">
          <div className="flex justify-between items-start mb-8">
            <div className="w-full max-w-lg">
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 font-bold uppercase">Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full text-xl font-black text-gray-800 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-bold uppercase">Farm Name</label>
                    <input type="text" name="farmName" value={formData.farmName} onChange={handleChange} className="w-full text-lg font-medium text-primary bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-primary" />
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-3xl font-black text-gray-800">{profileData.name}</h3>
                  <div className="text-lg font-medium text-primary mt-1">{profileData.farmName}</div>
                </>
              )}
            </div>
            {!isEditing && (
              <div className="bg-green-100 text-green-700 px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-sm">
                <span className="text-xl text-sun fill-current"><FiStar /></span> {profileData.rating} Rating
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Contact Details */}
            <div className="space-y-6">
              <h4 className="text-sm font-black text-gray-400 uppercase tracking-wider">Contact Information</h4>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500"><FiPhone /></div>
                  <div>
                    <div className="text-xs text-gray-500 font-medium">Phone Number</div>
                    {isEditing ? (
                      <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="font-bold text-gray-800 bg-white border border-gray-200 rounded px-2 py-1 outline-none focus:border-primary w-full mt-1" />
                    ) : (
                      <div className="font-bold text-gray-800">{profileData.phone}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500"><FiMail /></div>
                  <div>
                    <div className="text-xs text-gray-500 font-medium">Email Address</div>
                    {isEditing ? (
                      <input type="email" name="email" value={formData.email} onChange={handleChange} className="font-bold text-gray-800 bg-white border border-gray-200 rounded px-2 py-1 outline-none focus:border-primary w-full mt-1" />
                    ) : (
                      <div className="font-bold text-gray-800">{profileData.email}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500"><FiMapPin /></div>
                  <div className="w-full">
                    <div className="text-xs text-gray-500 font-medium">Farm Address</div>
                    {isEditing ? (
                      <input type="text" name="location" value={formData.location} onChange={handleChange} className="font-bold text-gray-800 bg-white border border-gray-200 rounded px-2 py-1 outline-none focus:border-primary w-full mt-1" />
                    ) : (
                      <div className="font-bold text-gray-800">{profileData.location}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Certifications */}
            <div className="space-y-6">
              <h4 className="text-sm font-black text-gray-400 uppercase tracking-wider">Certifications & Badges</h4>
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
                {profileData.certifications.map((cert, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <FiShield className="text-primary text-xl" />
                    <span className="font-bold text-gray-700">{cert}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Account Settings */}
          <div className="mt-12 pt-8 border-t border-gray-100">
            <h4 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-6">Account Settings</h4>
            <div className="flex flex-wrap gap-4 mb-6">
              <button onClick={() => { setShowPasswordForm(!showPasswordForm); setShowBankForm(false); }} className={`px-6 py-2.5 rounded-xl font-bold transition-colors ${showPasswordForm ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Change Password</button>
              <button onClick={() => { setShowBankForm(!showBankForm); setShowPasswordForm(false); }} className={`px-6 py-2.5 rounded-xl font-bold transition-colors ${showBankForm ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Update Bank Details</button>
            </div>

            {showPasswordForm && (
              <form onSubmit={handlePasswordSubmit} className="bg-gray-50 p-6 rounded-2xl border border-gray-200 max-w-md animate-fade-in space-y-4">
                <h5 className="font-bold text-gray-800">Change Password</h5>
                {passwordMsg && <div className={`text-sm font-bold p-2 rounded ${passwordMsg.type === 'error' ? 'text-red-600 bg-red-100' : 'text-green-600 bg-green-100'}`}>{passwordMsg.text}</div>}
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Current Password</label>
                  <input type="password" value={passwordData.current} onChange={e => setPasswordData({...passwordData, current: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-300" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">New Password</label>
                  <input type="password" value={passwordData.new} onChange={e => setPasswordData({...passwordData, new: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-300" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Confirm New Password</label>
                  <input type="password" value={passwordData.confirm} onChange={e => setPasswordData({...passwordData, confirm: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-300" required />
                </div>
                <button type="submit" className="w-full bg-primary text-white font-bold py-2 rounded-lg hover:bg-primary-light">Update Password</button>
              </form>
            )}

            {showBankForm && (
              <form onSubmit={handleBankSubmit} className="bg-gray-50 p-6 rounded-2xl border border-gray-200 max-w-md animate-fade-in space-y-4">
                <h5 className="font-bold text-gray-800">Bank Details</h5>
                {bankMsg && <div className={`text-sm font-bold p-2 rounded ${bankMsg.type === 'error' ? 'text-red-600 bg-red-100' : 'text-green-600 bg-green-100'}`}>{bankMsg.text}</div>}
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Account Holder Name</label>
                  <input type="text" value={bankData.accountName} onChange={e => setBankData({...bankData, accountName: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-300" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Account Number</label>
                  <input type="text" value={bankData.accountNumber} onChange={e => setBankData({...bankData, accountNumber: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-300" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">IFSC Code</label>
                  <input type="text" value={bankData.ifsc} onChange={e => setBankData({...bankData, ifsc: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-300" required />
                </div>
                <button type="submit" className="w-full bg-primary text-white font-bold py-2 rounded-lg hover:bg-primary-light">Save Bank Details</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
