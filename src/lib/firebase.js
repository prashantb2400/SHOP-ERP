import { initializeApp }               from 'firebase/app';
import { getAuth, onAuthStateChanged,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { FIREBASE_CFG }                from './constants.js';

let _app=null, _auth=null, _fs=null;

function init() {
  if (_app) return true;
  try { _app=initializeApp(FIREBASE_CFG); _auth=getAuth(_app); _fs=getFirestore(_app); return true; }
  catch (e) { console.warn('[RF] Firebase init:', e.message); return false; }
}

export const fbaseInit = init;

export function fbaseOnAuth(cb) {
  if (!_auth) { cb(null); return ()=>{}; }
  return onAuthStateChanged(_auth, u => cb(u ? {id:u.uid,email:u.email,name:u.displayName||u.email,avatar:u.photoURL} : null));
}

export const fbaseSignIn     = (e,p) => signInWithEmailAndPassword(_auth,e,p).catch(e=>({error:e.message}));
export const fbaseSignUp     = (e,p) => createUserWithEmailAndPassword(_auth,e,p).catch(e=>({error:e.message}));
export const fbaseGoogleIn   = ()    => signInWithPopup(_auth, new GoogleAuthProvider()).catch(e=>({error:e.message}));
export const fbaseSignOut    = ()    => _auth ? signOut(_auth).catch(()=>{}) : Promise.resolve();

export async function fbasePush(uid, blob, ts) {
  if (!_fs) return false;
  try { await setDoc(doc(_fs,'retailflow_data',uid),{blob,ts,v:3}); return true; }
  catch { return false; }
}

export async function fbasePull(uid) {
  if (!_fs) return null;
  try {
    const s = await getDoc(doc(_fs,'retailflow_data',uid));
    return s.exists() ? s.data() : null;
  } catch { return null; }
}
