import { OperationType, FirestoreErrorInfo } from '../types';
import { auth } from './firebase';

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMsg = error instanceof Error ? error.message : String(error);
  const isQuotaError = errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('resource-exhausted');

  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };

  console.error('Firestore Error: ', JSON.stringify(errInfo));

  if (typeof window !== 'undefined' && isQuotaError) {
    window.dispatchEvent(new CustomEvent('firestore-quota-exceeded', { detail: errInfo }));
    // Do not throw fatal uncaught exceptions for quota exhaustion in snapshot listeners,
    // which crash the app UI. Log the error and return so the app remains responsive.
    return;
  }

  throw new Error(JSON.stringify(errInfo));
}
