export enum workSpaceTypeEnum {
  WORKOFFERS = 'workOffers',
  MISCELLANEOUS = 'miscellaneous',
}
export interface WorkSpace {
  id: string; // UUID
  type: workSpaceTypeEnum.WORKOFFERS | workSpaceTypeEnum.MISCELLANEOUS;
  name: string;
  description?: string;
  createdAt: string; // UTC ISO string
  updatedAt: string; // UTC ISO string
  numChats?: number;
}

export const FAKE_WORKSPACES: WorkSpace[] = [
  {
    id: '1',
    type: workSpaceTypeEnum.WORKOFFERS,
    name: 'Workspace 1',
    description: 'Description of Workspace 1',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T08:10:00Z',
    numChats: 3,
  },
  {
    id: '2',
    type: workSpaceTypeEnum.MISCELLANEOUS,
    name: 'Workspace 2',
    description: 'Description of Workspace 2',
    createdAt: '2025-02-11T13:15:00Z',
    updatedAt: '2025-02-11T13:18:00Z',
    numChats: 1,
  },
  {
    id: '3',
    type: workSpaceTypeEnum.MISCELLANEOUS,
    name: 'Workspace 3',
    description: 'Description of Workspace 3',
    createdAt: '2025-02-11T13:15:00Z',
    updatedAt: '2025-02-11T13:18:00Z',
    numChats: 1,
  },

  {
    id: '4',
    type: workSpaceTypeEnum.MISCELLANEOUS,
    name: 'Workspace 4',
    description: 'Description of Workspace 4',
    createdAt: '2025-01-11T13:15:00Z',
    updatedAt: '2025-01-11T13:18:00Z',
    numChats: 1,
  },

  {
    id: '5',
    type: workSpaceTypeEnum.WORKOFFERS,
    name: 'Workspace 5',
    description: 'Description of Workspace 5',
    createdAt: '2025-01-05T13:15:00Z',
    updatedAt: '2025-02-11T13:18:00Z',
    numChats: 1,
  },
];
