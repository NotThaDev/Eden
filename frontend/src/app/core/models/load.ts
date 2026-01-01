import { Food } from './food';

export interface Load {
  id?: string;
  loadDate: Date;
  items: LoadItem[];
}

export interface LoadItem {
  id?: string;
  foodId: string;
  loadId?: string;
  quantity: number;
  food?: Food;
}
