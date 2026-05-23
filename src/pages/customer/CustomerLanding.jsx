import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiStar, FiShield, FiTruck, FiPackage, FiUser } from 'react-icons/fi';
import { GiWheat, GiPlantRoots, GiFarmer, GiSprout } from 'react-icons/gi';
import { MdLocalFlorist, MdEco, MdOutlineWaterDrop } from 'react-icons/md';
import { LuLeaf, LuMilk, LuApple, LuWheat, LuSprout } from 'react-icons/lu';
import { GiBroccoli } from 'react-icons/gi';
import Navbar from '../../components/Navbar';
import { useFarmers } from '../../context/FarmerContext';
import { useAuth } from '../../context/AuthContext';

const reviews = [
  {
    id: 1,
    customerName: "Ramesh",
    rating: 5,
    comment: "The vegetables are extremely fresh. Great initiative!",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&fm=webp"
  },
  {
    id: 2,
    customerName: "Priya",
    rating: 4,
    comment: "Loved the UI and the freshness of the products.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&fm=webp"
  }
];

const fadeUp = { hidden: { opacity: 0, y: 40 }, show: { opacity: 1, y: 0, transition: { duration: 0.6 } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.12 } } };

export default function CustomerLanding() {
  const { farmers } = useFarmers();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-cream font-sans overflow-x-hidden">
      <Navbar />

      {/* ═══ HERO ═══ */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        {/* layered background */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1200&auto=format&fit=crop&q=85&fm=webp"
            alt="Farm Hero"
            className="w-full h-full object-cover"
            fetchpriority="high"
            decoding="async"
           onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x400/eeeeee/999999?text=No+Image"; }} />
          <div className="absolute inset-0 bg-gray-900/70" />
        </div>



        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full flex flex-col items-center text-center py-16">
          {/* Hero Content */}
          <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col items-center">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 text-white text-sm font-semibold px-4 py-2 rounded-full mb-6">
              <MdEco className="text-green-300" size={18} />
              Fresh Produce • Direct from Farms
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-bold text-white leading-[1.1] mb-6 text-shadow-lg">
              Fresh From<br />
              <span className="text-green-400 flex items-center justify-center gap-3">
                The Farm <GiSprout className="text-green-400" />
              </span>
            </motion.h1>
            <motion.p variants={fadeUp} className="text-lg text-white/80 mb-8 max-w-lg leading-relaxed">
              உழவர் சந்தை — connecting Tamil Nadu's finest farmers directly to your kitchen. No middlemen, only freshness.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap gap-4 justify-center">
              <Link to={user && user.role === 'customer' ? "/customer/home" : "/customer/login"} className="btn-primary text-base px-8 py-3.5 shadow-sm">
                Shop Fresh Produce <FiArrowRight />
              </Link>
            </motion.div>

            {/* Trust badges */}
            <motion.div variants={fadeUp} className="flex flex-wrap gap-6 mt-10 justify-center">
              {[
                { icon: <FiShield />, text: 'FSSAI Certified' },
                { icon: <FiTruck />, text: 'Same Day Delivery' },
                { icon: <MdLocalFlorist />, text: '5,000+ Farmers' },
              ].map((b, i) => (
                <div key={i} className="flex items-center gap-2 text-white/80 text-sm font-medium">
                  <span className="text-green-300">{b.icon}</span> {b.text}
                </div>
              ))}
            </motion.div>
          </motion.div>


        </div>


      </section>

      {/* ═══ STATS ═══ */}
      <section className="py-16 px-6 bg-cream">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: '5,000+', label: 'Farmers', icon: <GiFarmer size={28} />, color: 'text-primary' },
            { value: '1M+', label: 'Products Sold', icon: <FiPackage size={28} />, color: 'text-leaf' },
            { value: '50k+', label: 'Happy Customers', icon: <FiStar size={28} />, color: 'text-sun' },
            { value: '1,200+', label: 'Verified Farms', icon: <GiPlantRoots size={28} />, color: 'text-forest' },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="stat-card group">
              <div className={`${s.color} mb-3 flex justify-center`}>{s.icon}</div>
              <div className="text-3xl font-black text-soil mb-1">{s.value}</div>
              <div className="text-sm text-earth-light font-medium">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══ CATEGORIES ═══ */}
      <section className="py-16 px-6 bg-mist">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <span className="badge-organic text-sm mb-3">Categories</span>
            <h2 className="text-4xl font-bold text-forest mt-2">What's on your mind?</h2>
          </motion.div>
          <div className="grid grid-cols-3 max-w-3xl mx-auto gap-6">
            {[
              { name: 'Vegetables', icon: <GiBroccoli size={24} />, bg: 'bg-white', img: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80' },
              { name: 'Fruits', icon: <LuApple size={24} />, bg: 'bg-white', img: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=300&q=80' },
              { name: 'Dairy', icon: <LuMilk size={24} />, bg: 'bg-white', img: 'https://images.unsplash.com/photo-1634141510639-d691d86f47be?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8bWlsayUyMHByb2R1Y3RzfGVufDB8fDB8fHww'},
            ].map((cat, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                whileHover={{ scale: 1.03, y: -2 }} onClick={() => window.location.href = '/products'}
                className={`${cat.bg} cursor-pointer rounded-xl p-4 flex flex-col items-center gap-3 border border-gray-100 shadow-sm hover:shadow-md transition-all`}>
                <div className="w-16 h-16 rounded-full overflow-hidden shadow-md">
<img
  src={cat.img}
  alt={cat.name}
  className="w-full h-full object-cover"
  loading="lazy"
  decoding="async"
  onError={(e) => {
    e.target.onerror = null;
    e.target.src = "https://placehold.co/400x400/eeeeee/999999?text=No+Image";
  }}
/>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="text-primary mb-1">{cat.icon}</div>
                  <span className="text-xs font-bold text-soil text-center">{cat.name}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURED FARMERS ═══ */}
      <section className="py-20 px-6 bg-cream bg-texture">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex items-end justify-between mb-12">
            <div>
              <span className="badge-organic mb-3">Our Farmers</span>
              <h2 className="text-4xl font-bold text-forest mt-2">Meet the growers</h2>
              <p className="text-earth-light mt-2 max-w-lg">Families who have been farming for generations, bringing you the freshest produce.</p>
            </div>
            <Link to="/products" className="btn-outline hidden md:flex">View All <FiArrowRight /></Link>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {farmers.filter(f => f.status === 'Verified').length === 0 ? (
              <div className="col-span-full text-center py-12 px-6 bg-white/60 backdrop-blur-md rounded-3xl border-2 border-dashed border-gray-200 shadow-sm max-w-xl mx-auto w-full">
                <FiUser className="mx-auto text-5xl text-gray-400 mb-4" />
                <h3 className="text-2xl font-bold text-forest">No growers registered yet</h3>
                <p className="text-earth-light text-sm mt-2 max-w-sm mx-auto">Our verified local growers will be displayed here soon. Are you a local farmer? Join our marketplace today!</p>
                <Link to="/farmer/signup" className="btn-primary inline-flex mt-6 items-center gap-2 font-bold px-6 py-2.5">
                  Register as a Farmer
                </Link>
              </div>
            ) : (
              farmers.filter(f => f.status === 'Verified').slice(0, 4).map((farmer, i) => (
                <motion.div key={farmer.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                  <Link to={`/farmer-profile/${farmer.id}`} className="farm-card block group">
                    <div className="relative h-52 overflow-hidden">
                      <img src={farmer.image || 'https://placehold.co/400x400/eeeeee/999999?text=No+Image'} alt={farmer.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"  loading="lazy" decoding="async" onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x400/eeeeee/999999?text=No+Image"; }} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-green-700 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                        <FiShield size={12} /> Verified
                      </div>
                      <div className="absolute bottom-4 left-4 text-white">
                        <div className="font-bold text-lg">{farmer.name}</div>
                        <div className="text-white/80 text-sm">{farmer.location}</div>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="font-semibold text-soil">{farmer.farmName}</div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="flex">
                          {[...Array(5)].map((_, j) => (
                            <FiStar key={j} size={12} className={j < Math.round(farmer.rating) ? 'text-sun fill-current' : 'text-gray-300'} />
                          ))}
                        </div>
                        <span className="text-sm font-bold text-soil">{farmer.rating}</span>
                        <span className="text-xs text-gray-400 ml-1">• Same day delivery</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ═══ WHY US ═══ */}
      <section className="py-20 px-6 bg-gradient-to-br from-forest to-primary text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="max-w-6xl mx-auto relative">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="text-4xl font-bold mb-3">Why Uzhavar Sandhai?</h2>
            <p className="text-white/70 max-w-xl mx-auto">We built this platform to empower farmers and give you access to the freshest produce possible.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <GiPlantRoots size={40} />, title: 'Farm Fresh Guarantee', desc: 'Products harvested within 24 hours and delivered fresh, preserving all nutrients.' },
              { icon: <FiShield size={40} />, title: 'Verified Quality', desc: 'All farmers are FSSAI certified and inspected for quality assurance.' },
              { icon: <GiFarmer size={40} />, title: 'Support Farmers Directly', desc: 'Your purchase goes directly to the farmer — no middlemen, better prices for all.' },
            ].map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 text-center hover:bg-white/15 transition-all">
                <div className="text-sun mb-4 flex justify-center">{f.icon}</div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-white/70 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* ═══ TESTIMONIALS ═══ */}
      <section className="py-20 px-6 bg-mist">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <span className="badge-organic mb-3">Testimonials</span>
            <h2 className="text-4xl font-bold text-forest mt-2">What our customers say</h2>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-6">
            {reviews.map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-white rounded-3xl p-8 shadow-card border border-gray-100 relative">
                <div className="text-6xl text-sun/30 font-serif absolute top-4 left-6 leading-none">"</div>
                <p className="text-earth italic mb-6 mt-4 leading-relaxed">"{r.comment}"</p>
                <div className="flex items-center gap-4">
                  <img src={r.avatar || 'https://placehold.co/400x400/eeeeee/999999?text=No+Image'} alt={r.customerName} className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20"  loading="lazy" decoding="async" onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x400/eeeeee/999999?text=No+Image"; }} />
                  <div>
                    <div className="font-bold text-soil">{r.customerName}</div>
                    <div className="flex gap-0.5 mt-1">
                      {[...Array(r.rating)].map((_, j) => <FiStar key={j} size={12} className="text-sun fill-current" />)}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA BANNER ═══ */}
      <section className="py-16 px-6 bg-cream">
        <motion.div initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          className="max-w-4xl mx-auto bg-gradient-to-br from-forest via-primary to-leaf rounded-3xl p-12 text-center text-white relative overflow-hidden shadow-glow">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full" />
          <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-sun/20 rounded-full" />
          <GiWheat size={48} className="text-sun mx-auto mb-4" />
          <h2 className="text-4xl font-bold mb-3">Are you a Farmer?</h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">Join 5,000+ farmers selling directly to customers. No commission, no middlemen. Start earning more today.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to={user && user.role === 'farmer' ? "/farmer/dashboard" : "/farmer/signup"} className="btn-sun px-10 py-4 rounded-full text-base">{user && user.role === 'farmer' ? "Go to Dashboard" : "Register Your Farm"} <FiArrowRight /></Link>
            <Link to={user && user.role === 'farmer' ? "/farmer/dashboard" : "/farmer/login"} className="bg-white/15 border border-white/30 text-white font-bold px-10 py-4 rounded-full hover:bg-white/25 transition-all flex items-center gap-2">
              {user && user.role === 'farmer' ? "Farmer Dashboard" : "Farmer Login"}
            </Link>
          </div>
          <div className="mt-8 text-white/40 text-xs flex justify-center items-center gap-2 flex-wrap">
            <span>Official Use Only:</span>
            <Link to={user && user.role === 'admin' ? "/admin/dashboard" : "/admin/login"} className="hover:text-white underline transition-colors">{user && user.role === 'admin' ? "Admin Dashboard" : "Admin Access"}</Link>
            <span className="text-white/20">•</span>
            <Link to={user && user.role === 'delivery' ? "/delivery/dashboard" : "/delivery/login"} className="hover:text-white underline transition-colors">Rider Portal</Link>
          </div>
        </motion.div>
      </section>


      {/* ═══ FOOTER ═══ */}
      <footer className="bg-forest text-white pt-16 pb-8 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center gap-2 text-2xl font-bold mb-4">
              <GiWheat className="text-sun" /> Uzhavar Sandhai
            </div>
            <p className="text-white/60 text-sm leading-relaxed">Connecting Tamil Nadu's farmers directly to your kitchen since 2024.</p>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><Link to="/products" className="hover:text-sun transition-colors">Marketplace</Link></li>
              <li><Link to={user && user.role === 'farmer' ? "/farmer/dashboard" : "/farmer/login"} className="hover:text-sun transition-colors">Farmer Portal</Link></li>
              <li><Link to={user && user.role === 'delivery' ? "/delivery/dashboard" : "/delivery/login"} className="hover:text-sun transition-colors">Rider Portal</Link></li>
              <li><Link to={user && user.role === 'admin' ? "/admin/dashboard" : "/admin/login"} className="hover:text-sun transition-colors">Admin Panel</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li>support@uzhavarsandhai.in</li>
              <li>+91 98765 43210</li>
              <li>Coimbatore, Tamil Nadu</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Stay Updated</h4>
            <div className="flex rounded-xl overflow-hidden shadow-inner">
              <input type="email" placeholder="Enter email..." className="flex-1 px-4 py-2.5 bg-white/10 text-white placeholder:text-white/40 outline-none text-sm" />
              <button className="bg-sun text-forest font-bold px-4 py-2.5 text-sm hover:bg-sun-light transition-colors">Subscribe</button>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 pt-8 text-center text-white/40 text-sm">
          © {new Date().getFullYear()} Uzhavar Sandhai. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
