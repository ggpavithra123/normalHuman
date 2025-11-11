import { api } from '@/trpc/react'
import { getQueryKey } from '@trpc/react-query'
import React, { useEffect } from 'react'
import { useLocalStorage } from 'usehooks-ts'

const useThreads = () => {
  const { data: accounts, isLoading: accountsLoading } = api.mail.getAccounts.useQuery()
  const [accountId, setAccountId] = useLocalStorage('accountId', '')
  const [tab] = useLocalStorage('normalhuman-tab', 'inbox')
  const [done] = useLocalStorage('normalhuman-done', false)

  // ✅ Step 1: Automatically set latest account if accountId is empty or outdated
  useEffect(() => {
    if (!accounts || accounts.length === 0) return

    // Sort by createdAt (if your API returns that)
    const sorted = [...accounts].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    const latestAccount = sorted[0]

    if (!accountId || !accounts.find(acc => acc.id === accountId)) {
      console.log('⚡ Updating localStorage with latest account:', latestAccount.id)
      setAccountId(latestAccount.id)
    }
  }, [accounts, accountId, setAccountId])

  // ✅ Step 2: Fetch threads using the latest accountId
  const queryKey = getQueryKey(api.mail.getThreads, { accountId, tab, done }, 'query')

  const { data: threads, isFetching, refetch } = api.mail.getThreads.useQuery(
    { accountId, done, tab },
    {
      enabled: !!accountId && !!tab && !accountsLoading,
      placeholderData: (e) => e,
      refetchInterval: 5000, // every 5 sec
    }
  )

  return {
    threads,
    isFetching,
    account: accounts?.find((a) => a.id === accountId),
    refetch,
    accounts,
    queryKey,
    accountId,
    setAccountId, // expose setter too
  }
}

export default useThreads
