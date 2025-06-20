'use client';

import { useIdentityKit } from '@/lib/identity-kit/provider';
import { Button } from '@/components/ui/button';

export function ConnectButton() {
  const { state, connect } = useIdentityKit();

  if (state.isConnected) return null;

  return (
    <Button onClick={connect} disabled={state.isConnecting}>
      {state.isConnecting ? 'Connecting…' : 'Sign-in with DID'}
    </Button>
  );
}

export default '' 