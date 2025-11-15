
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Offer, AppView, User } from './types';
import Feed from './components/Feed';
import OfferForm from './components/OfferForm';
import Profile from './components/Profile';
import { PlusCircleIcon, ListBulletIcon, UserCircleIcon, MapPinIcon, XCircleIcon } from './components/Icons';
import { reverseGeocode, geocodeLocation, getLocationSuggestions } from './services/geminiService';
import { ToastProvider, useToast } from './hooks/useToast';
import Toaster from './components/Toaster';


const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};

interface NavButtonProps {
    view: AppView;
    label: string;
    icon: React.ReactNode;
    currentView: AppView;
    onClick: () => void;
}

const NavButton: React.FC<NavButtonProps> = ({ view, label, icon, currentView, onClick }) => (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors duration-200 ${
        currentView === view ? 'text-blue-600' : 'text-gray-500 hover:text-blue-500'
      }`}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
);

interface LocationSelectorProps {
    locationInputRef: React.RefObject<HTMLDivElement>;
    isLocating: boolean;
    locationQuery: string;
    onQueryChange: (value: string) => void;
    onFocus: () => void;
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    onClear: () => void;
    showSuggestions: boolean;
    isFetchingSuggestions: boolean;
    suggestions: string[];
    onSuggestionClick: (suggestion: string) => void;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
    locationInputRef, isLocating, locationQuery, onQueryChange, onFocus, onKeyDown,
    onClear, showSuggestions, isFetchingSuggestions, suggestions, onSuggestionClick
}) => (
    <div className="relative w-full" ref={locationInputRef}>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MapPinIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
            type="text"
            value={isLocating ? 'Locating...' : locationQuery}
            onChange={(e) => onQueryChange(e.target.value)}
            onFocus={onFocus}
            onKeyDown={onKeyDown}
            placeholder="Filter by city..."
            disabled={isLocating}
            className="w-full pl-10 pr-10 py-2 rounded-lg border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
            autoComplete="off"
        />
        {locationQuery && !isLocating && (
            <button onClick={onClear} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <XCircleIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </button>
        )}
        {showSuggestions && (isFetchingSuggestions || suggestions.length > 0) && (
            <div className="absolute z-30 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200">
                <ul className="max-h-60 overflow-auto py-1">
                    {isFetchingSuggestions && (
                        <li className="px-3 py-2 text-sm text-gray-500">Searching...</li>
                    )}
                    {!isFetchingSuggestions && suggestions.map((suggestion, index) => (
                        <li
                            key={index}
                            className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                onSuggestionClick(suggestion);
                            }}
                        >
                            {suggestion}
                        </li>
                    ))}
                </ul>
            </div>
        )}
    </div>
);

const AppContent: React.FC = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [currentView, setCurrentView] = useState<AppView>(AppView.FEED);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [savedOfferIds, setSavedOfferIds] = useState<Set<string>>(new Set());
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [isLocating, setIsLocating] = useState(true);

  // Location filter state (moved from Feed)
  const [locationQuery, setLocationQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filterCenterPoint, setFilterCenterPoint] = useState<{ lat: number, lng: number } | null>(null);
  const locationInputRef = useRef<HTMLDivElement>(null);

  const debouncedSuggestionQuery = useDebounce(locationQuery, 300);
  const debouncedGeocodeQuery = useDebounce(locationQuery, 1000);

  const mainContentRef = useRef<HTMLElement>(null);
  const toast = useToast();

  // Fetch user's location once on app load
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        const cityName = await reverseGeocode(coords);
        setUserLocation({ ...coords, name: cityName || '' });
        setIsLocating(false);
      },
      (error) => {
        console.error("Error getting user location", error);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 600000 }
    );
  }, []);


  // Load user session on initial render
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error("Error reading user from localStorage", error);
    }
  }, []);

  // Load user-specific data when user logs in or on initial load with a session
  useEffect(() => {
    if (!currentUser) {
        setOffers([]);
        setSavedOfferIds(new Set());
        return;
    };

    const userOffersKey = `offers_${currentUser.email}`;
    const userSavedOffersKey = `savedOffers_${currentUser.email}`;

    try {
        const savedOffersData = localStorage.getItem(userSavedOffersKey);
        setSavedOfferIds(savedOffersData ? new Set(JSON.parse(savedOffersData)) : new Set());

        const savedOffersList = localStorage.getItem(userOffersKey);
        setOffers(savedOffersList ? JSON.parse(savedOffersList) : []);
    } catch (error)        {
        console.error("Error loading user data from localStorage", error);
        setSavedOfferIds(new Set());
        setOffers([]);
    }
  }, [currentUser]);

  // Save offers whenever they change for the current user
  useEffect(() => {
    if (!currentUser) return;
    const userOffersKey = `offers_${currentUser.email}`;
    try {
        localStorage.setItem(userOffersKey, JSON.stringify(offers));
    } catch (error) {
        console.error("Error saving offers to localStorage", error);
    }
  }, [offers, currentUser]);

  // Save saved IDs whenever they change for the current user
  useEffect(() => {
    if (!currentUser) return;
    const userSavedOffersKey = `savedOffers_${currentUser.email}`;
    try {
      localStorage.setItem(userSavedOffersKey, JSON.stringify(Array.from(savedOfferIds)));
    } catch (error) {
      console.error("Error saving offers to localStorage", error);
    }
  }, [savedOfferIds, currentUser]);

  const geocodeAndSetFilter = useCallback(async (location: string) => {
    setShowSuggestions(false);
    if (location.trim()) {
      const coords = await geocodeLocation(location);
      setFilterCenterPoint(coords);
    } else {
      setFilterCenterPoint(null);
    }
  }, []);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setLocationQuery(suggestion);
    geocodeAndSetFilter(suggestion);
  }, [geocodeAndSetFilter]);

  useEffect(() => {
    if (userLocation && !locationQuery) {
        setFilterCenterPoint({ lat: userLocation.lat, lng: userLocation.lng });
        setLocationQuery(userLocation.name);
    }
  }, [userLocation, locationQuery]);


  useEffect(() => {
    const fetchSuggestions = async () => {
        if (isLocating || debouncedSuggestionQuery.trim().length < 3) {
            setSuggestions([]);
            return;
        }
        setIsFetchingSuggestions(true);
        const newSuggestions = await getLocationSuggestions(debouncedSuggestionQuery);
        setSuggestions(newSuggestions);
        setIsFetchingSuggestions(false);
    };

    if (showSuggestions) {
        fetchSuggestions();
    }
  }, [debouncedSuggestionQuery, isLocating, showSuggestions]);

  useEffect(() => {
    if (isLocating || showSuggestions) return;

    if (debouncedGeocodeQuery.trim() === '') {
        setFilterCenterPoint(null);
        return;
    }

    if (userLocation && debouncedGeocodeQuery === userLocation.name) {
        setFilterCenterPoint({ lat: userLocation.lat, lng: userLocation.lng });
        return;
    }

    geocodeAndSetFilter(debouncedGeocodeQuery);
  }, [debouncedGeocodeQuery, isLocating, geocodeAndSetFilter, showSuggestions, userLocation]);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (locationInputRef.current && !locationInputRef.current.contains(event.target as Node)) {
            setShowSuggestions(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogin = (email: string) => {
    const user: User = { email };
    setCurrentUser(user);
    toast({ message: `Welcome back, ${email}!`, type: 'success' });
    try {
        localStorage.setItem('currentUser', JSON.stringify(user));
    } catch (error) {
        console.error("Error saving user to localStorage", error);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    toast({ message: "You have been logged out.", type: 'info' });
    try {
        localStorage.removeItem('currentUser');
    } catch (error) {
        console.error("Error removing user from localStorage", error);
    }
    setCurrentView(AppView.FEED);
  };

  const toggleSaveOffer = useCallback((offerId: string) => {
    if (!currentUser) {
        toast({ message: "Please log in to save offers.", type: 'error' });
        setCurrentView(AppView.PROFILE);
        return;
    }
    setSavedOfferIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(offerId)) {
        newSet.delete(offerId);
        toast({ message: "Offer removed from saved.", type: 'info' });
      } else {
        newSet.add(offerId);
        toast({ message: "Offer saved!", type: 'success' });
      }
      return newSet;
    });
  }, [currentUser, toast]);

  const addOffer = useCallback((newOfferData: Omit<Offer, 'id' | 'scannedAt' | 'applicantCount'>) => {
    if (!currentUser) {
        toast({ message: "Please log in to add an offer.", type: 'error' });
        setCurrentView(AppView.PROFILE);
        return;
    }
    const newOffer = {
      ...newOfferData,
      id: `offer-${Date.now()}`,
      scannedAt: new Date().toISOString(),
      applicantCount: Math.floor(Math.random() * 20),
    } as Offer;
    setOffers(prevOffers => [newOffer, ...prevOffers]);
    setCurrentView(AppView.FEED);
    toast({ message: "Offer successfully created!", type: 'success' });
  }, [currentUser, toast]);

  const savedOffers = useMemo(() => {
    return offers.filter(offer => savedOfferIds.has(offer.id));
  }, [offers, savedOfferIds]);

  const handleNavClick = useCallback((view: AppView) => {
    setCurrentView(view);
    if (mainContentRef.current) {
        mainContentRef.current.scrollTop = 0;
    }
  }, []);
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        geocodeAndSetFilter((e.target as HTMLInputElement).value);
    }
  }, [geocodeAndSetFilter]);

  const handleClearLocation = useCallback(() => {
    setLocationQuery('');
    setFilterCenterPoint(null);
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-100 font-sans max-w-lg mx-auto shadow-2xl">
      <Toaster />
      <header className="flex justify-between items-center p-4 bg-white border-b border-gray-200 sticky top-0 z-20 space-x-4">
        <h1 className="text-xl font-bold text-blue-600 shrink-0">Offer Scanner</h1>
        <div className="flex-grow min-w-0">
          <LocationSelector
            locationInputRef={locationInputRef}
            isLocating={isLocating}
            locationQuery={locationQuery}
            onQueryChange={setLocationQuery}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            onClear={handleClearLocation}
            showSuggestions={showSuggestions}
            isFetchingSuggestions={isFetchingSuggestions}
            suggestions={suggestions}
            onSuggestionClick={handleSuggestionClick}
          />
        </div>
      </header>

      <main ref={mainContentRef} className="flex-1 overflow-y-auto pb-20">
        {currentView === AppView.FEED && (
          <Feed
            offers={offers}
            onNewOfferRequest={() => setCurrentView(AppView.NEW_OFFER)}
            savedOfferIds={savedOfferIds}
            onToggleSaveOffer={toggleSaveOffer}
            filterCenterPoint={filterCenterPoint}
            isLoading={isLocating}
          />
        )}
        {currentView === AppView.NEW_OFFER && (
            currentUser ? (
                 <OfferForm onAddOffer={addOffer} onCancel={() => setCurrentView(AppView.FEED)} />
            ) : (
                <div className="p-8 text-center mt-10">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Please Log In</h2>
                    <p className="text-gray-600 mb-6">You need to be logged in to create new offers.</p>
                    <button
                        onClick={() => setCurrentView(AppView.PROFILE)}
                        className="bg-blue-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:bg-blue-700"
                    >
                        Go to Account Page
                    </button>
                </div>
            )
        )}
        {currentView === AppView.PROFILE && (
            <Profile
                currentUser={currentUser}
                onLogin={handleLogin}
                onLogout={handleLogout}
                myOffers={offers}
                savedOffers={savedOffers}
                savedOfferIds={savedOfferIds}
                onToggleSaveOffer={toggleSaveOffer}
            />
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 flex max-w-lg mx-auto">
        <NavButton view={AppView.FEED} label="Feed" icon={<ListBulletIcon />} currentView={currentView} onClick={() => handleNavClick(AppView.FEED)}/>
        <NavButton view={AppView.NEW_OFFER} label="New" icon={<PlusCircleIcon />} currentView={currentView} onClick={() => handleNavClick(AppView.NEW_OFFER)}/>
        <NavButton view={AppView.PROFILE} label="Account" icon={<UserCircleIcon />} currentView={currentView} onClick={() => handleNavClick(AppView.PROFILE)}/>
      </footer>
    </div>
  );
};

const App: React.FC = () => (
    <ToastProvider>
        <AppContent />
    </ToastProvider>
);

export default App;