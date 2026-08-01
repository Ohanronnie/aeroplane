export type Service = {
  id: string;
  name: string;
  slug: string;
  repoFullName: string | null;
  repoUrl: string;
  branch: string;
  internalPort: number;
  status: string;
  primaryUrl?: string | null;
};

export type Project = {
  id: string;
  name: string;
  slug: string;
  status: string;
  services: Service[];
};

export type Deployment = {
  id: string;
  serviceId: string;
  status: string;
  createdAt: string;
};

export type DeploymentLog = {
  id: number;
  line: string;
  stream: string;
};
