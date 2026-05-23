import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiMessageSquare, FiSearch, FiFilter } from 'react-icons/fi';

export default function AdminSupportManagement() {
  const [activeTicketIndex, setActiveTicketIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [tickets, setTickets] = useState([
    { id: 'TK-1042', user: 'Green Earth Organics', role: 'Farmer', subject: 'Payment delay for last week', status: 'Open', priority: 'High', date: 'Oct 24, 2026', messages: [{ sender: 'F', text: 'Hello support team, my payment for the deliveries made last Friday has not been credited to my bank account yet. Can you please check?', time: 'Oct 24, 2026 • 10:30 AM' }, { sender: 'A', text: 'Hi there, I apologize for the delay. There was a slight issue with our payment gateway partner over the weekend. We have processed it manually and it should reflect in your account by end of day today.', time: 'Oct 24, 2026 • 11:15 AM' }] },
    { id: 'TK-1041', user: 'Suresh Kumar', role: 'Customer', subject: 'Received damaged tomatoes', status: 'In Progress', priority: 'Medium', date: 'Oct 23, 2026', messages: [{ sender: 'C', text: 'The tomatoes I received yesterday were crushed. I would like a refund.', time: 'Oct 23, 2026 • 09:15 AM' }] },
    { id: 'TK-1039', user: 'Murugan Farms', role: 'Farmer', subject: 'How to update bank details?', status: 'Resolved', priority: 'Low', date: 'Oct 21, 2026', messages: [{ sender: 'F', text: 'I want to change my bank account for payouts.', time: 'Oct 21, 2026 • 02:00 PM' }] },
  ]);

  const activeTicket = tickets[activeTicketIndex];

  const handleStatusChange = (id, newStatus) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
  };

  const handleReply = (e) => {
    e.preventDefault();
    const replyText = e.target.reply.value;
    if (!replyText) return;

    setTickets(prev => prev.map((t, idx) => {
      if (idx === activeTicketIndex) {
        return {
          ...t,
          status: 'In Progress',
          messages: [...t.messages, { sender: 'A', text: replyText, time: 'Just now' }]
        };
      }
      return t;
    }));
    e.target.reset();
  };

  const filteredTickets = tickets.filter(t => 
    t.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Support Desk</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 h-[600px] flex flex-col">
            <div className="relative mb-4">
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search tickets..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-xl bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary" 
              />
            </div>
            
            <div className="space-y-2 overflow-y-auto flex-1 pr-1">
              {filteredTickets.map((ticket, i) => {
                const originalIndex = tickets.findIndex(t => t.id === ticket.id);
                return (
                  <div 
                    key={ticket.id} 
                    onClick={() => setActiveTicketIndex(originalIndex)}
                    className={`p-4 rounded-xl border cursor-pointer transition-colors ${activeTicketIndex === originalIndex ? 'border-primary bg-primary/5' : 'border-gray-100 hover:bg-gray-50'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-xs font-bold text-gray-500">{ticket.id}</div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${ticket.status === 'Open' ? 'bg-orange-100 text-orange-700' : ticket.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                        {ticket.status}
                      </span>
                    </div>
                    <div className="font-bold text-gray-800 text-sm mb-1">{ticket.subject}</div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-600">{ticket.user} ({ticket.role})</span>
                      <span className="text-gray-400">{ticket.date}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          {activeTicket ? (
            <div className="bg-white h-[600px] rounded-2xl shadow-sm border border-gray-100 flex flex-col">
              <div className="p-6 border-b border-gray-100">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-1">{activeTicket.subject}</h3>
                    <div className="text-sm text-gray-500">Ticket {activeTicket.id} • Opened by <span className="font-bold text-gray-700">{activeTicket.user}</span></div>
                  </div>
                  <div className="flex gap-2">
                    {activeTicket.status !== 'Resolved' && (
                      <button 
                        onClick={() => handleStatusChange(activeTicket.id, 'Resolved')}
                        className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-bold hover:bg-green-200"
                      >
                        Mark Resolved
                      </button>
                    )}
                    {activeTicket.status === 'Resolved' && (
                      <button 
                        onClick={() => handleStatusChange(activeTicket.id, 'Open')}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-200"
                      >
                        Reopen Ticket
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-gray-50">
                {activeTicket.messages.map((msg, i) => (
                  <div key={i} className={`flex gap-4 ${msg.sender === 'A' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${msg.sender === 'A' ? 'bg-gray-800 text-white' : 'bg-blue-100 text-blue-600'}`}>
                      {msg.sender}
                    </div>
                    <div className={`p-4 rounded-2xl shadow-sm border ${msg.sender === 'A' ? 'bg-primary text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border-gray-100'} max-w-[80%]`}>
                      <div className="text-sm">{msg.text}</div>
                      <div className={`text-xs mt-2 ${msg.sender === 'A' ? 'text-primary-light' : 'text-gray-400'}`}>{msg.time}</div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-4 border-t border-gray-100 bg-white rounded-b-2xl">
                <form onSubmit={handleReply} className="relative">
                  <textarea name="reply" rows="2" placeholder="Type your reply here..." className="w-full p-3 pr-24 border rounded-xl bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary resize-none"></textarea>
                  <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-white px-4 py-2 rounded-lg font-bold shadow-sm hover:bg-primary-light">Reply</button>
                </form>
              </div>
            </div>
          ) : (
            <div className="bg-white h-[600px] rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center text-gray-400">
              Select a ticket to view conversation
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
