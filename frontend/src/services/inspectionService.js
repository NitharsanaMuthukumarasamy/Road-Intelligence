import api from './api';

export const inspectionService = {
  /**
   * Retrieves actual calculated detection summary for an inspection:
   * GET /api/inspections/{inspectionId}/summary
   */
  getInspectionSummary: async (inspectionId) => {
    const response = await api.get(`/inspections/${inspectionId}/summary`);
    return response.data;
  },

  /**
   * Retrieves full inspection details with detections, bounding boxes, and recommendations
   */
  getInspection: async (inspectionId) => {
    const response = await api.get(`/inspections/${inspectionId}`);
    return response.data;
  },

  /**
   * Lists all inspections with optional status/severity filters
   */
  listInspections: async (params) => {
    const response = await api.get('/inspections', { params });
    return response.data;
  },
};

export default inspectionService;
