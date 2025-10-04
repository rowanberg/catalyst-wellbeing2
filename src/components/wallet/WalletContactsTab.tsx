'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Star, Send, Trash2, UserPlus, Search } from 'lucide-react';
import { toast } from 'sonner';

interface Contact {
  id: string;
  studentTag: string;
  fullName: string;
  walletAddress: string;
  isFavorite: boolean;
  transactionCount: number;
}

interface WalletContactsTabProps {
  onQuickSend: (contact: Contact) => void;
}

export function WalletContactsTab({ onQuickSend }: WalletContactsTabProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await fetch('/api/student/wallet/contacts');
      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts || []);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (contactId: string) => {
    try {
      const response = await fetch('/api/student/wallet/contacts/favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId })
      });

      if (response.ok) {
        setContacts(contacts.map(c => 
          c.id === contactId ? { ...c, isFavorite: !c.isFavorite } : c
        ));
        toast.success('Contact updated');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update contact');
    }
  };

  const removeContact = async (contactId: string) => {
    try {
      const response = await fetch(`/api/student/wallet/contacts/${contactId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setContacts(contacts.filter(c => c.id !== contactId));
        toast.success('Contact removed');
      }
    } catch (error) {
      console.error('Error removing contact:', error);
      toast.error('Failed to remove contact');
    }
  };

  const filteredContacts = contacts.filter(c =>
    c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.studentTag.includes(searchQuery)
  );

  const favoriteContacts = filteredContacts.filter(c => c.isFavorite);
  const regularContacts = filteredContacts.filter(c => !c.isFavorite);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto"
    >
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Users className="h-6 w-6 text-purple-400" />
          Saved Contacts
        </h2>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contacts..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-400"
          />
        </div>

        {/* Favorites */}
        {favoriteContacts.length > 0 && (
          <div className="mb-6">
            <h3 className="text-white/70 text-sm mb-3 flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
              Favorites
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {favoriteContacts.map((contact) => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  onQuickSend={onQuickSend}
                  onToggleFavorite={toggleFavorite}
                  onRemove={removeContact}
                />
              ))}
            </div>
          </div>
        )}

        {/* All Contacts */}
        {regularContacts.length > 0 && (
          <div>
            <h3 className="text-white/70 text-sm mb-3">All Contacts</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {regularContacts.map((contact) => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  onQuickSend={onQuickSend}
                  onToggleFavorite={toggleFavorite}
                  onRemove={removeContact}
                />
              ))}
            </div>
          </div>
        )}

        {filteredContacts.length === 0 && !loading && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-white/20 mx-auto mb-4" />
            <p className="text-white/50">No contacts found</p>
            <p className="text-white/30 text-sm mt-1">
              {searchQuery ? 'Try a different search' : 'Send transactions to add contacts'}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ContactCard({ contact, onQuickSend, onToggleFavorite, onRemove }: {
  contact: Contact;
  onQuickSend: (contact: Contact) => void;
  onToggleFavorite: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium truncate">{contact.fullName}</p>
          <p className="text-white/50 text-sm font-mono">{contact.studentTag}</p>
        </div>
        <button
          onClick={() => onToggleFavorite(contact.id)}
          className="p-1 hover:bg-white/10 rounded transition-colors"
        >
          <Star className={`h-5 w-5 ${contact.isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-white/30'}`} />
        </button>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 bg-white/5 rounded-lg px-2 py-1">
          <p className="text-white/50 text-xs">Transactions</p>
          <p className="text-white text-sm font-medium">{contact.transactionCount}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onQuickSend(contact)}
          className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm"
        >
          <Send className="h-4 w-4" />
          Send
        </button>
        <button
          onClick={() => onRemove(contact.id)}
          className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
