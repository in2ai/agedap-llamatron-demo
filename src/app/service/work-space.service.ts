import { Injectable } from '@angular/core';
import { WorkSpace } from '../models';

@Injectable({
  providedIn: 'root',
})
export class WorkSpaceService {
  async createWorkSpace(workSpace: WorkSpace): Promise<string> {
    try {
      const response = await (window as any).electronAPI.runNodeCode({
        func: 'newWorkspace',
        ...workSpace,
      });
      const workspaceId = response.workspace.id;
      return workspaceId;
    } catch (error) {
      throw new Error(`Error creating workspace : ${error}`);
    }
  }

  async getWorkSpaces(): Promise<WorkSpace[]> {
    try {
      const response = await (window as any).electronAPI.runNodeCode({
        func: 'getWorkspaces',
        page: 0,
        limit: 10,
      });
      const recoveredWorkSpaces: WorkSpace[] =
        response.workspaces?.map((ws: any) => {
          return {
            id: ws.id,
            type: ws.type ?? '-',
            name: ws.name ?? '-',
            description: ws.description ?? '-',
            relayId: ws.relayId ?? '-',
            documents: ws.documents ?? '-',
            chatIds: ws.chatIds ?? [],
            createdAt: ws.createdAt,
            updatedAt: ws.updatedAt,
          };
        }) ?? [];
      return recoveredWorkSpaces;
    } catch (error) {
      throw new Error(`Error getting workspaces : ${error}`);
    }
  }

  async getWorkSpace(id: string): Promise<WorkSpace> {
    try {
      const response = await (window as any).electronAPI.runNodeCode({
        func: 'getWorkspace',
        workspaceId: id,
      });
      const ws = response.workspace;
      const recoveredWorkspace: WorkSpace = {
        id: ws.id,
        type: ws.type ?? '-',
        name: ws.name ?? '-',
        description: ws.description ?? '-',
        relayId: ws.relayId ?? '-',
        documents: ws.documents ?? '-',
        chatIds: ws.chatIds ?? [],
        createdAt: ws.createdAt,
        updatedAt: ws.updatedAt,
      };
      return recoveredWorkspace;
    } catch (error) {
      throw new Error(`Error getting workspace : ${error}`);
    }
  }

  async deleteWorkSpace(workspaceId: string): Promise<string> {
    try {
      const response = await (window as any).electronAPI.runNodeCode({
        func: 'deleteWorkspace',
        workspaceId,
      });
      return response.workspaceId;
    } catch (error) {
      throw new Error(`Error deleting workspace : ${error}`);
    }
  }
}
