import { useClientConfig } from '@/client-config/hooks/useClientConfig';
import { applyBranding } from '@/client-config/utils/applyBranding';
import { clientConfigApiStatusState } from '@/client-config/states/clientConfigApiStatusState';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { useEffect } from 'react';
import { isDefined } from 'twenty-shared/utils';

export const ClientConfigProviderEffect = () => {
  const [clientConfigApiStatus, setClientConfigApiStatus] = useAtomState(
    clientConfigApiStatusState,
  );

  const { data, loading, error, fetchClientConfig } = useClientConfig();

  useEffect(() => {
    if (
      !clientConfigApiStatus.isLoadedOnce &&
      !clientConfigApiStatus.isLoading
    ) {
      fetchClientConfig();
    }
  }, [
    clientConfigApiStatus.isLoadedOnce,
    clientConfigApiStatus.isLoading,
    fetchClientConfig,
  ]);

  useEffect(() => {
    if (loading) return;

    if (error instanceof Error) {
      setClientConfigApiStatus((currentStatus) => ({
        ...currentStatus,
        isErrored: true,
        error,
      }));
      return;
    }

    if (!isDefined(data?.clientConfig)) {
      return;
    }

    // Per-deployment branding: applied as soon as config lands, before the
    // app renders anything the user would notice re-colouring.
    applyBranding(data?.clientConfig?.branding);
  }, [data?.clientConfig, error, loading, setClientConfigApiStatus]);

  return <></>;
};
