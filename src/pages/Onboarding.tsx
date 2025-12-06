import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEmergencyContacts } from '@/hooks/useEmergencyContacts';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Shield, Plus, Trash2, Check, User, Phone, Mail, Users } from 'lucide-react';

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { contacts, addContact, removeContact, hasMinimumContacts } = useEmergencyContacts();
  const { completeOnboarding } = useProfile();
  const [formData, setFormData] = useState({ name: '', relationship: '', phone: '', email: '' });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.relationship || !formData.phone || !formData.email) {
      toast.error('Please fill all fields');
      return;
    }

    setAdding(true);
    const { error } = await addContact(formData);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Contact added!');
      setFormData({ name: '', relationship: '', phone: '', email: '' });
    }
    setAdding(false);
  };

  const handleContinue = async () => {
    if (!hasMinimumContacts) {
      toast.error('Please add at least 3 emergency contacts');
      return;
    }
    await completeOnboarding();
    toast.success('Setup complete! Enjoy your travels safely.');
    navigate('/dashboard');
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/30 to-background p-4">
      <div className="max-w-lg mx-auto py-8">
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-16 h-16 bg-success rounded-2xl flex items-center justify-center text-white mx-auto mb-4">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-display font-bold">Safety Setup</h1>
          <p className="text-muted-foreground mt-2">
            Add at least 3 emergency contacts who will be notified if you need help.
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`flex-1 h-2 rounded-full transition-colors ${
                contacts.length >= i ? 'bg-success' : 'bg-muted'
              }`}
            />
          ))}
          <span className="text-sm font-medium text-muted-foreground ml-2">
            {contacts.length}/3
          </span>
        </div>

        {/* Add Contact Form */}
        <form onSubmit={handleAddContact} className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-6 shadow-lg space-y-4 mb-6 animate-slide-up">
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Name" value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} className="pl-10" />
            </div>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Relationship" value={formData.relationship} onChange={(e) => setFormData(p => ({ ...p, relationship: e.target.value }))} className="pl-10" />
            </div>
          </div>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Phone" type="tel" value={formData.phone} onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))} className="pl-10" />
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Email" type="email" value={formData.email} onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))} className="pl-10" />
          </div>
          <Button type="submit" className="w-full" disabled={adding}>
            <Plus className="w-4 h-4" /> Add Contact
          </Button>
        </form>

        {/* Contact List */}
        <div className="space-y-3 mb-6">
          {contacts.map((contact) => (
            <div key={contact.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between animate-slide-in">
              <div>
                <p className="font-medium">{contact.name}</p>
                <p className="text-sm text-muted-foreground">{contact.relationship} • {contact.phone}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => contact.id && removeContact(contact.id)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>

        <Button onClick={handleContinue} size="lg" className="w-full" disabled={!hasMinimumContacts}>
          <Check className="w-4 h-4" /> Continue to App
        </Button>
      </div>
    </div>
  );
};

export default Onboarding;
