export interface Family {
  id?: number;
  name: string;
  members: number;
  children: number;
  isee: number;
  isOccasional: boolean;
  necessityLevel: AssistanceLevel;
}

export enum AssistanceLevel {
  VeryLow = 'VeryLow',
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  VeryHigh = 'VeryHigh',
}

export interface FamilyDistribution {
  familyId: number;
  distributionId: number;
  distributionDate: Date;
  // null = not recorded
  present: boolean | null;
}
