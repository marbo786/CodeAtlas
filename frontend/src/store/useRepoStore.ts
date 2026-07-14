import { create } from 'zustand';

interface RepoState {
  currentRepoId: string | null;
  setRepoId: (id: string) => void;
  clearRepoId: () => void;
}

export const useRepoStore = create<RepoState>()((set) => ({
  currentRepoId: null,
  setRepoId: (id) => set({ currentRepoId: id }),
  clearRepoId: () => set({ currentRepoId: null }),
}));
