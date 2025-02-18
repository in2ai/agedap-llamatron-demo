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
}

export const FAKE_WORKSPACES: WorkSpace[] = [
  {
    id: '1',
    type: workSpaceTypeEnum.WORKOFFERS,
    name: 'Workspace 1',
    description: 'Description of Workspace 1',
    createdAt: '2021-01-01T00:00:00Z',
    updatedAt: '2021-01-01T00:00:00Z',
  },
  {
    id: '2',
    type: workSpaceTypeEnum.MISCELLANEOUS,
    name: 'Workspace 2',
    description: 'Description of Workspace 2',
    createdAt: '2021-01-01T00:00:00Z',
    updatedAt: '2021-01-01T00:00:00Z',
  },
];
