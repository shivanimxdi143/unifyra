import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 45000 // 45 seconds for AI analysis calls
});

// Helper to format API error messages
export const getErrorMessage = (error) => {
  if (error.response?.data?.error?.message) {
    return error.response.data.error.message;
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  return error.message || 'An unexpected network error occurred';
};

// ==========================================
// Health Check
// ==========================================
export const checkHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

// ==========================================
// Brand Guidelines APIs
// ==========================================
export const getGuidelines = async (params = {}) => {
  const response = await api.get('/guidelines', { params });
  return response.data; // { success: true, count, data: [...] }
};

export const getGuidelineById = async (id) => {
  const response = await api.get(`/guidelines/${id}`);
  return response.data; // { success: true, data: {...} }
};

export const createGuideline = async (data) => {
  const response = await api.post('/guidelines', data);
  return response.data; // { success: true, message, data: {...} }
};

export const updateGuideline = async (id, data) => {
  const response = await api.put(`/guidelines/${id}`, data);
  return response.data; // { success: true, message, data: {...} }
};

export const deleteGuideline = async (id) => {
  const response = await api.delete(`/guidelines/${id}`);
  return response.data; // { success: true, message, data: { id } }
};

// ==========================================
// Content Submissions APIs
// ==========================================
export const getSubmissions = async (params = {}) => {
  const response = await api.get('/submissions', { params });
  return response.data; // { success: true, count, data: [...] }
};

export const getSubmissionById = async (id) => {
  const response = await api.get(`/submissions/${id}`);
  return response.data; // { success: true, data: { ...submission, findings: [...] } }
};

export const getSubmissionsByUser = async (userId) => {
  const response = await api.get(`/submissions/user/${encodeURIComponent(userId)}`);
  return response.data; // { success: true, count, data: [...] }
};

export const createSubmission = async (data) => {
  const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
  const config = isFormData ? { headers: { 'Content-Type': undefined } } : {};
  const response = await api.post('/submissions', data, config);
  return response.data; // { success: true, message, data: {...} }
};

export const resubmitContent = async (id, data) => {
  const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
  const config = isFormData ? { headers: { 'Content-Type': undefined } } : {};
  const response = await api.put(`/submissions/${id}/resubmit`, data, config);
  return response.data; // { success: true, message, data: {...} }
};

export const getSubmissionDocumentUrl = (id) => `${API_BASE_URL}/submissions/${id}/document`;
export const getSubmissionImageUrl = (id) => `${API_BASE_URL}/submissions/${id}/image`;

// ==========================================
// Gemini Compliance Analysis API
// ==========================================
export const analyzeSubmission = async (submissionId) => {
  const response = await api.post(`/analysis/${submissionId}`);
  return response.data; // { success: true, message, data: { submissionId, status, findingsCount, findings } }
};

// ==========================================
// Human Review Workflow APIs
// ==========================================
export const getPendingReviews = async () => {
  const response = await api.get('/reviews/pending');
  return response.data; // { success: true, count, data: [...] }
};

export const createReview = async (submissionId, data) => {
  const response = await api.post(`/reviews/${submissionId}`, data);
  return response.data; // { success: true, message, data: { review, submission } }
};

export const getReviewHistory = async (submissionId) => {
  const response = await api.get(`/reviews/${submissionId}`);
  return response.data; // { success: true, count, data: [...] }
};

// ==========================================
// Brand Drift Intelligence & Suggestions APIs
// ==========================================
export const getDriftAnalytics = async (params = {}) => {
  const response = await api.get('/analytics/drift', { params });
  return response.data; // { success: true, data: { summary, topRecurringViolations, categoryBreakdown, channelBreakdown, timelineTrends, ... } }
};

export const getGuidelineSuggestions = async (params = {}) => {
  const response = await api.get('/analytics/suggestions', { params });
  return response.data; // { success: true, count, data: [...] }
};

export const generateGuidelineSuggestions = async () => {
  const response = await api.post('/analytics/suggest-guideline-refinements');
  return response.data; // { success: true, message, data: [...] }
};

export const approveGuidelineSuggestion = async (id, data = {}) => {
  const response = await api.post(`/analytics/suggestions/${id}/approve`, data);
  return response.data; // { success: true, message, data: { suggestion, guideline } }
};

export const dismissGuidelineSuggestion = async (id, data = {}) => {
  const response = await api.post(`/analytics/suggestions/${id}/dismiss`, data);
  return response.data; // { success: true, message, data: suggestion }
};

export default api;
