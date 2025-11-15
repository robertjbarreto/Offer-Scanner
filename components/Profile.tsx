
import React, { useState } from 'react';
import { Offer, User } from '../types';
import OfferCard from './JobCard';
import { ArrowRightOnRectangleIcon, GoogleIcon, WhatsAppIcon } from './Icons';

interface LoginFormProps {
    onLogin: (email: string) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleEmailSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !email.includes('@')) {
            alert('Please enter a valid email address.');
            return;
        }
        if (password.trim().length < 6) {
            alert('Password must be at least 6 characters long.');
            return;
        }
        setIsLoading(true);
        // Simulate network request for email/password login
        setTimeout(() => {
            onLogin(email);
            setIsLoading(false);
        }, 500);
    };

    const handleGoogleLogin = () => {
        setIsLoading(true);
        // Simulate Google Sign-In
        setTimeout(() => {
            onLogin('user@gmail.com');
            setIsLoading(false);
        }, 500);
    };

    const handleWhatsAppLogin = () => {
        setIsLoading(true);
        // Simulate WhatsApp Sign-In
        setTimeout(() => {
            onLogin('demo.whatsapp.user@example.com');
            setIsLoading(false);
        }, 500);
    };

    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white rounded-lg shadow-md mt-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Login or Sign Up</h2>
            <p className="text-gray-600 mb-6">Enter your details to save offers and activity across devices.</p>

            <div className="w-full max-w-sm">
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        required
                        aria-label="Email Address"
                    />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        required
                        aria-label="Password"
                    />
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-105 disabled:bg-blue-400 disabled:scale-100"
                    >
                        {isLoading ? 'Signing In...' : 'Continue with Email'}
                    </button>
                </form>

                <div className="my-6 flex items-center">
                    <div className="flex-grow border-t border-gray-300"></div>
                    <span className="flex-shrink mx-4 text-gray-500 text-sm">OR</span>
                    <div className="flex-grow border-t border-gray-300"></div>
                </div>

                <button
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center bg-white text-gray-700 font-semibold py-3 px-4 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors disabled:bg-gray-200"
                >
                    <GoogleIcon />
                    <span className="ml-3">Continue with Google</span>
                </button>

                <button
                    onClick={handleWhatsAppLogin}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center bg-white text-gray-700 font-semibold py-3 px-4 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors disabled:bg-gray-200 mt-4"
                >
                    <WhatsAppIcon />
                    <span className="ml-3">Continue with WhatsApp</span>
                </button>
            </div>
        </div>
    );
};

interface TabButtonProps {
    label: string;
    count: number;
    isActive: boolean;
    onClick: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ label, count, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex-1 text-center px-1 py-3 text-sm font-semibold transition-colors duration-200 focus:outline-none ${
            isActive
            ? 'border-b-2 border-blue-600 text-blue-600'
            : 'text-gray-500 hover:text-blue-500'
        }`}
    >
        {label}
        <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs ${
            isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-600'
        }`}>
            {count}
        </span>
    </button>
);

interface ProfileProps {
  currentUser: User | null;
  onLogin: (email: string) => void;
  onLogout: () => void;
  myOffers: Offer[];
  savedOffers: Offer[];
  savedOfferIds: Set<string>;
  onToggleSaveOffer: (offerId: string) => void;
}


const Profile: React.FC<ProfileProps> = ({ currentUser, onLogin, onLogout, myOffers, savedOffers, savedOfferIds, onToggleSaveOffer }) => {
  const [activeTab, setActiveTab] = useState<'published' | 'saved'>('published');

  if (!currentUser) {
      return (
        <div className="p-4">
            <h1 className="text-3xl font-bold text-gray-900">Account</h1>
            <LoginForm onLogin={onLogin} />
        </div>
      );
  }

  const renderOfferList = (offers: Offer[], type: 'published' | 'saved') => {
    if (offers.length === 0) {
      return (
        <div className="text-center py-16">
          <h3 className="text-xl font-semibold text-gray-700">
            {type === 'published' ? 'No Offers Published Yet' : 'No Saved Offers'}
          </h3>
          <p className="text-gray-500 mt-2">
            {type === 'published'
                ? 'Your created offers will appear here.'
                : 'Your saved offers from the feed will appear here.'}
          </p>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        {offers.map(offer => (
          <OfferCard
            key={offer.id}
            offer={offer}
            isSaved={savedOfferIds.has(offer.id)}
            onToggleSave={() => onToggleSaveOffer(offer.id)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="p-4 space-y-6">
       <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-gray-900">My Activity</h1>
            <p className="text-sm text-gray-500">{currentUser.email}</p>
        </div>
        <button
            onClick={onLogout}
            className="flex items-center px-4 py-2 text-sm font-semibold rounded-lg bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-700 transition-colors duration-200"
        >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
            <span className="ml-2">Logout</span>
        </button>
      </div>

      <div className="sticky top-0 bg-gray-100 z-10 py-2">
        <div className="flex border-b border-gray-200">
            <TabButton
                label="My Offers"
                count={myOffers.length}
                isActive={activeTab === 'published'}
                onClick={() => setActiveTab('published')}
            />
            <TabButton
                label="Saved"
                count={savedOffers.length}
                isActive={activeTab === 'saved'}
                onClick={() => setActiveTab('saved')}
            />
        </div>
      </div>

      <div className="animate-fade-in">
        {activeTab === 'published' && renderOfferList(myOffers, 'published')}
        {activeTab === 'saved' && renderOfferList(savedOffers, 'saved')}
      </div>
    </div>
  );
};

export default Profile;
