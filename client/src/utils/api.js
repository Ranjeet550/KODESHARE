import apiClient from './apiClient';
import { getApiUrl } from '../config/apiConfig';

// Create a new code share
export const createCodeShare = async (codeShareData) => {
  try {
    console.log('API: Sending create code share request:', codeShareData);
    const res = await apiClient.post(getApiUrl('/codeshare'), codeShareData);
    console.log('API: Create code share response:', res.data);
    return res.data;
  } catch (error) {
    console.error('API: Create code share error:', error.response || error);
    throw error.response?.data || { message: 'Error creating code share' };
  }
};

// Create a code share with custom ID
export const createCodeShareWithCustomId = async (customId, codeShareData) => {
  try {
    const data = {
      ...codeShareData,
      customId
    };
    const res = await apiClient.post(getApiUrl('/codeshare'), data);
    return res.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error creating code share with custom ID' };
  }
};

// Get a code share by ID
export const getCodeShareById = async (id) => {
  try {
    const res = await apiClient.get(getApiUrl(`/codeshare/${id}`));
    return res.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error fetching code share' };
  }
};

// Update a code share
export const updateCodeShare = async (id, codeShareData) => {
  try {
    const res = await apiClient.put(getApiUrl(`/codeshare/${id}`), codeShareData);
    return res.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error updating code share' };
  }
};

// Delete a code share
export const deleteCodeShare = async (id) => {
  try {
    const res = await apiClient.delete(getApiUrl(`/codeshare/${id}`));
    return res.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error deleting code share' };
  }
};

// Get all code shares for the current user
export const getUserCodeShares = async () => {
  try {
    const res = await apiClient.get(getApiUrl('/codeshare/user/me'));
    return res.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error fetching user code shares' };
  }
};

// Add a collaborator to a code share
export const addCollaborator = async (codeShareId, collaboratorId) => {
  try {
    const res = await apiClient.post(getApiUrl(`/codeshare/${codeShareId}/collaborators`), { collaboratorId });
    return res.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error adding collaborator' };
  }
};
