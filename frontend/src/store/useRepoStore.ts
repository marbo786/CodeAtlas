import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface RepoState {
  currentRepoId: string | null;
  setRepoId: (id: string) => void;
  clearRepoId: () => void;
}

export const useRepoStore = create<RepoState>()(
  persist(
    (set) => ({
      currentRepoId: null,
      setRepoId: (id) => set({ currentRepoId: id }),
      clearRepoId: () => set({ currentRepoId: null }),
    }),
    { name: 'codeatlas-repo-store' }
  )
);
