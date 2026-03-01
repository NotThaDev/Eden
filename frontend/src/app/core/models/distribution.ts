import { Food } from './food';
import { Family } from './family';

export interface Distribution {
  id?: number;
  distributionDate: Date;
  items: DistributionFamily[];
}

export interface DistributionFamily {
  familyId: number;
  family: Family;
  distributionItems: DistributionItem[];
}

export interface DistributionItem {
  quantity: number;
  foodId: number;
  food: Food;
}
