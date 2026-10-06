'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { clsx } from 'clsx';
import { Icon } from '@/components/ui/Icon';
import { Avatar } from '@/components/ui/Avatar';
import { CallOverlay } from '@/components/CallOverlay';
import { ChatComposer } from '@/components/chat/ChatComposer';
import { ChatBubble, type ChatMessageData } from '@/components/chat/ChatBubble';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ConversationListItem, type ChatPreviewKind } from '@/components/chat/ConversationListItem';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { formatListTime, getMessageKind, getMessagePreview } from '@/lib/chat-format';

type ChatUser = {
  id: string;
  displayName: string;
  prenom?: string;
  nom?: string;
  role: string;
  roleLabel: string;
  profilePhotoUrl?: string | null;
  isActive?: boolean;
};

type Conversation = {
  id: string;
  otherUser: ChatUser | null;
  lastMessage: {
    content: string;
    createdAt: string;
    senderId: string;
    fileUrl?: string | null;
    fileName?: string | null;
    fileType?: string | null;
    read?: boolean;
  } | null;
  unreadCount: number;
  missedCall: { type: string; createdAt: string } | null;
  updatedAt: string;
};

type GroupChat = {
  id: string;
  name: string;
  classe: string;
  memberCount: number;
  isAdmin: boolean;
  lastMessage: {
    content: string;
    createdAt: string;
    senderId: string;
    senderName: string;
    fileUrl?: string | null;
    fileName?: string | null;
  } | null;
  updatedAt: string;
};

type Message = ChatMessageData;
type ChatKind = 'conversation' | 'group';

/** Élément de la liste unifiée : conversation privée ou groupe de classe. */
type ChatListItem =
  | { id: string; kind: 'conversation'; updatedAt: string; conversation: Conversation }
  | { id: string; kind: 'group'; updatedAt: string; group: GroupChat };

/** Regroupe les messages consécutifs (même expéditeur, moins de 2 minutes, même jour). */
function isSameRun(a: Message, b?: Message) {
  if (!b || b.senderId !== a.senderId) return false;
  if (new Date(b.createdAt).toDateString() !== new Date(a.createdAt).toDateString()) return false;
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() < 120000;
}

