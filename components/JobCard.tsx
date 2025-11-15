import React, { useState } from 'react';
import { Offer, OfferType } from '../types';
import { 
    ChevronDownIcon, ChevronUpIcon, BriefcaseIcon, BuildingIcon, CodeBracketIcon, 
    CurrencyDollarIcon, ListBulletIcon, WrenchScrewdriverIcon, TagIcon, UserIcon,
    PhoneIcon, EnvelopeIcon, MapPinIcon, BookmarkIcon, BookmarkSolidIcon, ShareIcon,
    CalendarIcon, ClockIcon
} from './Icons';
import { useToast } from '../hooks/useToast';
import ApplicantIndicator from './ApplicantIndicator';

interface OfferCardProps {
  offer: Offer;
  isSaved: boolean;
  onToggleSave: () => void;
}

const InfoRow: React.FC<{ icon: React.ReactNode; text?: string | null, label?: string }> = ({ icon, text, label }) => {
  if (!text) return null;
  return (
    <div className="flex items-start text-gray-600">
      <div className="flex-shrink-0 mt-1">{icon}</div>
      <div className="ml-3 text-sm">
        {label && <span className="font-semibold text-gray-800">{label}: </span>}
        <span>{text}</span>
      </div>
    </div>
  );
};

const getOfferPresentation = (offer: Offer) => {
    const salaryText = offer.type === OfferType.JOB && offer.salary ? `${offer.salary}${offer.salaryType ? ` (${offer.salaryType})` : ''}` : undefined;
    
    switch (offer.type) {
        case OfferType.JOB:
            return {
                icon: <BriefcaseIcon className="h-6 w-6 text-blue-600" />,
                iconBg: 'bg-blue-100',
                title: offer.jobTitle,
                subtitle: offer.company,
                location: offer.location?.address,
                tags: offer.skills,
                tagColor: 'blue',
                priceInfo: salaryText,
                details: {
                    Responsibilities: offer.responsibilities,
                    Skills: offer.skills,
                    Phone: offer.phone,
                    Email: offer.email,
                }
            };
        case OfferType.SERVICE:
            const priceText = offer.price ? `${offer.price}${offer.priceType ? ` (${offer.priceType})` : ''}` : undefined;
            return {
                icon: <WrenchScrewdriverIcon className="h-6 w-6 text-green-600" />,
                iconBg: 'bg-green-100',
                title: offer.serviceName,
                subtitle: offer.provider,
                location: offer.location?.address,
                tags: [offer.price].filter(Boolean) as string[],
                tagColor: 'green',
                priceInfo: priceText,
                details: {
                    Phone: offer.phone,
                    Email: offer.email,
                }
            };
        case OfferType.PRODUCT:
            return {
                icon: <TagIcon className="h-6 w-6 text-purple-600" />,
                iconBg: 'bg-purple-100',
                title: offer.productName,
                subtitle: offer.brand,
                location: offer.location?.address,
                tags: offer.condition ? [offer.condition] : [],
                tagColor: 'purple',
                priceInfo: offer.price,
                details: {
                    Condition: offer.condition,
                    Phone: offer.phone,
                    Email: offer.email,
                }
            };
    }
};

const getExpiryStatus = (expiresAt?: string) => {
    if (!expiresAt) {
        return null;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const parts = expiresAt.split('-');
    if (parts.length !== 3) return null;
    const expiryDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));

    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return { text: 'Expired', color: 'red' };
    }
    if (diffDays === 0) {
        return { text: 'Expires Today', color: 'orange' };
    }
    if (diffDays <= 7) {
        return { text: `Expires in ${diffDays} day${diffDays > 1 ? 's' : ''}`, color: 'orange' };
    }
    return null;
};

