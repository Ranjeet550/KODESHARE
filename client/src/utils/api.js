import axios from 'axios';

// Create a new code share
export const createCodeShare = async (codeShareData) => {
  try {
    const res = await axios.post('/codeshare', codeShareData);
    return res.data;
  } catch (error) {
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
    const res = await axios.post('/codeshare', data);
    return res.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error creating code share with custom ID' };
  }
};

// Get a code share by ID
export const getCodeShareById = async (id) => {
  try {
    const res = await axios.get(`/codeshare/${id}`);
    return res.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error fetching code share' };
  }
};

// Update a code share
export const updateCodeShare = async (id, codeShareData) => {
  try {
    const res = await axios.put(`/codeshare/${id}`, codeShareData);
    return res.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error updating code share' };
  }
};

// Delete a code share
export const deleteCodeShare = async (id) => {
  try {
    const res = await axios.delete(`/codeshare/${id}`);
    return res.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error deleting code share' };
  }
};

// Get all code shares for the current user
export const getUserCodeShares = async () => {
  try {
    const res = await axios.get('/codeshare/user/me');
    return res.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error fetching user code shares' };
  }
};

// Add a collaborator to a code share
export const addCollaborator = async (codeShareId, collaboratorId) => {
  try {
    const res = await axios.post(`/codeshare/${codeShareId}/collaborators`, { collaboratorId });
    return res.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error adding collaborator' };
  }
};
