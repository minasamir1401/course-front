export interface QuestionProps {
  question: any;
  value: string;
  onChange: (val: string) => void;
  language: string;
}

export interface MemoryCard {
  id: number;
  content: string;
  type: "term" | "definition";
  pairId: number;
  isFlipped: boolean;
  isMatched: boolean;
}