const OfferCard: React.FC<OfferCardProps> = ({ offer, isSaved, onToggleSave }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const presentation = getOfferPresentation(offer);
  const expiryStatus = getExpiryStatus(offer.expiresAt);
  const toast = useToast();
  
  const formattedScannedDate = new Date(offer.scannedAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedExpiryDate = offer.expiresAt ? new Date(
      parseInt(offer.expiresAt.split('-')[0]),
      parseInt(offer.expiresAt.split('-')[1]) - 1,
      parseInt(offer.expiresAt.split('-')[2])
  ).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
  }) : null;

  const tagClasses = {
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      purple: 'bg-purple-100 text-purple-800',
  }[presentation.tagColor] || 'bg-gray-100 text-gray-800';
  
  const expiryColorClasses = {
      red: { bg: 'bg-red-100', text: 'text-red-800', icon: 'text-red-500' },
      orange: { bg: 'bg-orange-100', text: 'text-orange-800', icon: 'text-orange-500' },
  }

  const handleShare = async () => {
    const generateShareableText = (offer: Offer) => {
        let title = '';
        let text = '';
        
        switch (offer.type) {
            case OfferType.JOB:
                title = `Job Offer: ${offer.jobTitle} at ${offer.company}`;
                text = `${title}\n\n${offer.summary}\n\n`;
                if (offer.salary) text += `Salary: ${offer.salary}${offer.salaryType ? ` (${offer.salaryType})` : ''}\n`;
                if (offer.location) text += `Location: ${offer.location.address}\n`;
                if (offer.email || offer.phone) text += `Contact: ${[offer.email, offer.phone].filter(Boolean).join(' / ')}\n`;
                break;
            case OfferType.SERVICE:
                title = `Service Offer: ${offer.serviceName}`;
                text = `${title}\n\n${offer.summary}\n\n`;
                if (offer.provider) text += `By: ${offer.provider}\n`;
                if (offer.price) text += `Price: ${offer.price}${offer.priceType ? ` (${offer.priceType})` : ''}\n`;
                if (offer.location) text += `Location: ${offer.location.address}\n`;
                if (offer.email || offer.phone) text += `Contact: ${[offer.email, offer.phone].filter(Boolean).join(' / ')}\n`;
                break;
            case OfferType.PRODUCT:
                title = `Product for Sale: ${offer.productName}`;
                text = `${title}\n\n${offer.summary}\n\n`;
                if (offer.brand) text += `Brand: ${offer.brand}\n`;
                if (offer.price) text += `Price: ${offer.price}\n`;
                if (offer.condition) text += `Condition: ${offer.condition}\n`;
                if (offer.location) text += `Location: ${offer.location.address}\n`;
                if (offer.email || offer.phone) text += `Contact: ${[offer.email, offer.phone].filter(Boolean).join(' / ')}\n`;
                break;
        }
        return { title, text };
    };

    if (navigator.share) {
        const { title, text } = generateShareableText(offer);
        try {
            await navigator.share({
                title: title,
                text: text,
            });
        } catch (error) {
            console.error('Error sharing offer:', error);
        }
    } else {
        toast({ message: 'Share feature is not supported on this device.', type: 'error' });
    }
  };
  
  const handleApply = () => {
    toast({ message: `Application for "${presentation.title}" submitted!`, type: 'success' });
  };

  const handleContact = () => {
      const contactInfo = [offer.email, offer.phone].filter(Boolean).join(' | ');
      if (contactInfo) {
          toast({ message: `Contact: ${contactInfo}`, type: 'info', duration: 6000 });
      } else {
          toast({ message: "No contact information available for this offer.", type: 'error' });
      }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 ease-in-out border border-gray-200 relative">
        <div className="absolute top-3 right-3 z-10 flex items-center space-x-2">
            <button
              onClick={handleShare}
              className="p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors duration-200"
              aria-label="Share offer"
            >
              <ShareIcon className="h-5 w-5" />
            </button>
            <button
              onClick={onToggleSave}
              className={`p-2 rounded-full transition-colors duration-200 ${
                isSaved
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
              aria-label={isSaved ? 'Unsave offer' : 'Save offer'}
            >
              {isSaved ? <BookmarkSolidIcon className="h-5 w-5" /> : <BookmarkIcon className="h-5 w-5" />}
            </button>
        </div>

        <div className="p-5">
            <div className="pr-20">
                <h3 className="text-lg font-bold text-gray-800 leading-tight">{presentation.title}</h3>
                {presentation.subtitle && (
                    <p className="text-sm font-medium text-gray-500">{presentation.subtitle}</p>
                )}
            </div>

            {expiryStatus && (
                <div className={`mt-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${expiryColorClasses[expiryStatus.color].bg} ${expiryColorClasses[expiryStatus.color].text}`}>
                    <ClockIcon className={`mr-1.5 h-4 w-4 ${expiryColorClasses[expiryStatus.color].icon}`} />
                    {expiryStatus.text}
                </div>
            )}
            
            <div className="mt-4">
                <ApplicantIndicator count={offer.applicantCount} />
            </div>

            <p className="mt-4 text-sm text-gray-600 line-clamp-3">
                {offer.summary}
            </p>

             {presentation.location && (
                <div className="flex items-center text-gray-500 mt-3 text-xs">
                    <MapPinIcon className="h-4 w-4" />
                    <p className="ml-1.5">{presentation.location}</p>
                </div>
            )}

            <div className="mt-4 flex justify-between items-end">
                <div className="flex flex-wrap gap-2">
                    {presentation.tags.slice(0, 4).map((tag, index) => (
                        <span key={index} className={`px-2 py-1 ${tagClasses} text-xs font-semibold rounded-full`}>
                            {tag}
                        </span>
                    ))}
                </div>
                {presentation.priceInfo && (
                    <div className="flex-shrink-0 ml-2">
                        <p className="text-lg font-bold text-green-600 whitespace-nowrap">{presentation.priceInfo}</p>
                    </div>
                )}
            </div>
      </div>
      
      {isExpanded && (
        <div className="px-5 pb-5 border-t border-gray-100 animate-fade-in">
          <div className="mt-4 space-y-4">
            {offer.type === OfferType.JOB && (
              <>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center"><ListBulletIcon /><span className="ml-2">Responsibilities</span></h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                    {offer.responsibilities.map((item, index) => <li key={index}>{item}</li>)}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center"><CodeBracketIcon /><span className="ml-2">All Skills</span></h4>
                  <div className="flex flex-wrap gap-2">
                    {offer.skills.map((skill, index) => (
                        <span key={index} className={`px-2 py-1 ${tagClasses} text-xs font-semibold rounded-full`}>
                            {skill}
                        </span>
                    ))}
                  </div>
                </div>
              </>
            )}
             {offer.type === OfferType.PRODUCT && (
                <InfoRow icon={<TagIcon />} text={presentation.details.Condition} label="Condition" />
             )}

            {offer.additionalDetails && (
                <div>
                    <h4 className="font-semibold text-gray-800 mb-2 flex items-center"><ListBulletIcon /><span className="ml-2">Additional Details</span></h4>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{offer.additionalDetails}</p>
                </div>
            )}

            <InfoRow icon={<PhoneIcon />} text={presentation.details.Phone} label="Phone" />
            <InfoRow icon={<EnvelopeIcon />} text={presentation.details.Email} label="Email" />
            <InfoRow icon={<CalendarIcon />} text={formattedExpiryDate} label="Expires At" />
            <InfoRow icon={<CalendarIcon />} text={formattedScannedDate} label="Date Scanned" />

            {/* Action Buttons */}
            <div className="pt-4 border-t border-gray-100 flex space-x-3">
                <button
                    onClick={handleApply}
                    className="flex-1 bg-blue-600 text-white font-bold py-2.5 px-4 rounded-lg shadow-sm hover:bg-blue-700 transition-colors text-sm"
                >
                    Ofertar
                </button>
                <button
                    onClick={handleContact}
                    className="flex-1 bg-white text-gray-800 font-bold py-2.5 px-4 rounded-lg shadow-sm hover:bg-gray-100 border border-gray-300 transition-colors text-sm"
                >
                    Contactar
                </button>
            </div>
          </div>
        </div>
      )}
      
      <div 
        className="border-t border-gray-200 bg-gray-50 hover:bg-gray-100 text-center py-2 cursor-pointer transition-colors duration-200"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-center text-sm font-semibold text-blue-600">
            <span>{isExpanded ? 'Show Less' : 'Show More Details'}</span>
            {isExpanded ? <ChevronUpIcon className="h-5 w-5 ml-1" /> : <ChevronDownIcon className="h-5 w-5 ml-1" />}
        </div>
      </div>
    </div>
  );
};

export default OfferCard;