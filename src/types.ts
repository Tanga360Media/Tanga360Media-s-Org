export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export interface RegistrationPeriod {
  id: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  seasonName: string;
}

export interface Team {
  id: string;
  name: string;
  managerId: string;
  logoUrl?: string;
  paymentStatus: 'PENDING' | 'CONFIRMED' | 'REJECTED';
  paymentProofUrl?: string;
  paymentMethod?: string;
  createdAt: string;
  isApproved: boolean;
  group?: string; // e.g. 'A', 'B', 'C', 'D'
  played?: number;
  won?: number;
  drawn?: number;
  lost?: number;
  goalsFor?: number;
  goalsAgainst?: number;
  points?: number;
}

export interface Player {
  id: string;
  teamId: string;
  name: string;
  photoUrl: string;
  position: string;
  jerseyNumber: number;
  idNumber?: string;
}

export interface Staff {
  id: string;
  teamId: string;
  name: string;
  role: string;
  photoUrl: string;
}

export interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  matchDate: string;
  scoreHome?: number;
  scoreAway?: number;
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED';
  venue?: string;
}

export interface UserProfile {
  email: string;
  role: 'ADMIN' | 'TEAM_MANAGER';
  displayName: string;
  photoURL?: string;
  teamId?: string;
}
