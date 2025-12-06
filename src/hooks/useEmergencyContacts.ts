import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { EmergencyContact } from '@/contexts/AppContext';
import { useAuth } from './useAuth';

export function useEmergencyContacts() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchContacts();
    }
  }, [user]);

  const fetchContacts = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setContacts(data || []);
    } catch (err) {
      console.error('Error fetching contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  const addContact = async (contact: Omit<EmergencyContact, 'id'>) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { data, error } = await supabase
        .from('emergency_contacts')
        .insert({
          user_id: user.id,
          name: contact.name,
          relationship: contact.relationship,
          phone: contact.phone,
          email: contact.email,
        })
        .select()
        .single();

      if (error) throw error;
      setContacts(prev => [...prev, data]);
      return { data };
    } catch (err) {
      console.error('Error adding contact:', err);
      return { error: 'Failed to add contact' };
    }
  };

  const removeContact = async (id: string) => {
    try {
      const { error } = await supabase
        .from('emergency_contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setContacts(prev => prev.filter(c => c.id !== id));
      return { success: true };
    } catch (err) {
      console.error('Error removing contact:', err);
      return { error: 'Failed to remove contact' };
    }
  };

  const hasMinimumContacts = contacts.length >= 3;

  return {
    contacts,
    loading,
    addContact,
    removeContact,
    hasMinimumContacts,
    refetch: fetchContacts,
  };
}
