import { Food } from './food';

export interface Load {
  id?: number;
  loadDate: Date;
  items: LoadItem[];
}

export interface LoadItem {
  id?: number;
  foodId: number;
  loadId?: number;
  quantity: number;
  food?: Food;
}
