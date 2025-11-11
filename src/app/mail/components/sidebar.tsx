'use client'
import React from 'react'
import { Nav } from './nav'

import {
    AlertCircle,
    Archive,
    ArchiveX,
    File,
    Inbox,
    MessagesSquare,
    Send,
    ShoppingCart,
    Trash2,
    Users2,
} from "lucide-react"
import { usePathname } from 'next/navigation'
import { useLocalStorage } from 'usehooks-ts'
import { api } from '@/trpc/react'
type Props = { isCollapsed: boolean }

const SideBar = ({ isCollapsed }: Props) => {

    const [tab] = useLocalStorage("normalhuman-tab", "inbox")
    const [accountId] = useLocalStorage("accountId", "")
    
    // Get accounts first to ensure accountId is set
    const { data: accounts } = api.mail.getAccounts.useQuery()

    const refetchInterval = 5000
    const isReady = !!accountId && accountId.length > 0
    
    const { data: inboxThreads, isLoading: inboxLoading, error: inboxError, isFetching: inboxFetching } = api.mail.getNumThreads.useQuery({
        accountId,
        tab: "inbox"
    }, { 
        enabled: isReady, 
        refetchInterval,
        retry: false
    })

    const { data: draftsThreads, isLoading: draftsLoading, error: draftsError, isFetching: draftsFetching } = api.mail.getNumThreads.useQuery({
        accountId,
        tab: "drafts"
    }, { 
        enabled: isReady, 
        refetchInterval,
        retry: false
    })

    const { data: sentThreads, isLoading: sentLoading, error: sentError, isFetching: sentFetching } = api.mail.getNumThreads.useQuery({
        accountId,
        tab: "sent"
    }, { 
        enabled: isReady, 
        refetchInterval,
        retry: false
    })

    React.useEffect(() => {
        console.log('🔍 Sidebar Debug:', {
            accountId,
            isReady,
            accountsCount: accounts?.length,
            inbox: { data: inboxThreads, loading: inboxLoading, fetching: inboxFetching, error: inboxError },
            drafts: { data: draftsThreads, loading: draftsLoading, fetching: draftsFetching, error: draftsError },
            sent: { data: sentThreads, loading: sentLoading, fetching: sentFetching, error: sentError }
        })
        if (inboxError) console.error('❌ Inbox error:', inboxError)
        if (draftsError) console.error('❌ Drafts error:', draftsError)
        if (sentError) console.error('❌ Sent error:', sentError)
    }, [accountId, isReady, accounts, inboxThreads, draftsThreads, sentThreads, inboxError, draftsError, sentError, inboxLoading, draftsLoading, sentLoading, inboxFetching, draftsFetching, sentFetching])

    // Format counts - always show a number, even if 0
    const getInboxCount = () => {
        if (inboxLoading || inboxFetching) return "..."
        if (inboxError) return "0"
        return inboxThreads != null ? String(inboxThreads) : "0"
    }

    const getDraftsCount = () => {
        if (draftsLoading || draftsFetching) return "..."
        if (draftsError) return "0"
        return draftsThreads != null ? String(draftsThreads) : "0"
    }

    const getSentCount = () => {
        if (sentLoading || sentFetching) return "..."
        if (sentError) return "0"
        return sentThreads != null ? String(sentThreads) : "0"
    }

    return (
        <>
            <Nav
                isCollapsed={isCollapsed}
                links={[
                    {
                        title: "Inbox",
                        label: getInboxCount(),
                        icon: Inbox,
                        variant: tab === "inbox" ? "default" : "ghost",
                    },
                    {
                        title: "Drafts",
                        label: getDraftsCount(),
                        icon: File,
                        variant: tab === "drafts" ? "default" : "ghost",
                    },
                    {
                        title: "Sent",
                        label: getSentCount(),
                        icon: Send,
                        variant: tab === "sent" ? "default" : "ghost",
                    },
                ]}
            />
        </>
    )
}

export default SideBar