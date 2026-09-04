import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import { SavedAnalysisRecord, CropAnalysisInput, CropAnalysisResult, ChatMessage } from "../types";

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Firebase Authentication instance
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

// Cloud Firestore instance with project database configuration
export const db =
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)"
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);

// Authentication helper methods
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error("Firebase Google Sign-In error:", error);
    throw error;
  }
}

export async function logOut(): Promise<void> {
  await signOut(auth);
}

// ----------------------------------------------------------------------------
// Cloud Firestore Data Operations (Strictly User-Scoped)
// ----------------------------------------------------------------------------

const ANALYSES_COLLECTION = "analyses";

/**
 * Saves a new crop analysis into Cloud Firestore under the user's UID.
 */
export async function saveCropAnalysis(
  user: User,
  input: CropAnalysisInput,
  result: CropAnalysisResult
): Promise<string> {
  const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const docRef = doc(db, ANALYSES_COLLECTION, analysisId);

  const newRecord: SavedAnalysisRecord = {
    id: analysisId,
    userId: user.uid,
    userEmail: user.email,
    userDisplayName: user.displayName || "Farmer",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    input,
    result,
    chatHistory: [],
  };

  await setDoc(docRef, newRecord);
  return analysisId;
}

/**
 * Fetches all saved analyses belonging strictly to the specified user.
 */
export async function getUserAnalyses(userId: string): Promise<SavedAnalysisRecord[]> {
  try {
    const q = query(
      collection(db, ANALYSES_COLLECTION),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    const records: SavedAnalysisRecord[] = [];
    snapshot.forEach((docSnap) => {
      records.push(docSnap.data() as SavedAnalysisRecord);
    });
    return records;
  } catch (error: any) {
    // If index is building or composite order fails, fallback to where query and client sort
    console.warn("Ordered query fallback:", error);
    const fallbackQ = query(
      collection(db, ANALYSES_COLLECTION),
      where("userId", "==", userId)
    );
    const fallbackSnap = await getDocs(fallbackQ);
    const records: SavedAnalysisRecord[] = [];
    fallbackSnap.forEach((docSnap) => {
      records.push(docSnap.data() as SavedAnalysisRecord);
    });
    return records.sort((a, b) => b.createdAt - a.createdAt);
  }
}

/**
 * Real-time listener for user's saved crop analyses
 */
export function subscribeToUserAnalyses(
  userId: string,
  onUpdate: (analyses: SavedAnalysisRecord[]) => void,
  onError?: (error: Error) => void
) {
  const q = query(
    collection(db, ANALYSES_COLLECTION),
    where("userId", "==", userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const records: SavedAnalysisRecord[] = [];
      snapshot.forEach((docSnap) => {
        records.push(docSnap.data() as SavedAnalysisRecord);
      });
      records.sort((a, b) => b.createdAt - a.createdAt);
      onUpdate(records);
    },
    (error) => {
      console.error("Firestore subscription error:", error);
      if (onError) onError(error);
    }
  );
}

/**
 * Retrieves a single crop analysis record by ID
 */
export async function getAnalysisById(analysisId: string): Promise<SavedAnalysisRecord | null> {
  const docRef = doc(db, ANALYSES_COLLECTION, analysisId);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return snap.data() as SavedAnalysisRecord;
  }
  return null;
}

/**
 * Deletes a crop analysis record by ID
 */
export async function deleteAnalysis(analysisId: string): Promise<void> {
  const docRef = doc(db, ANALYSES_COLLECTION, analysisId);
  await deleteDoc(docRef);
}

/**
 * Updates the chat message history for an existing analysis
 */
export async function updateAnalysisChatHistory(
  analysisId: string,
  chatHistory: ChatMessage[]
): Promise<void> {
  const docRef = doc(db, ANALYSES_COLLECTION, analysisId);
  await updateDoc(docRef, {
    chatHistory,
    updatedAt: Date.now(),
  });
}
