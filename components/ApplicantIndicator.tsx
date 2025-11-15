import React from 'react';
import { Avatar, AvatarFallback } from './Avatar';
import { UserIcon } from './Icons';

interface ApplicantIndicatorProps {
  count: number;
}

const APPLICANT_INITIALS = [
    { initials: 'JD', color: 'bg-blue-200' },
    { initials: 'AS', color: 'bg-green-200' },
    { initials: 'MG', color: 'bg-purple-200' },
    { initials: 'RK', color: 'bg-orange-200' },
];

const ApplicantIndicator: React.FC<ApplicantIndicatorProps> = ({ count }) => {
    if (!count || count === 0) {
        return (
             <div className="flex items-center text-xs text-gray-400">
                <UserIcon className="h-4 w-4 mr-1"/>
                <span>Be the first to apply</span>
            </div>
        );
    }

    const avatarsToShow = Math.min(count, 3);
    const remainingCount = count - avatarsToShow;

    return (
        <div className="flex items-center">
            <div className="flex -space-x-3 items-center">
                {Array.from({ length: avatarsToShow }).map((_, index) => (
                    <Avatar key={index} className="border-2 border-white">
                        <AvatarFallback className={APPLICANT_INITIALS[index % APPLICANT_INITIALS.length].color}>
                            {APPLICANT_INITIALS[index % APPLICANT_INITIALS.length].initials}
                        </AvatarFallback>
                    </Avatar>
                ))}
                {remainingCount > 0 && (
                     <Avatar className="border-2 border-white">
                        <AvatarFallback className="bg-gray-300 text-gray-700">
                            +{remainingCount}
                        </AvatarFallback>
                    </Avatar>
                )}
            </div>
            <span className="ml-2 text-sm font-medium text-gray-600">
                {count} {count === 1 ? 'applicant' : 'applicants'}
            </span>
        </div>
    );
};

export default ApplicantIndicator;
