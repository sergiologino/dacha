export interface Plant {
  id: string;
  name: string;
  bed: string;
  plantedDate: string;
}

export interface CropVariety {
  name: string;
  desc: string;
  /** Иллюстрация конкретного сорта (дачники / генерация). */
  imageUrl?: string;
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
  imageUrl?: string;
  varieties?: CropVariety[];
}

export interface Analysis {
  id: string;
  imageUrl: string;
  result: string;
  date: string;
}
