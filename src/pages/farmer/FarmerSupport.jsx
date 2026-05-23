import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageSquare, FiPlus, FiChevronDown, FiChevronUp } from 'react-icons/fi';

export default function FarmerSupport() {
  const [activeFaq, setActiveFaq] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const faqs = [
    { q: 'How do I add a new product?', a: 'Navigate to the Products tab from the sidebar. Click the "Add Product" button in the top right corner. Fill in the details including name, price, stock, and upload an image, then click Save.' },
    { q: 'When do I receive my payments?', a: 'Payments for delivered orders are processed every Friday. The amount will be directly credited to the bank account linked to your profile.' },
    { q: 'How do I handle low stock?', a: 'You will see a red "Low Stock" indicator when your product inventory drops below 10 units. You can edit the product from the Products tab to update the available quantity.' }
  ];

  const tickets = [
    { id: '#TK-092', subject: 'Payment not received for Order #ORD-7730', status: 'Open', date: 'Oct 23, 2026' },
    { id: '#TK-085', subject: 'App crashing when uploading images', status: 'Resolved', date: 'Oct 15, 2026' }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Support Center</h2>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold shadow-md hover:bg-primary-light transition-colors">
          <FiPlus /> Raise Ticket
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* FAQ Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-max">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Frequently Asked Questions</h3>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                <button 
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="w-full text-left p-4 bg-gray-50 hover:bg-gray-100 flex justify-between items-center font-bold text-gray-800 transition-colors"
                >
                  {faq.q}
                  {activeFaq === i ? <FiChevronUp /> : <FiChevronDown />}
                </button>
                <AnimatePresence>
                  {activeFaq === i && (
                    <motion.div 
                      initial={{ height: 0 }} 
                      animate={{ height: 'auto' }} 
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 bg-white text-gray-600 text-sm leading-relaxed border-t border-gray-200">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* Tickets Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-max">
          <h3 className="text-lg font-bold text-gray-800 mb-6">My Support Tickets</h3>
          <div className="space-y-4">
            {tickets.map((ticket, i) => (
              <div key={i} className="p-4 border border-gray-100 rounded-xl hover:shadow-md transition-shadow cursor-pointer flex justify-between items-start">
                <div>
                  <div className="text-xs font-bold text-gray-400 mb-1">{ticket.id} • {ticket.date}</div>
                  <div className="font-bold text-gray-800 mb-2">{ticket.subject}</div>
                  <div className="text-sm text-gray-500 flex items-center gap-1"><FiMessageSquare size={14} /> 2 messages</div>
                </div>
                <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${ticket.status === 'Open' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                  {ticket.status}
                </span>
              </div>
            ))}
            {tickets.length === 0 && <div className="text-center py-8 text-gray-500">No support tickets found.</div>}
          </div>
        </div>
      </div>

      {/* Ticket Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-8 rounded-3xl w-full max-w-md">
            <h3 className="text-2xl font-black text-gray-800 mb-6">Raise Support Ticket</h3>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setShowModal(false); }}>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Subject</label>
                <input required className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                <select className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-primary outline-none">
                  <option>Payment Issue</option>
                  <option>Technical Bug</option>
                  <option>Account Management</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                <textarea required rows="4" className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-primary outline-none"></textarea>
              </div>
              <div className="flex gap-4 mt-8">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-primary text-white rounded-xl font-bold shadow-lg hover:bg-primary-light">Submit Ticket</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
