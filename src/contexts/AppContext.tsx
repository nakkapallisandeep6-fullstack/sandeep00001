import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Mood = 'adventurous' | 'relaxed' | 'lonely' | 'hungry' | null;

export interface Location {
  lat: number;
  lng: number;
}

export interface EmergencyContact {
  id?: string;
  name: string;
  relationship: string;
  phone: string;
  email: string;
}

export interface Place {
  id: string;
  name: string;
  type: string;
  description: string;
  distance: string;
  lat: number;
  lng: number;
  rating: number;
  mood: string;
}

interface AppContextType {
  mood: Mood;
  setMood: (mood: Mood) => void;
  location: Location | null;
  setLocation: (location: Location | null) => void;
  safeZoneCenter: Location | null;
  setSafeZoneCenter: (location: Location | null) => void;
  isInSafeZone: boolean;
  setIsInSafeZone: (value: boolean) => void;
  places: Place[];
  setPlaces: (places: Place[]) => void;
  showSosAlert: boolean;
  setShowSosAlert: (value: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [mood, setMood] = useState<Mood>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [safeZoneCenter, setSafeZoneCenter] = useState<Location | null>(null);
  const [isInSafeZone, setIsInSafeZone] = useState(true);
  const [places, setPlaces] = useState<Place[]>([]);
  const [showSosAlert, setShowSosAlert] = useState(false);

  return (
    <AppContext.Provider
      value={{
        mood,
        setMood,
        location,
        setLocation,
        safeZoneCenter,
        setSafeZoneCenter,
        isInSafeZone,
        setIsInSafeZone,
        places,
        setPlaces,
        showSosAlert,
        setShowSosAlert,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