export function SchoolChat() {
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    prenom: string;
    nom: string;
    profilePhotoUrl?: string | null;
  } | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [allUsers, setAllUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeCall, setActiveCall] = useState<{
    callId?: string;
    offer?: string;
    isCaller: boolean;
    callType: 'audio' | 'video';
    otherUserName: string;
    otherUserPhoto?: string | null;
    otherUserId: string;
    conversationId: string;
  } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingError, setRecordingError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [groups, setGroups] = useState<GroupChat[]>([]);
  const [activeChatType, setActiveChatType] = useState<ChatKind>('conversation');
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupClasse, setNewGroupClasse] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);

  // Fonctionnalités premium existantes
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardMessage, setForwardMessage] = useState<Message | null>(null);
  const [showSearchInConv, setShowSearchInConv] = useState(false);
  const [convSearchQuery, setConvSearchQuery] = useState('');
  const [showTyping, setShowTyping] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesKeyRef = useRef('');

  // Charge l'utilisateur courant
  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((data) => {
        if (data?.authenticated) setCurrentUser(data.user);
      })
      .catch(() => {});
  }, []);

  // Charge les conversations
  const loadConversations = useCallback(() => {
    fetch('/api/chat/conversations')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setConversations(data);
      })
      .catch(() => {});
  }, []);

  const loadGroups = useCallback(() => {
    fetch('/api/chat/groups')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setGroups(data);
      })
      .catch(() => {});
  }, []);

  // Charge les messages d'une conversation ou d'un groupe
  const loadMessages = useCallback((chatId: string, type: ChatKind) => {
    const endpoint =
      type === 'group' ? `/api/chat/groups/${chatId}/messages` : `/api/chat/conversations/${chatId}/messages`;
    fetch(endpoint)
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) return;
        // Rien de nouveau depuis le dernier chargement : on évite de tout re-rendre.
        const key = data.map((m: Message) => `${m.id}${m.read ? '1' : '0'}`).join('|');
        if (key === messagesKeyRef.current) return;
        messagesKeyRef.current = key;
        setMessages((prev) => {
          const serverIds = new Set(data.map((m: Message) => m.id));
          const pending = prev.filter((m) => m.id.startsWith('temp-') && !serverIds.has(m.id));
          return pending.length ? [...data, ...pending] : data;
        });
      })
      .catch(() => {});
  }, []);

  /** Ouvre un fil (conversation ou groupe) : le seul point d'entrée utilisé par la liste. */
  const openChat = useCallback(
    (id: string, kind: ChatKind) => {
      setActiveConversationId(id);
      setActiveChatType(kind);
      setMobileShowChat(true);
      setReplyTo(null);
      setShowSearchInConv(false);
      setConvSearchQuery('');
      messagesKeyRef.current = '';
      setMessages([]);
      loadMessages(id, kind);
    },
    [loadMessages]
  );

  /** Stable : permet aux lignes de la liste (mémoïsées) de ne pas se re-rendre inutilement. */
  const handleSelectChat = useCallback((id: string, kind: ChatKind) => openChat(id, kind), [openChat]);

  // Conversation et groupe actifs, dérivés de la liste (toujours à jour après le polling)
  const activeConversation = useMemo(
    () => (activeChatType === 'conversation' ? conversations.find((c) => c.id === activeConversationId) ?? null : null),
    [conversations, activeChatType, activeConversationId]
  );
  const activeGroup = useMemo(
    () => (activeChatType === 'group' ? groups.find((g) => g.id === activeConversationId) ?? null : null),
    [groups, activeChatType, activeConversationId]
  );

  useEffect(() => {
    if (currentUser) {
      loadConversations();
      loadGroups();
    }
  }, [currentUser, loadConversations, loadGroups]);

  // Polling léger pour les nouvelles conversations/messages
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(() => {
      loadConversations();
      loadGroups();
      if (activeConversationId) loadMessages(activeConversationId, activeChatType);
    }, 5000);
    return () => clearInterval(interval);
  }, [currentUser, activeConversationId, activeChatType, loadConversations, loadGroups, loadMessages]);

  // ── Appels audio/vidéo ──
  const startCall = useCallback(
    (type: 'audio' | 'video') => {
      if (!activeConversation) return;
      setActiveCall({
        isCaller: true,
        callType: type,
        otherUserName: activeConversation.otherUser?.displayName ?? 'Utilisateur',
        otherUserPhoto: activeConversation.otherUser?.profilePhotoUrl,
        otherUserId: activeConversation.otherUser?.id ?? '',
        conversationId: activeConversation.id,
      });
    },
    [activeConversation]
  );

  // Polling des appels entrants
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(async () => {
      if (activeCall) return;
      try {
        const res = await fetch('/api/chat/calls');
        const calls = await res.json();
        if (Array.isArray(calls) && calls.length > 0) {
          const call = calls[0];
          const conv = conversations.find((c) => c.id === call.conversationId);
          if (conv?.otherUser) {
            const callRes = await fetch(`/api/chat/calls/${call.id}`);
            const callData = await callRes.json();
            setActiveCall({
              callId: call.id,
              offer: callData.offer,
              isCaller: false,
              callType: call.type === 'video' ? 'video' : 'audio',
              otherUserName: conv.otherUser.displayName,
              otherUserPhoto: conv.otherUser.profilePhotoUrl,
              otherUserId: conv.otherUser.id,
              conversationId: call.conversationId,
            });
          }
        }
      } catch {
        // ignore
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [currentUser, activeCall, conversations]);

  // Scroll en bas quand de nouveaux messages arrivent
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Envoie un message
  const sendMessage = useCallback(() => {
    if (!inputText.trim() || !activeConversationId) return;
    const content = inputText.trim();
    setInputText('');
    setLoading(true);

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      content,
      senderId: currentUser?.id ?? '',
      senderName: `${currentUser?.prenom} ${currentUser?.nom}`.trim(),
      createdAt: new Date().toISOString(),
      read: false,
      replyToId: replyTo?.id ?? null,
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    const currentReplyTo = replyTo;
    setReplyTo(null);

    const endpoint =
      activeChatType === 'group'
        ? `/api/chat/groups/${activeConversationId}/messages`
        : `/api/chat/conversations/${activeConversationId}/messages`;
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, replyToId: currentReplyTo?.id ?? null }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.id) {
          setMessages((prev) => prev.map((m) => (m.id === tempId ? data : m)));
          if (activeChatType === 'group') loadGroups();
          else loadConversations();
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [inputText, activeConversationId, activeChatType, currentUser, loadConversations, loadGroups, replyTo]);

  // Envoie un fichier
  const sendFile = useCallback(
    (file: File) => {
      if (!activeConversationId) return;
      setUploading(true);

      const formData = new FormData();
      formData.append('file', file);
      if (inputText.trim()) formData.append('content', inputText.trim());

      const tempId = `temp-${Date.now()}`;
      const previewUrl = URL.createObjectURL(file);
      const optimisticMsg: Message = {
        id: tempId,
        content: inputText.trim(),
        senderId: currentUser?.id ?? '',
        senderName: `${currentUser?.prenom} ${currentUser?.nom}`.trim(),
        createdAt: new Date().toISOString(),
        read: false,
        fileUrl: previewUrl,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        status: 'sending',
      };
      setMessages((prev) => [...prev, optimisticMsg]);
      setInputText('');

      const endpoint =
        activeChatType === 'group'
          ? `/api/chat/groups/${activeConversationId}/messages`
          : `/api/chat/conversations/${activeConversationId}/messages`;
      fetch(endpoint, { method: 'POST', body: formData })
        .then((r) => r.json())
        .then((data) => {
          if (data.id) {
            URL.revokeObjectURL(previewUrl);
            setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...data, status: 'sent' } : m)));
            if (activeChatType === 'group') loadGroups();
            else loadConversations();
          } else {
            setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, status: 'failed' } : m)));
          }
        })
        .catch(() => {
          URL.revokeObjectURL(previewUrl);
          setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, status: 'failed' } : m)));
        })
        .finally(() => setUploading(false));
    },
    [activeConversationId, activeChatType, currentUser, inputText, loadConversations, loadGroups]
  );

  // Réessayer l'envoi d'un fichier échoué
  const retrySend = useCallback((msg: Message) => {
    setMessages((prev) => prev.filter((m) => m.id !== msg.id));
  }, []);

  // ── Suppression de message ──
  const deleteMessage = useCallback(
    (msg: Message) => {
      if (!activeConversationId) return;
      setMessages((prev) => prev.filter((m) => m.id !== msg.id));

      const endpoint =
        activeChatType === 'group'
          ? `/api/chat/groups/${activeConversationId}/messages/${msg.id}`
          : `/api/chat/conversations/${activeConversationId}/messages/${msg.id}`;
      fetch(endpoint, { method: 'DELETE' })
        .then((r) => r.json())
        .then(() => {
          if (activeChatType === 'group') loadGroups();
          else loadConversations();
        })
        .catch(() => {
          setMessages((prev) => {
            const idx = prev.findIndex((m) => m.createdAt > msg.createdAt);
            if (idx === -1) return [...prev, msg];
            const copy = [...prev];
            copy.splice(idx, 0, msg);
            return copy;
          });
        });
    },
    [activeConversationId, activeChatType, loadConversations, loadGroups]
  );

  // ── Transfert de message ──
  const forwardMsg = useCallback((msg: Message) => {
    setForwardMessage(msg);
    setShowForwardModal(true);
  }, []);

  const doForward = useCallback(
    (targetConvId: string) => {
      if (!forwardMessage) return;
      fetch(`/api/chat/conversations/${targetConvId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: forwardMessage.content }),
      })
        .then((r) => r.json())
        .then(() => {
          setShowForwardModal(false);
          setForwardMessage(null);
          loadConversations();
        })
        .catch(() => {});
    },
    [forwardMessage, loadConversations]
  );

  // ── Enregistrement vocal ──
  const cleanupRecording = useCallback(() => {
    recordingStreamRef.current?.getTracks().forEach((t) => t.stop());
    recordingStreamRef.current = null;
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordingTime(0);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }, []);

  const cancelRecording = useCallback(() => {
    const mediaRecorder = mediaRecorderRef.current;
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.onstop = () => {};
      mediaRecorder.stop();
    }
    cleanupRecording();
  }, [cleanupRecording]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStreamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setRecordingError('');

      recordingTimerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    } catch {
      setRecordingError('Micro inaccessible. Vérifiez les permissions.');
    }
  }, []);

  const stopAndSendRecording = useCallback(() => {
    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
      cancelRecording();
      return;
    }

    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const file = new File([blob], `message-vocal-${Date.now()}.webm`, { type: 'audio/webm' });
      sendFile(file);
      cleanupRecording();
    };

    mediaRecorder.stop();
  }, [sendFile, cancelRecording, cleanupRecording]);

  // Démarre une nouvelle conversation
  const startNewChat = useCallback(
    (user: ChatUser) => {
      fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otherUserId: user.id }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (!data.id) return;
          setShowNewChat(false);
          loadConversations();
          openChat(data.id, 'conversation');
        })
        .catch(() => {});
    },
    [loadConversations, openChat]
  );

  const createGroup = useCallback(() => {
    if (!newGroupName.trim() || !newGroupClasse.trim()) return;
    setCreatingGroup(true);
    fetch('/api/chat/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newGroupName.trim(), classe: newGroupClasse.trim() }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.id) {
          setShowNewGroup(false);
          setNewGroupName('');
          setNewGroupClasse('');
          loadGroups();
          openChat(data.id, 'group');
        }
      })
      .catch(() => {})
      .finally(() => setCreatingGroup(false));
  }, [newGroupName, newGroupClasse, loadGroups, openChat]);

  // Charge les classes disponibles pour la création de groupe
  useEffect(() => {
    if (!showNewGroup) return;
    fetch('/api/eleves?limit=1000')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const classes = [...new Set(data.map((e: { classe?: string }) => e.classe).filter(Boolean))].sort() as string[];
          setAvailableClasses(classes);
        }
      })
      .catch(() => {});
  }, [showNewGroup]);

  // Charge tous les utilisateurs pour le nouveau chat
  useEffect(() => {
    if (!showNewChat) return;
    fetch('/api/chat/users')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setAllUsers(data);
      })
      .catch(() => {});
  }, [showNewChat]);

  const normalizedSearch = searchQuery.trim().toLowerCase();

  // Liste unifiée : conversations et groupes, triés par activité
  const chatList = useMemo<ChatListItem[]>(() => {
    const convItems: ChatListItem[] = conversations
      .filter((c) => !normalizedSearch || c.otherUser?.displayName.toLowerCase().includes(normalizedSearch))
      .map((c) => ({ id: c.id, kind: 'conversation', updatedAt: c.updatedAt, conversation: c }));
    const groupItems: ChatListItem[] = groups
      .filter(
        (g) =>
          !normalizedSearch ||
          g.name.toLowerCase().includes(normalizedSearch) ||
          g.classe.toLowerCase().includes(normalizedSearch)
      )
      .map((g) => ({ id: g.id, kind: 'group', updatedAt: g.updatedAt, group: g }));
    return [...convItems, ...groupItems].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [conversations, groups, normalizedSearch]);

  const filteredUsers = useMemo(
    () => allUsers.filter((u) => !normalizedSearch || u.displayName.toLowerCase().includes(normalizedSearch)),
    [allUsers, normalizedSearch]
  );

  // Messages filtrés par la recherche dans la conversation
  const filteredMessages = convSearchQuery
    ? messages.filter((m) => m.content?.toLowerCase().includes(convSearchQuery.toLowerCase()))
    : messages;

  const activeOther = activeConversation?.otherUser ?? null;
  const chatOpen = Boolean(activeConversation || activeGroup);

  // ── Rendu ──
  return (
    <div className="flex h-[calc(100dvh-3.5rem-68px)] overflow-hidden bg-slate-100 lg:h-[calc(100vh-3.5rem)]">
      {/* ── Panneau gauche : liste des conversations ── */}
      <aside
        className={clsx(
          'min-w-0 flex-col overflow-hidden bg-white md:flex md:w-[336px] md:shrink-0 md:border-r md:border-slate-200',
          mobileShowChat ? 'hidden md:flex' : 'flex w-full'
        )}
      >
        <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-slate-100 bg-white px-3">
          <Icon name="chat" className="h-[21px] w-[21px] shrink-0 text-slate-900" />
          <h2 className="min-w-0 flex-1 truncate text-[19px] font-bold tracking-tight text-slate-900">SchoolChat</h2>

          {currentUser && (
            <Avatar
              photoUrl={currentUser.profilePhotoUrl}
              prenom={currentUser.prenom}
              nom={currentUser.nom}
              size="sm"
            />
          )}

          <button
            onClick={() => setShowNewChat(true)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200 active:scale-90"
            aria-label="Nouvelle conversation"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>

          <button
            onClick={() => setShowNewGroup(true)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 active:scale-90"
            aria-label="Nouveau groupe"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </button>
        </div>

        <div className="shrink-0 border-b border-slate-100 px-3 py-2">
          <div className="relative">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Rechercher une conversation…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Rechercher une conversation"
              className="w-full rounded-full bg-slate-100 py-2 pl-9 pr-3 text-[13px] text-slate-700 outline-none transition focus:bg-white focus:ring-2 focus:ring-[#2563eb]/25"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {chatList.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-8 text-center">
              <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 ring-1 ring-slate-100">
                <Icon name="chat" className="h-7 w-7 text-slate-300" />
              </span>
              <p className="text-[13px] font-semibold text-slate-600">Aucune conversation</p>
              <p className="mt-1 text-xs text-slate-400">Démarrez une discussion avec l&apos;icône crayon.</p>
            </div>
          ) : (
            chatList.map((item) => {
              if (item.kind === 'group') {
                const group = item.group!;
                return (
                  <ConversationListItem
                    key={group.id}
                    id={group.id}
                    kind="group"
                    name={group.name}
                    preview={
                      group.lastMessage
                        ? `${group.lastMessage.senderId === currentUser?.id ? 'Vous' : group.lastMessage.senderName} : ${
                            getMessagePreview(group.lastMessage) || 'Fichier'
                          }`
                        : `Classe ${group.classe} • ${group.memberCount} membres`
                    }
                    previewKind={group.lastMessage ? getMessageKind(group.lastMessage) : 'text'}
                    lastMessageMine={group.lastMessage ? group.lastMessage.senderId === currentUser?.id : false}
                    timeLabel={group.lastMessage ? formatListTime(group.lastMessage.createdAt) : null}
                    isActive={item.id === activeConversationId && activeChatType === 'group'}
                    onSelect={handleSelectChat}
                  />
                );
              }

              const conv = item.conversation!;
              const other = conv.otherUser;
              const last = conv.lastMessage;
              const missed = Boolean(conv.missedCall);

              return (
                <ConversationListItem
                  key={conv.id}
                  id={conv.id}
                  kind="conversation"
                  name={other?.displayName ?? 'Utilisateur supprimé'}
                  prenom={other?.prenom}
                  nom={other?.nom}
                  photoUrl={other?.profilePhotoUrl}
                  preview={
                    missed
                      ? `Appel ${conv.missedCall?.type === 'video' ? 'vidéo' : 'audio'} manqué`
                      : last
                        ? `${last.senderId === currentUser?.id ? 'Vous : ' : ''}${getMessagePreview(last) || 'Fichier'}`
                        : other?.roleLabel ?? ''
                  }
                  previewKind={missed ? 'missed' : last ? getMessageKind(last) : 'text'}
                  lastMessageMine={last ? last.senderId === currentUser?.id : false}
                  lastMessageRead={Boolean(last?.read)}
                  timeLabel={last ? formatListTime(last.createdAt) : null}
                  unreadCount={conv.unreadCount}
                  isActive={item.id === activeConversationId && activeChatType === 'conversation'}
                  onSelect={handleSelectChat}
                />
              );
            })
          )}
        </div>
      </aside>

      {/* ── Panneau droit : fil de discussion ── */}
      <section className={clsx('min-w-0 flex-1 flex-col', mobileShowChat ? 'flex' : 'hidden md:flex')}>
        {chatOpen ? (
          <>
            <ChatHeader
              name={activeGroup ? activeGroup.name : activeOther?.displayName ?? 'Utilisateur supprimé'}
              prenom={activeOther?.prenom}
              nom={activeOther?.nom}
              photoUrl={activeOther?.profilePhotoUrl}
              subtitle={
                activeGroup
                  ? `Classe ${activeGroup.classe} • ${activeGroup.memberCount} membres`
                  : activeOther?.roleLabel ?? ''
              }
              isGroup={Boolean(activeGroup)}
              canCall={Boolean(activeConversation && activeOther)}
              searchOpen={showSearchInConv}
              onBack={() => setMobileShowChat(false)}
              onToggleSearch={() => setShowSearchInConv((s) => !s)}
              onCall={startCall}
            />

            {showSearchInConv && (
              <div className="shrink-0 border-b border-slate-200 bg-white px-3 py-2" style={{ animation: 'chatSlideIn 0.2s ease-out' }}>
                <div className="relative">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Rechercher dans cette conversation…"
                    value={convSearchQuery}
                    onChange={(e) => setConvSearchQuery(e.target.value)}
                    autoFocus
                    aria-label="Rechercher dans la conversation"
                    className="w-full rounded-full bg-slate-100 py-2 pl-9 pr-9 text-[13px] text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-[#2563eb]/25"
                  />
                  <button
                    onClick={() => {
                      setShowSearchInConv(false);
                      setConvSearchQuery('');
                    }}
                    className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-200"
                    aria-label="Fermer la recherche"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-4 w-4">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            <div
              ref={messagesContainerRef}
              className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 md:px-6"
              style={{
                backgroundColor: '#f3f5fb',
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1' fill='%23c7d2fe' fill-opacity='0.35'/%3E%3C/svg%3E\")"
              }}
            >
              {filteredMessages.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <div className="max-w-xs rounded-2xl bg-white/95 px-5 py-4 text-center shadow-sm ring-1 ring-slate-200/70">
                    <p className="text-[13px] font-medium text-slate-600">
                      {convSearchQuery
                        ? 'Aucun message trouvé pour cette recherche.'
                        : activeGroup
                          ? `Démarrez la conversation dans le groupe ${activeGroup.name}`
                          : `Démarrez votre conversation avec ${activeOther?.displayName ?? 'cet utilisateur'}`}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mx-auto flex max-w-3xl flex-col">
                  {filteredMessages.map((msg, idx) => {
                    const isMe = msg.senderId === currentUser?.id;
                    const prevMsg = filteredMessages[idx - 1];
                    const nextMsg = filteredMessages[idx + 1];
                    const showDate =
                      !prevMsg ||
                      new Date(prevMsg.createdAt).toDateString() !== new Date(msg.createdAt).toDateString();

                    const isConsecutive = prevMsg ? isSameRun(prevMsg, msg) : false;

                    const showSenderName =
                      activeChatType === 'group' && !isMe && (!prevMsg || prevMsg.senderId !== msg.senderId || showDate);

                    const replyToMessage = msg.replyToId ? messages.find((m) => m.id === msg.replyToId) : null;

                    return (
                      <div key={msg.id}>
                        {showDate && (
                          <div className="my-3 flex justify-center">
                            <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-slate-500 shadow-sm ring-1 ring-slate-200/60">
                              {new Date(msg.createdAt).toLocaleDateString('fr-FR', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long'
                              })}
                            </span>
                          </div>
                        )}
                        <ChatBubble
                          msg={msg}
                          isMe={isMe}
                          isGroup={activeChatType === 'group'}
                          showSenderName={showSenderName}
                          isConsecutive={isConsecutive}
                          isLastInGroup={!isSameRun(msg, nextMsg)}
                          replyToMessage={replyToMessage}
                          senderPhotoUrl={isMe ? null : activeChatType === 'group' ? msg.senderPhotoUrl : activeOther?.profilePhotoUrl}
                          senderPrenom={isMe ? null : activeChatType === 'group' ? msg.senderPrenom : activeOther?.prenom}
                          senderNom={isMe ? null : activeChatType === 'group' ? msg.senderNom : activeOther?.nom}
                          onReply={(m) => setReplyTo(m)}
                          onDelete={deleteMessage}
                          onForward={forwardMsg}
                          onRetry={retrySend}
                          canDelete={isMe}
                        />
                      </div>
                    );
                  })}
                  {showTyping && (
                    <div className="mt-2 flex justify-start">
                      <TypingIndicator isMe={false} />
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <ChatComposer
              value={inputText}
              onChange={setInputText}
              onSend={sendMessage}
              onSendFile={sendFile}
              onStartRecording={startRecording}
              onStopRecording={stopAndSendRecording}
              onCancelRecording={cancelRecording}
              isRecording={isRecording}
              recordingTime={recordingTime}
              recordingError={recordingError}
              uploading={uploading}
              sending={loading}
              replyTo={
                replyTo
                  ? {
                      name: replyTo.senderName || (replyTo.senderId === currentUser?.id ? 'Vous' : 'Utilisateur'),
                      preview: getMessagePreview(replyTo)
                    }
                  : null
              }
              onCancelReply={() => setReplyTo(null)}
            />
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center bg-white px-8 text-center">
            <span className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#1e3a8a]/10 to-[#2563eb]/10 ring-1 ring-[#1e3a8a]/10">
              <Icon name="chat" className="h-10 w-10 text-[#1e3a8a]" />
            </span>
            <p className="text-lg font-bold tracking-tight text-slate-800">SchoolChat</p>
            <p className="mt-1.5 max-w-xs text-[13px] text-slate-500">
              Sélectionnez une conversation ou démarrez-en une nouvelle pour commencer à discuter.
            </p>
          </div>
        )}
      </section>

      {/* ── Overlay d'appel audio/vidéo ── */}
      {activeCall && (
        <CallOverlay
          conversationId={activeCall.conversationId}
          otherUserId={activeCall.otherUserId}
          otherUserName={activeCall.otherUserName}
          otherUserPhoto={activeCall.otherUserPhoto}
          localUserPhoto={currentUser?.profilePhotoUrl ?? null}
          localUserName={`${currentUser?.prenom ?? ''} ${currentUser?.nom ?? ''}`.trim()}
          callType={activeCall.callType}
          isCaller={activeCall.isCaller}
          incomingCallId={activeCall.callId}
          incomingOffer={activeCall.offer}
          onEnd={() => setActiveCall(null)}
        />
      )}

      {/* ── Modal : transfert de message ── */}
      {showForwardModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 p-4 pt-16 backdrop-blur-sm md:pt-24">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl" style={{ animation: 'chatSlideIn 0.2s ease-out' }}>
            <div className="flex items-center justify-between bg-gradient-to-r from-[#1e3a8a] to-[#2563eb] px-4 py-3">
              <h3 className="text-[15px] font-semibold text-white">Transférer le message</h3>
              <button
                onClick={() => {
                  setShowForwardModal(false);
                  setForwardMessage(null);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full text-white transition hover:bg-white/20"
                aria-label="Fermer"
              >
                <Icon name="close" className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto p-1.5">
              {conversations.length === 0 ? (
                <p className="p-6 text-center text-[13px] text-slate-400">Aucune conversation disponible.</p>
              ) : (
                conversations.map((conv) => (
                  <ConversationListItem
                    key={conv.id}
                    id={conv.id}
                    kind="conversation"
                    name={conv.otherUser?.displayName ?? 'Utilisateur supprimé'}
                    prenom={conv.otherUser?.prenom}
                    nom={conv.otherUser?.nom}
                    photoUrl={conv.otherUser?.profilePhotoUrl}
                    preview={conv.otherUser?.roleLabel ?? ''}
                    previewKind="text"
                    isActive={false}
                    onSelect={(id) => doForward(id)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal : nouveau groupe ── */}
      {showNewGroup && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 p-4 pt-16 backdrop-blur-sm md:pt-24">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl" style={{ animation: 'chatSlideIn 0.2s ease-out' }}>
            <div className="flex items-center justify-between bg-gradient-to-r from-[#1e3a8a] to-[#2563eb] px-4 py-3">
              <h3 className="text-[15px] font-semibold text-white">Nouveau groupe de classe</h3>
              <button
                onClick={() => {
                  setShowNewGroup(false);
                  setNewGroupName('');
                  setNewGroupClasse('');
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full text-white transition hover:bg-white/20"
                aria-label="Fermer"
              >
                <Icon name="close" className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 p-4">
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-slate-700">Nom du groupe</label>
                <input
                  type="text"
                  placeholder="Ex : Classe de 6e A"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 px-3.5 py-2.5 text-[13.5px] text-slate-700 outline-none ring-1 ring-slate-200 transition focus:bg-white focus:ring-2 focus:ring-[#2563eb]/25"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-slate-700">Classe</label>
                <input
                  type="text"
                  list="available-classes"
                  placeholder="Ex : 6A"
                  value={newGroupClasse}
                  onChange={(e) => setNewGroupClasse(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 px-3.5 py-2.5 text-[13.5px] text-slate-700 outline-none ring-1 ring-slate-200 transition focus:bg-white focus:ring-2 focus:ring-[#2563eb]/25"
                />
                <datalist id="available-classes">
                  {availableClasses.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
                <p className="mt-1.5 text-xs text-slate-400">
                  Tous les élèves inscrits avec cette classe seront automatiquement ajoutés.
                </p>
              </div>
              <button
                onClick={createGroup}
                disabled={!newGroupName.trim() || !newGroupClasse.trim() || creatingGroup}
                className="w-full rounded-full bg-[#2563eb] py-2.5 text-[13.5px] font-semibold text-white transition hover:bg-[#1d4ed8] disabled:opacity-40"
              >
                {creatingGroup ? 'Création…' : 'Créer le groupe'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal : nouvelle conversation ── */}
      {showNewChat && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 p-4 pt-16 backdrop-blur-sm md:pt-24">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl" style={{ animation: 'chatSlideIn 0.2s ease-out' }}>
            <div className="flex items-center justify-between bg-gradient-to-r from-[#1e3a8a] to-[#2563eb] px-4 py-3">
              <h3 className="text-[15px] font-semibold text-white">Nouvelle conversation</h3>
              <button
                onClick={() => setShowNewChat(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-white transition hover:bg-white/20"
                aria-label="Fermer"
              >
                <Icon name="close" className="h-5 w-5" />
              </button>
            </div>
            <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
              <div className="relative">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  placeholder="Rechercher un utilisateur…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Rechercher un utilisateur"
                  className="w-full rounded-full bg-white py-2 pl-9 pr-3 text-[13px] text-slate-700 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-[#2563eb]/25"
                />
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto p-1.5">
              {filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-[13px] text-slate-400">Aucun utilisateur trouvé.</div>
              ) : (
                filteredUsers.map((user) => (
                  <ConversationListItem
                    key={user.id}
                    id={user.id}
                    kind="conversation"
                    name={user.displayName}
                    prenom={user.prenom}
                    nom={user.nom}
                    photoUrl={user.profilePhotoUrl}
                    preview={user.roleLabel}
                    previewKind="text"
                    isActive={false}
                    onSelect={() => startNewChat(user)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
