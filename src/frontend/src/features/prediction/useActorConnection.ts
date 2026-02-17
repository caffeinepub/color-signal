import { useQueryClient } from '@tanstack/react-query';
import { useActor } from '../../hooks/useActor';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';

export function useActorConnection() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const isReady = !!actor && !isFetching;
  const isConnecting = isFetching;
  const hasError = !actor && !isFetching;

  const retry = () => {
    // Invalidate with the correct query key shape that matches useActor
    queryClient.invalidateQueries({ 
      queryKey: ['actor', identity?.getPrincipal().toString()] 
    });
  };

  return {
    isReady,
    isConnecting,
    hasError,
    retry,
  };
}
