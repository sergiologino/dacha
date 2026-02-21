export interface Plant {
  id: string;
  name: string;
  bed: string;
  plantedDate: string;
}

export interface Crop {
  id: number;
  name: string;
  slug: string;
  region: string[];
  plantMonth: string;
  harvestMonth: string;
  water: string;
  note: string;
  description?: string;
  category: string;
}

export interface Analysis {
  id: string;
  imageUrl: string;
  result: string;
  date: string;
}
