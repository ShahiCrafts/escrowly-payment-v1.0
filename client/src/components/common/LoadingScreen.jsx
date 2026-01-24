import { Spinner } from './Spinner';

const LoadingScreen = ({ message = 'Loading...' }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
                <Spinner size="xl" className="text-indigo-600" />
                <p className="text-neutral-600 font-medium animate-pulse">{message}</p>
            </div>
        </div>
    );
};

export default LoadingScreen;
