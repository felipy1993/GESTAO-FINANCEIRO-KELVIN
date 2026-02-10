import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  getDoc,
  onSnapshot
} from 'firebase/firestore';
import { db, auth } from './firebase';

export const firestoreService = {
  // Generic helper to get user-scoped collection
  getUserCollection: (name: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    return name;
  },

  // REAL-TIME FETCHING (Snapshot)
  subscribeToData: (collectionName: string, callback: (data: any[]) => void) => {
    const user = auth.currentUser;
    if (!user) return () => {};
    
    const colRef = collection(db, 'users', user.uid, collectionName);
    return onSnapshot(colRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(data);
    }, (error) => {
      console.error(`Error subscribing to ${collectionName}:`, error);
    });
  },

  // DATA FETCHING (One-time - for initial or specific needs)
  loadData: async <T>(collectionName: string): Promise<T[]> => {
    const user = auth.currentUser;
    if (!user) return [];
    
    const colRef = collection(db, 'users', user.uid, collectionName);
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as T[];
  },
// ... (rest is the same)
  // DATA SAVING
  saveItem: async (collectionName: string, id: string, data: any) => {
    const user = auth.currentUser;
    if (!user) return;
    
    const docRef = doc(db, 'users', user.uid, collectionName, id);
    await setDoc(docRef, data, { merge: true });
  },

  // DATA DELETING
  deleteItem: async (collectionName: string, id: string) => {
    const user = auth.currentUser;
    if (!user) return;
    
    const docRef = doc(db, 'users', user.uid, collectionName, id);
    await deleteDoc(docRef);
  },

  // BULK SAVE (Useful for migration)
  bulkSave: async (collectionName: string, items: any[]) => {
    const user = auth.currentUser;
    if (!user) return;
    
    for (const item of items) {
      const id = item.id || crypto.randomUUID();
      const docRef = doc(db, 'users', user.uid, collectionName, id);
      await setDoc(docRef, item, { merge: true });
    }
  }
};
