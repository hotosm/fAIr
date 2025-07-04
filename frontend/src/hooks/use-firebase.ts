import {
  getDatabase,
  ref,
  push,
  set,
  DatabaseReference,
  query,
  get,
  orderByChild,
  equalTo,
} from "firebase/database";

/**
 *  Custom hook to interact with Firebase Realtime Database.
 * @returns An object containing the Firebase database instance, a reference to the MapSwipe draft projects endpoint, and methods to push and set data in the database.
 */
export const useFirebase = () => {
  const database = getDatabase();
  return {
    database,
    ref,
    pushToDatabase: (databaseRef: DatabaseReference) => push(databaseRef),
    setToDatabase: (databaseRef: DatabaseReference, data: any) =>
      set(databaseRef, data),
    query,
    getValueFromFirebase: get,
    orderByChild,
    equalTo,
  };
};
