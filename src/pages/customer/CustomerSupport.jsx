import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageSquare, FiPlus, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import CustomerBottomNav from '../../components/CustomerBottomNav';

export default function CustomerSupport() {
  const [activeFaq, setActiveFaq] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const faqs = [
    { q: 'How do I track my order?', a: 'You can track your order in the "Orders" tab. Click on "Track package" for real-time delivery updates.' },
    { q: 'What is the return policy for fresh produce?', a: 'If you receive damaged or spoiled produce, please raise a ticket within 12 hours of delivery with a photo. We will issue a full refund or replacement.' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 pb-28 px-4 relative">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Customer Support</h1>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold shadow-md hover:bg-primary-light transition-colors">
            <FiPlus /> Need Help?
          </button>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Frequently Asked Questions</h3>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-gray-200 rounded-2xl overflow-hidden">
                <button 
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="w-full text-left p-5 bg-gray-50 hover:bg-gray-100 flex justify-between items-center font-bold text-gray-800 transition-colors"
                >
                  {faq.q}
                  {activeFaq === i ? <FiChevronUp /> : <FiChevronDown />}
                </button>
                <AnimatePresence>
                  {activeFaq === i && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="p-5 bg-white text-gray-600 leading-relaxed border-t border-gray-200">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-8 rounded-3xl w-full max-w-md">
              <h3 className="text-2xl font-black text-gray-800 mb-6">Contact Us</h3>
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setShowModal(false); }}>
                <input required placeholder="Order ID (Optional)" className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 outline-none focus:border-primary" />
                <select className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 outline-none focus:border-primary">
                  <option>Delivery Issue</option>
                  <option>Quality Complaint</option>
                  <option>Refund Status</option>
                  <option>Other</option>
                </select>
                <textarea required placeholder="Describe your issue..." rows="4" className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 outline-none focus:border-primary"></textarea>
                <div className="flex gap-4 mt-8">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold">Cancel</button>
                  <button type="submit" className="flex-1 py-3 bg-primary text-white rounded-xl font-bold shadow-lg">Submit Request</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
      <CustomerBottomNav />
    </div>
  );
}
