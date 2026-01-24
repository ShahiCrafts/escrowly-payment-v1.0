import { useState } from 'react';
import { cn } from '../../utils/cn';

const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-2xl',
};

const ImageAvatar = ({
    imageUrl,
    firstName,
    lastName,
    size = 'md',
    showTrustScore = false,
    trustScore = 100,
    className = ''
}) => {
    const [imageError, setImageError] = useState(false);

    const getInitials = () => {
        if (!firstName) return 'U';
        const first = firstName?.charAt(0) || '';
        const last = lastName?.charAt(0) || '';
        return (first + last).toUpperCase();
    };

    const showImage = imageUrl && !imageError;
    const sizeClass = sizeClasses[size] || sizeClasses.md;

    return (
        <div className="relative inline-flex flex-shrink-0">
            <div
                className={cn(
                    'rounded-full flex items-center justify-center overflow-hidden',
                    'bg-gradient-to-br from-blue-400 to-blue-600',
                    sizeClass,
                    className
                )}
            >
                {showImage ? (
                    <img
                        src={imageUrl}
                        alt={`${firstName || 'User'}'s avatar`}
                        className="w-full h-full object-cover"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <span className="font-semibold text-white">
                        {getInitials()}
                    </span>
                )}
            </div>

            {showTrustScore && (
                <div
                    className={cn(
                        "absolute -bottom-0.5 -right-0.5 flex items-center justify-center select-none",
                        size === 'sm' ? "h-3.5 w-3.5" : size === 'lg' ? "h-8 w-8" : size === 'xl' ? "h-12 w-12" : "h-5 w-5",
                    )}
                    title={`Trust Score: ${trustScore}%`}
                >
                    <img
                        src={`/Badge_0${Math.min(5, Math.max(1, Math.floor((trustScore || 0) / 20) + (trustScore % 20 > 0 || trustScore === 0 ? 1 : 0)))}.svg`}
                        alt={`Trust Level`}
                        className="w-full h-full drop-shadow-sm transition-transform hover:scale-110"
                    />
                </div>
            )}
        </div>
    );
};

export default ImageAvatar;
