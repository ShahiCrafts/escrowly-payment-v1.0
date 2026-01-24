import { useState, useCallback } from 'react';

export const useForm = (initialValues = {}) => {
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        setValues(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    }, []);

    const handleBlur = useCallback((e) => {
        const { name } = e.target;
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    }, [errors]);

    const reset = useCallback(() => {
        setValues(initialValues);
        setErrors({});
        setIsSubmitting(false);
    }, [initialValues]);

    const setFieldValue = useCallback((name, value) => {
        setValues(prev => ({ ...prev, [name]: value }));
    }, []);

    const setFieldError = useCallback((name, error) => {
        setErrors(prev => ({ ...prev, [name]: error }));
    }, []);

    return {
        values,
        errors,
        isSubmitting,
        handleChange,
        handleBlur,
        setValues,
        setErrors,
        setIsSubmitting,
        setFieldValue,
        setFieldError,
        reset
    };
};

export default useForm;
