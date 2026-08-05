import { api } from "@/lib/api";

export interface CreateStepPayload {
  name: string;
  type: string;
  config?: Record<string, unknown>;
}

export interface UpdateStepPayload {
  name?: string;
  type?: string;
  config?: Record<string, unknown>;
}

export async function createStep(
  workflowId: string,
  data: CreateStepPayload
) {
  const response = await api.post(
    `/workflows/${workflowId}/steps`,
    data
  );

  return response.data.data.step;
}

export async function updateStep(
  stepId: string,
  data: UpdateStepPayload
) {
  const response = await api.put(
    `/workflow-steps/${stepId}`,
    data
  );

  return response.data.data.step;
}

export async function deleteStep(stepId: string) {
  await api.delete(`/workflow-steps/${stepId}`);
}

export async function reorderSteps(
  workflowId: string,
  stepIds: string[]
) {
  await api.put(
    `/workflows/${workflowId}/steps/reorder`,
    {
      steps: stepIds.map((id, index) => ({
        id,
        stepOrder: index + 1,
      })),
    }
  );
}