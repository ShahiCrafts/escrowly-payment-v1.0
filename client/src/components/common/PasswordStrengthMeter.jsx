import React from 'react';
import zxcvbn from 'zxcvbn';

const PasswordStrengthMeter = ({ password }) => {
    const testResult = zxcvbn(password || '');
    const score = testResult.score; // 0-4

    const createPassLabel = () => {
        switch (score) {
            case 0: return 'Very Weak';
            case 1: return 'Weak';
            case 2: return 'Fair';
            case 3: return 'Good';
            case 4: return 'Strong';
            default: return '';
        }
    };

    const funcProgressColor = () => {
        switch (score) {
            case 0: return 'bg-red-500';
            case 1: return 'bg-red-500';
            case 2: return 'bg-yellow-500';
            case 3: return 'bg-blue-500';
            case 4: return 'bg-green-500';
            default: return 'bg-gray-200';
        }
    };

    const changePasswordColor = () => ({
        width: `${((score + 1) / 5) * 100}%`,
        height: '7px'
    });

    return (
        <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                <div
                    className={`h-2.5 rounded-full transition-all duration-300 ${funcProgressColor()}`}
                    style={{ width: `${(score + 1) * 20}%` }}
                ></div>
            </div>
            <p className={`text-xs text-right ${funcProgressColor().replace('bg-', 'text-')}`}>
                {createPassLabel()}
            </p>
            {testResult.feedback.warning && (
                <p className="text-xs text-red-500 mt-1">{testResult.feedback.warning}</p>
            )}
            {testResult.feedback.suggestions.length > 0 && (
                <ul className="text-xs text-gray-500 mt-1 list-disc list-inside">
                    {testResult.feedback.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
            )}
        </div>
    );
};

export default PasswordStrengthMeter;
