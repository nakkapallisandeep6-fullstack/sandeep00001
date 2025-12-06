import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Compass, Shield, MessageCircle, MapPin } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/30 to-background">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <header className="text-center py-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary mb-6">
            <Compass className="w-4 h-4" />
            <span className="text-sm font-medium">Your AI Travel Companion</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground mb-6">
            Travel Solo,
            <span className="block text-primary">Never Alone</span>
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            SoloTravel AI keeps you safe, recommends amazing places based on your mood, 
            and acts as your intelligent travel companion wherever you go.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="xl" 
              onClick={() => navigate('/auth')}
              className="bg-primary hover:bg-primary/90 shadow-glow"
            >
              Get Started Free
            </Button>
            <Button 
              variant="outline" 
              size="xl"
              onClick={() => navigate('/auth')}
            >
              Sign In
            </Button>
          </div>
        </header>

        {/* Features */}
        <section className="grid md:grid-cols-3 gap-6 py-16 max-w-5xl mx-auto">
          <FeatureCard
            icon={<MapPin className="w-8 h-8" />}
            title="Mood-Based Discovery"
            description="Feeling adventurous or need a calm spot? We suggest places that match your vibe."
            gradient="mood-adventurous"
          />
          <FeatureCard
            icon={<Shield className="w-8 h-8" />}
            title="Safety First"
            description="Real-time location monitoring with automatic SOS alerts to your emergency contacts."
            gradient="bg-success"
          />
          <FeatureCard
            icon={<MessageCircle className="w-8 h-8" />}
            title="AI Companion"
            description="Chat with our intelligent assistant for recommendations, translations, and safety tips."
            gradient="bg-primary"
          />
        </section>
      </div>
    </div>
  );
};

function FeatureCard({ icon, title, description, gradient }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  gradient: string;
}) {
  return (
    <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-slide-up">
      <div className={`w-14 h-14 rounded-xl ${gradient} flex items-center justify-center text-white mb-4`}>
        {icon}
      </div>
      <h3 className="text-lg font-display font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}

export default Index;
