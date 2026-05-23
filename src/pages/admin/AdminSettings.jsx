import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiSave, FiBell, FiShield, FiGlobe, FiDatabase } from 'react-icons/fi';

export default function AdminSettings() {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('uzhavar_admin_settings');
    return saved ? JSON.parse(saved) : {
      maintenanceMode: false,
      newRegistrations: true,
      emailNotifications: true,
      smsAlerts: false,
      autoApproveFarmers: false,
    };
  });

  const [profile, setProfile] = useState({
    name: 'Admin',
    email: 'admin@uzhavar.com',
    password: ''
  });
  const [profileError, setProfileError] = useState('');

  const [saved, setSaved] = useState(false);

  const toggleSetting = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const handleProfileChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
    setProfileError('');
  };

  const handleSave = () => {
    if (!profile.name || !profile.email) {
      setProfileError('Name and email are required.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profile.email)) {
      setProfileError('Invalid email format.');
      return;
    }
    
    localStorage.setItem('uzhavar_admin_settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Platform Settings</h2>
        <button 
          onClick={handleSave}
          className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-primary-light transition-colors shadow-sm"
        >
          <FiSave /> {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Settings */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gray-50 text-gray-800 rounded-xl"><FiGlobe size={20} /></div>
            <h3 className="text-xl font-bold text-gray-800">Admin Profile</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Name</label>
              <input name="name" value={profile.name} onChange={handleProfileChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
              <input name="email" value={profile.email} onChange={handleProfileChange} type="email" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">New Password (leave blank to keep)</label>
              <input name="password" value={profile.password} onChange={handleProfileChange} type="password" placeholder="••••••••" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          {profileError && <p className="text-red-500 text-sm font-bold mt-2">{profileError}</p>}
        </motion.div>

        {/* General Settings */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><FiGlobe size={20} /></div>
            <h3 className="text-xl font-bold text-gray-800">General</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <div className="font-bold text-gray-800">Maintenance Mode</div>
                <div className="text-sm text-gray-500">Disable access for customers and farmers</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={settings.maintenanceMode} onChange={() => toggleSetting('maintenanceMode')} />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <div className="font-bold text-gray-800">Allow New Registrations</div>
                <div className="text-sm text-gray-500">Open signups for new farmers</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={settings.newRegistrations} onChange={() => toggleSetting('newRegistrations')} />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>
          </div>
        </motion.div>

        {/* Notification Settings */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-sun/10 text-sun rounded-xl"><FiBell size={20} /></div>
            <h3 className="text-xl font-bold text-gray-800">Notifications</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <div className="font-bold text-gray-800">Email Notifications</div>
                <div className="text-sm text-gray-500">Send daily summary emails to admin</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={settings.emailNotifications} onChange={() => toggleSetting('emailNotifications')} />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <div className="font-bold text-gray-800">SMS Alerts</div>
                <div className="text-sm text-gray-500">Get text alerts for critical platform errors</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={settings.smsAlerts} onChange={() => toggleSetting('smsAlerts')} />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>
          </div>
        </motion.div>

        {/* Security & Verification */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-red-50 text-red-600 rounded-xl"><FiShield size={20} /></div>
            <h3 className="text-xl font-bold text-gray-800">Security</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <div className="font-bold text-gray-800">Auto-Approve Verified Farmers</div>
                <div className="text-sm text-gray-500">Automatically approve verification certificates</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={settings.autoApproveFarmers} onChange={() => toggleSetting('autoApproveFarmers')} />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>
            
            <div className="pt-2">
              <button className="w-full py-3 bg-gray-100 text-gray-800 font-bold rounded-xl hover:bg-gray-200 transition-colors border border-gray-200">
                Change Admin PIN
              </button>
            </div>
          </div>
        </motion.div>

        {/* Data & Export */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><FiDatabase size={20} /></div>
            <h3 className="text-xl font-bold text-gray-800">Data Management</h3>
          </div>
          <div className="space-y-4">
            <button className="w-full py-3 bg-gray-50 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors border border-gray-200 flex items-center justify-center gap-2">
              Export All Farmer Data (CSV)
            </button>
            <button className="w-full py-3 bg-gray-50 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors border border-gray-200 flex items-center justify-center gap-2">
              Export Monthly Sales Report
            </button>
            <button className="w-full py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors border border-red-100 mt-4">
              Clear Cache & Logs
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
