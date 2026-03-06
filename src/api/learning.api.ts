import apiClient from "./client";
import { ENDPOINTS } from "@/config/endpoints";
import type { WeakTopic, Assignment } from "@/types/api.types";

export const learningApi = {
  // Get weak topics
  getWeakTopics: async (): Promise<WeakTopic[]> => {
    const response = await apiClient.get(ENDPOINTS.learning.weakTopics);
    return response.data;
  },

  // Get assignments
  getAssignments: async (): Promise<Assignment[]> => {
    const response = await apiClient.get(ENDPOINTS.learning.assignments);
    return response.data;
  },

  // Complete an assignment
  completeAssignment: async (assignmentId: string): Promise<void> => {
    const response = await apiClient.post(
      ENDPOINTS.learning.completeAssignment(assignmentId)
    );
    return response.data;
  },
};
