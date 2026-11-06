'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { AuthProvider } from '@/lib/AuthContext';
import { AudioPlayerProvider } from '@/context/AudioPlayerContext';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as HotToaster } from 'react-hot-toast';

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <AudioPlayerProvider>
        <QueryClientProvider client={queryClientInstance}>
          {children}
          <Toaster />
          <HotToaster position="bottom-center" toastOptions={{ duration: 3500 }} />
        </QueryClientProvider>
      </AudioPlayerProvider>
    </AuthProvider>
  );
}
