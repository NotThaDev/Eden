export interface Family {
  id?: number;
  name: string;
  members: number;
  children: number;
  isee: number;
  necessityLevel: AssistanceLevel;
}

export enum AssistanceLevel {
  VeryLow = 'VeryLow',
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  VeryHigh = 'VeryHigh',
}
