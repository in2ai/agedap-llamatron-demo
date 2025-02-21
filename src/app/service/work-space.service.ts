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
      console.log('response: ', response);
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
            createdAt: ws.createdAt,
            updatedAt: ws.updatedAt,
            numChats: 0,
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
      console.log('//RECOVERED WORKSPACE: ', response);
      const recoveredWorkspace: WorkSpace = {
        id: response.workspace.id,
        type: response.workspace.type ?? '-',
        name: response.workspace.name ?? '-',
        description: response.workspace.description ?? '-',
        createdAt: response.workspace.createdAt,
        updatedAt: response.workspace.updatedAt,
        numChats: 0,
      };
      console.log('//RECOVERED WORKSPACE CLEAN: ', recoveredWorkspace);
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
      console.log('response: ', response);
      return response.workspaceId;
    } catch (error) {
      throw new Error(`Error deleting workspace : ${error}`);
    }
  }
}
