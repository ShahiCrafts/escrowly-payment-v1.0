import api from './api';

export const uploadAvatar = async (formData) => {
    const response = await api.post('/users/profile/avatar', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const removeAvatar = async () => {
    const response = await api.delete('/users/profile/avatar');
    return response.data;
};

export const updateProfile = async (data) => {
    const response = await api.put('/users/profile', data);
    return response.data;
};
