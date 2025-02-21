export interface Chat {
  id?: string; // UUID
  workspaceId: string; // UUID
  name: string;
  description: string;
  messages?: string[];
  createdAt?: string; // UTC ISO string
  updatedAt?: string; // UTC ISO string
}
