
import React, { useState, useMemo } from 'react';
import { Offer, OfferType } from '../types';
import OfferCard from './JobCard';
import JobCardSkeleton from './JobCardSkeleton';
import Skeleton from './Skeleton';
import {
    PlusCircleIcon, MagnifyingGlassIcon, XCircleIcon, BriefcaseIcon,
    WrenchScrewdriverIcon, TagIcon, Squares2x2Icon
} from './Icons';

interface FeedProps {
  offers: Offer[];
  onNewOfferRequest: () => void;
  savedOfferIds: Set<string>;
  onToggleSaveOffer: (offerId: string) => void;
  filterCenterPoint: { lat: number; lng: number; } | null;
  isLoading: boolean;
}

interface FilterButtonProps {
    filter: 'all' | OfferType;
    label: string;
    icon: React.ReactNode;
    activeFilter: 'all' | OfferType;
    onClick: () => void;
}

const FilterButton: React.FC<FilterButtonProps> = ({ filter, label, icon, activeFilter, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 border-2 ${
            activeFilter === filter
                ? 'bg-blue-600 text-white border-blue-700 shadow-md'
                : 'bg-white text-gray-700 border-gray-200 hover:border-blue-400 hover:bg-blue-50'
        }`}
    >
        {icon}
        <span className="ml-2">{label}</span>
    </button>
);


// Haversine distance formula
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
};

const getOfferTitle = (offer: Offer): string => {
    switch (offer.type) {
        case OfferType.JOB: return offer.jobTitle;
        case OfferType.SERVICE: return offer.serviceName;
        case OfferType.PRODUCT: return offer.productName;
    }
}

const Feed: React.FC<FeedProps> = ({ offers, onNewOfferRequest, savedOfferIds, onToggleSaveOffer, filterCenterPoint, isLoading }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | OfferType>('all');

  const filteredOffers = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeOffers = offers.filter(offer => {
        if (!offer.expiresAt) return true; // Keep if no expiration date

        const parts = offer.expiresAt.split('-');
        if (parts.length !== 3) return true; // Keep if format is invalid

        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
        const day = parseInt(parts[2], 10);

        if (isNaN(year) || isNaN(month) || isNaN(day)) return true;

        const expiryDate = new Date(year, month, day);
        return expiryDate >= today; // Keep if expiry date is today or in the future
    });

    let filtered = activeOffers;

    if (activeFilter !== 'all') {
        filtered = filtered.filter(offer => offer.type === activeFilter);
    }

    if (filterCenterPoint) {
        filtered = filtered.filter(offer => {
            if (!offer.location) return false;
            const distance = getDistance(filterCenterPoint.lat, filterCenterPoint.lng, offer.location.lat, offer.location.lng);
            return distance <= 50; // Filter within a 50km radius
        });
    }

    if (searchQuery.trim() !== '') {
        const lowercasedQuery = searchQuery.toLowerCase();
        filtered = filtered.filter(offer => {
            const title = getOfferTitle(offer).toLowerCase();
            const summary = offer.summary.toLowerCase();
            let otherDetails = '';

            if (offer.location) {
                otherDetails += `${offer.location.address.toLowerCase()} `;
            }

            if (offer.type === OfferType.JOB) {
                otherDetails += `${offer.company} ${offer.skills.join(' ')}`.toLowerCase();
            } else if (offer.type === OfferType.SERVICE) {
                otherDetails += `${offer.provider || ''}`.toLowerCase();
            } else if (offer.type === OfferType.PRODUCT) {
                otherDetails += `${offer.brand || ''}`.toLowerCase();
            }

            return title.includes(lowercasedQuery) || summary.includes(lowercasedQuery) || otherDetails.includes(lowercasedQuery);
        });
    }
    return filtered;
  }, [offers, searchQuery, activeFilter, filterCenterPoint]);
  
  if (isLoading) {
    return (
      <div className="p-4 space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Your Offer Feed</h1>
        <div className="sticky top-4 bg-white z-10 p-4 rounded-lg border border-gray-200 shadow-sm space-y-4">
          <Skeleton className="h-10 w-full rounded-lg" />
          <div className="flex items-center space-x-2">
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="h-8 w-24 rounded-lg" />
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
        </div>
        <div className="space-y-4">
          <JobCardSkeleton />
          <JobCardSkeleton />
          <JobCardSkeleton />
        </div>
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Offer Scanner</h2>
        <p className="text-gray-600 mb-6">Your saved offers will appear here. Tap the button below to create a new one.</p>
        <button
          onClick={onNewOfferRequest}
          className="flex items-center justify-center bg-blue-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-105"
        >
          <PlusCircleIcon className="h-6 w-6"/>
          <span className="ml-2">Create First Offer</span>
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Your Offer Feed</h1>

      {/* Search and Filter UI */}
      <div className="sticky top-4 bg-white z-10 p-4 rounded-lg border border-gray-200 shadow-sm space-y-4">
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search offers by keyword..."
                className="w-full pl-10 pr-10 py-2 rounded-lg border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <XCircleIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </button>
            )}
        </div>
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
            <FilterButton filter="all" label="All" icon={<Squares2x2Icon className="h-4 w-4"/>} activeFilter={activeFilter} onClick={() => setActiveFilter('all')} />
            <FilterButton filter={OfferType.JOB} label="Jobs" icon={<BriefcaseIcon className="h-4 w-4"/>} activeFilter={activeFilter} onClick={() => setActiveFilter(OfferType.JOB)} />
            <FilterButton filter={OfferType.SERVICE} label="Services" icon={<WrenchScrewdriverIcon className="h-4 w-4"/>} activeFilter={activeFilter} onClick={() => setActiveFilter(OfferType.SERVICE)} />
            <FilterButton filter={OfferType.PRODUCT} label="Products" icon={<TagIcon className="h-4 w-4"/>} activeFilter={activeFilter} onClick={() => setActiveFilter(OfferType.PRODUCT)} />
        </div>
      </div>

      {filteredOffers.length > 0 ? (
        filteredOffers.map(offer => (
          <div key={offer.id}>
            <OfferCard
              offer={offer}
              isSaved={savedOfferIds.has(offer.id)}
              onToggleSave={() => onToggleSaveOffer(offer.id)}
            />
          </div>
        ))
      ) : (
        <div className="text-center py-16">
            <h3 className="text-xl font-semibold text-gray-700">No Offers Found</h3>
            <p className="text-gray-500 mt-2">Try adjusting your search or filter settings.</p>
        </div>
      )}
    </div>
  );
};

export default Feed;
