import { API_ENDPOINTS } from "@/services";
import { getDatabase, ref, push, set } from "firebase/database";

/**
 *  Custom hook to interact with Firebase Realtime Database.
 * @returns An object containing the Firebase database instance, a reference to the MapSwipe draft projects endpoint, and methods to push and set data in the database.
 */
export const useFirebase = () => {
  const database = getDatabase();
  const databaseRef = ref(
    database,
    API_ENDPOINTS.CREATE_MAPSWIPE_DRAFT_PROJECTS,
  );
  return {
    database,
    databaseRef,
    pushToDatabase: () => push(databaseRef),
    setToDatabase: (data: any) => set(databaseRef, data),
  };
};
