import { useState, useRef } from 'react';
import { Button } from './index';

const AvatarUpload = ({ currentAvatar, onUpload, onRemove, firstName, lastName }) => {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        try {
            await onUpload(file);
        } catch (error) {
            console.error('Failed to upload avatar', error);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const getInitials = () => {
        return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
    };

    return (
        <div className="flex items-center gap-6">
            <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg bg-neutral-100 flex items-center justify-center">
                    {currentAvatar ? (
                        <img
                            src={currentAvatar}
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <span className="text-2xl font-bold text-neutral-400">
                            {getInitials()}
                        </span>
                    )}
                </div>
                {isUploading && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                    <Button
                        variant="secondary"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        size="sm"
                    >
                        Change Photo
                    </Button>
                    {currentAvatar && (
                        <Button
                            variant="danger"
                            onClick={onRemove}
                            disabled={isUploading}
                            size="sm"
                        >
                            Remove
                        </Button>
                    )}
                </div>
                <p className="text-xs text-neutral-500">
                    JPG, GIF or PNG. Max size 5MB.
                </p>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/jpeg,image/png,image/gif"
                    className="hidden"
                />
            </div>
        </div>
    );
};

export default AvatarUpload;
