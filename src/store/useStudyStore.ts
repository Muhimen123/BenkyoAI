import { create } from 'zustand';

interface StudyState {
  sessionId: string | null;
  setSessionId: (id: string) => void;
}

export const useStudyStore = create<StudyState>((set) => ({
  sessionId: null,
  setSessionId: (id) => set({ sessionId: id }),
}));
