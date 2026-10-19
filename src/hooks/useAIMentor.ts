import { useEffect, useSyncExternalStore } from 'react';
import { aiMentor } from '../services/aiMentor/index.ts';
import type { AIMentorService } from '../services/aiMentor/types.ts';

// https://react.dev/reference/react/useSyncExternalStore
export function useAIMentor(scopeId: string, service: AIMentorService = aiMentor) {
  const snapshot = useSyncExternalStore(service.subscribe, service.getSnapshot, service.getSnapshot);
  useEffect(() => {
    void service.clearResponse();
    return () => { void service.clearResponse(); };
  }, [scopeId, service]);
  return {
    ...snapshot,
    supported: snapshot.capabilities?.adapterAvailable,
    ready: service.isReady(),
    initialize: service.initialize,
    generateHint: service.generateHint,
    cancel: service.cancelGeneration,
    dispose: service.dispose,
  };
}
