export interface ClusterData {
  id: string;
  name: string;
  description: string;
  subject: string;
  isCentral: boolean;
}

export interface LessonData {
  id: string;
  title: string;
  skills: string[];
  description: string;
  activitiesCount: number;
  metadata?: any;
}

export interface ActivityData {
  id: string;
  title: string;
  skill: string;
  type: string;
  grade: string;
  difficulty: string;
  data: any;
  orderIndex: number;
}
