'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDIDStore } from '@/lib/stores/did-store';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { toast } from './toast';
import { initalizeAllStores } from '@/lib/stores/storage-utils';

export function DIDLoginForm() {
  const [inputDid, setInputDid] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setDid, validateDidFormat } = useDIDStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputDid.trim()) {
      toast({
        type: 'error',
        description: 'Please enter a DID',
      });
      return;
    }

    if (!validateDidFormat(inputDid)) {
      toast({
        type: 'error',
        description: 'Please enter a valid DID in format: did:nuwa:username',
      });
      return;
    }

    setIsLoading(true);

    try {
      setDid(inputDid);
      initalizeAllStores();
      toast({
        type: 'success',
        description: 'Successfully signed in!',
      });
      router.push('/');
    } catch (error) {
      toast({
        type: 'error',
        description:
          error instanceof Error ? error.message : 'Authentication failed',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4 sm:px-16">
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="did"
          className="text-zinc-600 font-normal dark:text-zinc-400"
        >
          DID (Decentralized Identifier)
        </Label>

        <Input
          id="did"
          name="did"
          className="bg-muted text-md md:text-sm"
          type="text"
          placeholder="did:nuwa:username"
          required
          autoFocus
          value={inputDid}
          onChange={(e) => setInputDid(e.target.value)}
          pattern="^did:.+$"
          title="DID must be in format: did:nuwa:username"
        />
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Sign in'}
      </Button>

      <p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
        DID format: did:nuwa:username
      </p>
    </form>
  );
}
