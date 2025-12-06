import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useProfile() {
  const { user } = useAuth();
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setOnboardingCompleted(data?.onboarding_completed ?? false);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setOnboardingCompleted(false);
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = async () => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('user_id', user.id);

      if (error) throw error;
      setOnboardingCompleted(true);
      return { success: true };
    } catch (err) {
      console.error('Error completing onboarding:', err);
      return { error: 'Failed to complete onboarding' };
    }
  };

  return {
    onboardingCompleted,
    loading,
    completeOnboarding,
    refetch: fetchProfile,
  };
}
