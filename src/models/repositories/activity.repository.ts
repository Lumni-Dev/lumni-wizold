import { isActivity, type Activity } from "../entities/activity";

const STORAGE_KEY = "lumni-wizold:activity";

export const activityRepository = {
  load(): Activity | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const data: unknown = JSON.parse(raw);
      return isActivity(data) ? data : null;
    } catch {
      return null;
    }
  },

  save(activity: Activity | null): void {
    if (typeof window === "undefined") return;
    try {
      if (activity === null) window.localStorage.removeItem(STORAGE_KEY);
      else window.localStorage.setItem(STORAGE_KEY, JSON.stringify(activity));
    } catch {}
  },
};
