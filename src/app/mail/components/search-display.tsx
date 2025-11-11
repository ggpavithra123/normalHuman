'use client'
import DOMPurify from 'dompurify';
import { useAtom } from 'jotai';
import React from 'react';
import { isSearchingAtom, searchValueAtom } from './search-bar';
import { api } from '@/trpc/react';
import { useDebounceValue, useLocalStorage } from 'usehooks-ts';
import { useThread } from '../use-thread';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const SearchDisplay = () => {
  const [searchValue] = useAtom(searchValueAtom);
  const [isSearching, setIsSearching] = useAtom(isSearchingAtom);
  const [, setThreadId] = useThread();
  const [accountId] = useLocalStorage('accountId', '');
  const [debouncedSearch] = useDebounceValue(searchValue, 500);

  // ✅ TRPC search mutation
  const search = api.search.search.useMutation({
    onMutate: (vars) => {
      console.log('🔄 [onMutate] Search mutation started with:', vars);
    },
    onSuccess: (data, vars) => {
      console.log('✅ [onSuccess] Search results for:', vars);
      console.log('📦 Full search response:', data);
    },
    onError: (err, vars) => {
      console.error('❌ [onError] Search failed for:', vars);
      console.error('Error details:', err);
      toast.error('Search failed. Please check console logs.');
    },
    onSettled: (data, err, vars) => {
      console.log('🧭 [onSettled] Mutation settled for:', vars);
      if (data) console.log('📊 [Settled Data]:', data);
      if (err) console.error('⚠️ [Settled Error]:', err);
    },
  });

  // 🧠 Debug initial render
  React.useEffect(() => {
    console.log('🔍 [Init] useMutation object:', {
      mutate: typeof search.mutate,
      isPending: search.isPending,
      data: search.data,
      error: search.error,
      status: search.status,
    });
  }, []);

  // 🔁 Run mutation when debouncedSearch or accountId changes
  React.useEffect(() => {
    if (!debouncedSearch || !accountId) return;

    console.log('🚀 [useEffect] Triggering search.mutate()');
    console.log('Payload:', { accountId, query: debouncedSearch });

    search.mutate({ accountId, query: debouncedSearch });
  }, [debouncedSearch, accountId]);

  // 🧾 Debug current mutation state
  React.useEffect(() => {
    console.log('📡 [Mutation State Update]', {
      isPending: search.isPending,
      isError: search.isError,
      isSuccess: search.isSuccess,
      data: search.data,
      error: search.error,
    });
  }, [search.isPending, search.isSuccess, search.isError, search.data, search.error]);

  return (
    <div className="p-4 max-h-[calc(100vh-50px)] overflow-y-scroll">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-gray-600 text-sm dark:text-gray-400">
          Your search for "{searchValue}" came back with...
        </h2>
        {search.isPending && <Loader2 className="size-4 animate-spin text-gray-400" />}
      </div>

      {search.data?.hits?.length === 0 ? (
        <p>No results found.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {search.data?.hits?.map((hit) => (
            <li
              key={hit.id}
              onClick={() => {
                if (!hit.document.threadId) {
                  toast.error('This message is not part of a thread');
                  return;
                }
                setIsSearching(false);
                setThreadId(hit.document.threadId);
              }}
              className="border rounded-md p-4 hover:bg-gray-100 cursor-pointer transition-all dark:hover:bg-gray-900"
            >
              <h3 className="text-base font-medium">{hit.document.title}</h3>
              <p className="text-sm text-gray-500">From: {hit.document.from}</p>
              <p className="text-sm text-gray-500">
                To: {hit.document.to?.join(', ') || 'N/A'}
              </p>
              <p
                className="text-sm mt-2"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(hit.document.rawBody || '', {
                    USE_PROFILES: { html: true },
                  }),
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchDisplay;
