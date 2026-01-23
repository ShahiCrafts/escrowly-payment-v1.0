import { useState, useRef } from 'react';
import { Button } from './index';
import ImageAvatar from './ImageAvatar';

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

    return (
        <div className="flex items-center gap-6">
            <div className="relative">
                <ImageAvatar
                    imageUrl={currentAvatar}
                    firstName={firstName}
                    lastName={lastName}
                    size="xl"
                    className="border-4 border-white"
                />
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
