import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useApp, Mood } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, MessageCircle, Compass, Coffee, Heart, Utensils, LogOut, AlertTriangle, Sparkles, Send } from 'lucide-react';

const MOODS: { id: Mood; label: string; icon: React.ReactNode; gradient: string }[] = [
  { id: 'adventurous', label: 'Adventurous', icon: <Compass className="w-5 h-5" />, gradient: 'mood-adventurous' },
  { id: 'relaxed', label: 'Relaxed', icon: <Coffee className="w-5 h-5" />, gradient: 'mood-relaxed' },
  { id: 'lonely', label: 'Lonely', icon: <Heart className="w-5 h-5" />, gradient: 'mood-lonely' },
  { id: 'hungry', label: 'Hungry', icon: <Utensils className="w-5 h-5" />, gradient: 'mood-hungry' },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { onboardingCompleted, loading: profileLoading } = useProfile();
  const { location, startWatching, error: geoError } = useGeolocation();
  const { mood, setMood, setLocation, places, setPlaces } = useApp();
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'map' | 'chat'>('map');

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
    else if (!profileLoading && user && onboardingCompleted === false) navigate('/onboarding');
  }, [user, authLoading, profileLoading, onboardingCompleted, navigate]);

  useEffect(() => { startWatching(); }, []);
  useEffect(() => { if (location) setLocation(location); }, [location]);

  const handleMoodSelect = async (selectedMood: Mood) => {
    setMood(selectedMood);
    if (!location || !selectedMood) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('recommendations', {
        body: { lat: location.lat, lng: location.lng, mood: selectedMood }
      });
      if (error) throw error;
      setPlaces(data.places || []);
      toast.success(`Found ${data.places?.length || 0} places for your ${selectedMood} mood!`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to get recommendations');
    }
  };

  const sendMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatMessages, { role: 'user', content: userMessage }],
          mood,
          location,
        }),
      });

      if (!response.ok) throw new Error('Chat failed');
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      setChatMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const parsed = JSON.parse(line.slice(6));
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                assistantContent += content;
                setChatMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
                  return updated;
                });
              }
            } catch {}
          }
        }
      }
    } catch (err) {
      toast.error('Failed to send message');
      setChatMessages(prev => prev.slice(0, -1));
    } finally {
      setChatLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (authLoading || profileLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-pulse text-primary">Loading...</div></div>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-xl border-b border-border/50 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
            <Compass className="w-4 h-4" />
          </div>
          <span className="font-display font-semibold">SoloTravel AI</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => toast.info('AR coming soon!')}>
            <Sparkles className="w-4 h-4" /> AR
          </Button>
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Mood Selector */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
        {MOODS.map((m) => (
          <Button
            key={m.id}
            variant="mood"
            size="sm"
            className={`${m.gradient} ${mood === m.id ? 'ring-2 ring-offset-2 ring-primary' : 'opacity-80'}`}
            onClick={() => handleMoodSelect(m.id)}
          >
            {m.icon} {m.label}
          </Button>
        ))}
      </div>

      {/* Location Status */}
      {geoError && (
        <div className="mx-4 p-3 bg-warning/10 border border-warning/30 rounded-xl flex items-center gap-2 text-warning">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm">Location unavailable: {geoError}</span>
        </div>
      )}

      {/* Mobile Tabs */}
      <div className="flex border-b border-border lg:hidden">
        <button onClick={() => setActiveTab('map')} className={`flex-1 py-3 text-sm font-medium ${activeTab === 'map' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}>
          <MapPin className="w-4 h-4 inline mr-1" /> Map & Places
        </button>
        <button onClick={() => setActiveTab('chat')} className={`flex-1 py-3 text-sm font-medium ${activeTab === 'chat' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}>
          <MessageCircle className="w-4 h-4 inline mr-1" /> AI Chat
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Map & Recommendations */}
        <div className={`flex-1 flex flex-col p-4 ${activeTab !== 'map' ? 'hidden lg:flex' : ''}`}>
          {/* Map Placeholder */}
          <div className="flex-1 bg-secondary/30 rounded-2xl border border-border/50 flex items-center justify-center min-h-[300px] mb-4">
            {location ? (
              <div className="text-center">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-3 animate-pulse">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <p className="font-medium">You are here</p>
                <p className="text-sm text-muted-foreground">{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</p>
              </div>
            ) : (
              <p className="text-muted-foreground">Waiting for location...</p>
            )}
          </div>

          {/* Places */}
          {places.length > 0 && (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              <h3 className="font-display font-semibold">Recommended for you</h3>
              {places.map((place) => (
                <div key={place.id} className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{place.name}</h4>
                      <p className="text-sm text-muted-foreground">{place.description}</p>
                    </div>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">{place.distance}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chat Panel */}
        <div className={`w-full lg:w-96 border-l border-border flex flex-col bg-card/50 ${activeTab !== 'chat' ? 'hidden lg:flex' : ''}`}>
          <div className="p-4 border-b border-border">
            <h3 className="font-display font-semibold flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" /> AI Companion
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px]">
            {chatMessages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Ask me anything about your trip!</p>
                <p className="text-sm mt-1">Try: "Find a quiet café" or "Is this area safe?"</p>
              </div>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={msg.role === 'user' ? 'chat-bubble-user max-w-[80%]' : 'chat-bubble-assistant max-w-[80%]'}>
                  {msg.content || <span className="animate-pulse">...</span>}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button onClick={sendMessage} disabled={chatLoading || !chatInput.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
