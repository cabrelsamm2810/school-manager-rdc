'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { clsx } from 'clsx';
import { Icon } from '@/components/ui/Icon';
import { ROLE_LABELS } from '@/lib/rbac';
import { CallOverlay } from '@/components/CallOverlay';
import { ChatComposer } from '@/components/chat/ChatComposer';
import { ChatBubble, type ChatMessageData } from '@/components/chat/ChatBubble';
import { TypingIndicator } from '@/components/chat/TypingIndicator';

type ChatUser = {
  id: string;
  displayName: string;
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

function formatListTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const oneDay = 24 * 60 * 60 * 1000;
  if (diff < oneDay && d.getDate() === now.getDate()) {
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
  if (diff < 2 * oneDay) return 'Hier';
  if (diff < 7 * oneDay) {
    return d.toLocaleDateString('fr-FR', { weekday: 'short' });
  }
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

function getInitials(name: string) {
  const parts = name.trim().split(' ');
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
}

function isImageFile(fileType?: string | null, fileUrl?: string | null) {
  if (fileType?.startsWith('image/')) return true;
  if (fileUrl && /\.(jpg|jpeg|png|gif|webp)$/i.test(fileUrl)) return true;
  return false;
}

function isAudioFile(fileType?: string | null, fileUrl?: string | null) {
  if (fileType?.startsWith('audio/')) return true;
  if (fileUrl && /\.(mp3|wav|ogg|webm|m4a|aac|opus)$/i.test(fileUrl)) return true;
  return false;
}

function getMessagePreview(msg: Message): string {
  if (msg.content) return msg.content;
  if (isAudioFile(msg.fileType, msg.fileUrl)) return '🎤 Message vocal';
  if (isImageFile(msg.fileType, msg.fileUrl)) return '📷 Photo';
  if (msg.fileUrl) return `📎 ${msg.fileName || 'Fichier'}`;
  return '';
}

export function SchoolChat() {
  const [currentUser, setCurrentUser] = useState<{ id: string; prenom: string; nom: string } | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
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
  const [activeChatType, setActiveChatType] = useState<'conversation' | 'group'>('conversation');
  const [activeGroup, setActiveGroup] = useState<GroupChat | null>(null);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupClasse, setNewGroupClasse] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);

  // Nouveaux états pour les fonctionnalités premium
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardMessage, setForwardMessage] = useState<Message | null>(null);
  const [showSearchInConv, setShowSearchInConv] = useState(false);
  const [convSearchQuery, setConvSearchQuery] = useState('');
  const [showTyping, setShowTyping] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Charge l'utilisateur courant
  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((data) => {
        if (data?.authenticated) {
          setCurrentUser(data.user);
        }
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
      if (activeConversationId) {
        loadMessages(activeConversationId, activeChatType);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [currentUser, activeConversationId, activeChatType, loadConversations, loadGroups]);

  // Charge les messages d'une conversation
  const loadMessages = useCallback((chatId: string, type?: 'conversation' | 'group') => {
    const chatType = type ?? activeChatType;
    const endpoint = chatType === 'group'
      ? `/api/chat/groups/${chatId}/messages`
      : `/api/chat/conversations/${chatId}/messages`;
    fetch(endpoint)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setMessages(data);
      })
      .catch(() => {});
  }, [activeChatType]);

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

  // Ouvre une conversation
  const openConversation = useCallback(
    (conv: Conversation) => {
      setActiveConversationId(conv.id);
      setActiveChatType('conversation');
      setActiveConversation(conv);
      setActiveGroup(null);
      setMobileShowChat(true);
      setReplyTo(null);
      setShowSearchInConv(false);
      loadMessages(conv.id, 'conversation');
    },
    [loadMessages]
  );

  const openGroup = useCallback(
    (group: GroupChat) => {
      setActiveConversationId(group.id);
      setActiveChatType('group');
      setActiveGroup(group);
      setActiveConversation(null);
      setMobileShowChat(true);
      setReplyTo(null);
      setShowSearchInConv(false);
      loadMessages(group.id, 'group');
    },
    [loadMessages]
  );

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

    const endpoint = activeChatType === 'group'
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
          if (activeChatType === 'group') loadGroups(); else loadConversations();
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

      const endpoint = activeChatType === 'group'
        ? `/api/chat/groups/${activeConversationId}/messages`
        : `/api/chat/conversations/${activeConversationId}/messages`;
      fetch(endpoint, {
        method: 'POST',
        body: formData,
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.id) {
            URL.revokeObjectURL(previewUrl);
            setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...data, status: 'sent' } : m)));
            if (activeChatType === 'group') loadGroups(); else loadConversations();
          } else {
            // Échec
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
  const retrySend = useCallback(
    (msg: Message) => {
      if (!msg.fileUrl || !activeConversationId) return;
      // Pour les fichiers optimistes, on ne peut pas vraiment réessayer sans le blob original.
      // On supprime le message échoué et l'utilisateur devra réattacher le fichier.
      setMessages((prev) => prev.filter((m) => m.id !== msg.id));
    },
    [activeConversationId]
  );

  // ── Suppression de message ──
  const deleteMessage = useCallback(
    (msg: Message) => {
      if (!activeConversationId) return;
      // Suppression optimiste
      setMessages((prev) => prev.filter((m) => m.id !== msg.id));

      const endpoint = activeChatType === 'group'
        ? `/api/chat/groups/${activeConversationId}/messages/${msg.id}`
        : `/api/chat/conversations/${activeConversationId}/messages/${msg.id}`;
      fetch(endpoint, { method: 'DELETE' })
        .then((r) => r.json())
        .then(() => {
          if (activeChatType === 'group') loadGroups(); else loadConversations();
        })
        .catch(() => {
          // Restaurer en cas d'échec
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
  const forwardMsg = useCallback(
    (msg: Message) => {
      setForwardMessage(msg);
      setShowForwardModal(true);
    },
    []
  );

  const doForward = useCallback(
    (targetConvId: string) => {
      if (!forwardMessage) return;
      const content = forwardMessage.content;
      fetch(`/api/chat/conversations/${targetConvId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
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

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
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
      const file = new File([blob], `message-vocal-${Date.now()}.webm`, {
        type: 'audio/webm',
      });
      sendFile(file);
      cleanupRecording();
    };

    mediaRecorder.stop();
  }, [sendFile]);

  const cancelRecording = useCallback(() => {
    const mediaRecorder = mediaRecorderRef.current;
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.onstop = () => {};
      mediaRecorder.stop();
    }
    cleanupRecording();
  }, []);

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

  // Démarre une nouvelle conversation
  const startNewChat = useCallback(
    (userId: string) => {
      fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otherUserId: userId }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.id) {
            setShowNewChat(false);
            loadConversations();
            setTimeout(() => {
              fetch('/api/chat/conversations')
                .then((r) => r.json())
                .then((convs) => {
                  if (Array.isArray(convs)) {
                    const conv = convs.find((c: Conversation) => c.id === data.id);
                    if (conv) openConversation(conv);
                  }
                });
            }, 300);
          }
        })
        .catch(() => {});
    },
    [loadConversations, openConversation]
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
          setTimeout(() => {
            fetch('/api/chat/groups')
              .then((r) => r.json())
              .then((grps) => {
                if (Array.isArray(grps)) {
                  const grp = grps.find((g: GroupChat) => g.id === data.id);
                  if (grp) openGroup(grp);
                }
              });
          }, 300);
        }
      })
      .catch(() => {})
      .finally(() => setCreatingGroup(false));
  }, [newGroupName, newGroupClasse, loadGroups, openGroup]);

  // Charge les classes disponibles pour la création de groupe
  useEffect(() => {
    if (showNewGroup) {
      fetch('/api/eleves?limit=1000')
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            const classes = [...new Set(data.map((e: { classe?: string }) => e.classe).filter(Boolean))].sort() as string[];
            setAvailableClasses(classes);
          }
        })
        .catch(() => {});
    }
  }, [showNewGroup]);

  // Charge tous les utilisateurs pour le nouveau chat
  useEffect(() => {
    if (showNewChat) {
      fetch('/api/chat/users')
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setAllUsers(data);
        })
        .catch(() => {});
    }
  }, [showNewChat]);

  // Filtre les conversations par recherche
  const filteredConversations = conversations.filter((c) =>
    c.otherUser?.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.classe.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const mergedChatList = [
    ...filteredConversations.map((c) => ({ type: 'conversation' as const, item: c })),
    ...filteredGroups.map((g) => ({ type: 'group' as const, item: g })),
  ].sort((a, b) => new Date(b.item.updatedAt).getTime() - new Date(a.item.updatedAt).getTime());

  const filteredUsers = allUsers.filter((u) =>
    u.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Messages filtrés par la recherche dans la conversation
  const filteredMessages = convSearchQuery
    ? messages.filter((m) => m.content?.toLowerCase().includes(convSearchQuery.toLowerCase()))
    : messages;

  // ── Rendu ──
  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-slate-100 dark:bg-slate-950">
      {/* ── Panneau gauche : liste des conversations ── */}
      <div
        className={clsx(
          'flex w-full flex-col bg-white dark:bg-slate-900 md:w-80 md:border-r md:border-slate-200 md:dark:border-slate-700',
          mobileShowChat ? 'hidden md:flex' : 'flex'
        )}
      >
        {/* En-tête */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 bg-[#1e3a8a] px-4 py-3">
          <div className="flex items-center gap-2">
            <Icon name="chat" className="h-5 w-5 text-white" />
            <h2 className="text-base font-semibold text-white">SchoolChat</h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowNewGroup(true)}
              className="rounded-full p-2 text-white transition hover:bg-white/20"
              aria-label="Nouveau groupe"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </button>
            <button
              onClick={() => setShowNewChat(true)}
              className="rounded-full p-2 text-white transition hover:bg-white/20"
              aria-label="Nouvelle conversation"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 py-2">
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
              className="w-full rounded-lg bg-white dark:bg-slate-800 py-2 pl-9 pr-3 text-sm text-slate-700 dark:text-slate-200 outline-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-[#1e3a8a]/30"
            />
          </div>
        </div>

        {/* Liste des conversations */}
        <div className="flex-1 overflow-y-auto">
          {mergedChatList.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <Icon name="chat" className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Aucune conversation</p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                Appuyez sur l&apos;icône crayon pour démarrer une discussion.
              </p>
            </div>
          ) : (
            mergedChatList.map(({ type, item }) => {
              const isActive = item.id === activeConversationId;
              if (type === 'group') {
                const grp = item as GroupChat;
                return (
                  <button
                    key={grp.id}
                    onClick={() => openGroup(grp)}
                    className={clsx(
                      'flex w-full items-center gap-3 border-b border-slate-50 dark:border-slate-800 px-3 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/50',
                      isActive && activeChatType === 'group' && 'bg-[#eff6ff] dark:bg-blue-900/20'
                    )}
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0369a1] text-white">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{grp.name}</span>
                        {grp.lastMessage && (
                          <span className="ml-2 shrink-0 text-xs text-slate-400 dark:text-slate-500">{formatListTime(grp.lastMessage.createdAt)}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {grp.lastMessage
                            ? (grp.lastMessage.senderId === currentUser?.id ? 'Vous: ' : `${grp.lastMessage.senderName}: `) +
                              (grp.lastMessage.content ||
                                (isAudioFile(null, grp.lastMessage.fileUrl) ? '🎤 Message vocal'
                                  : grp.lastMessage.fileUrl && grp.lastMessage.fileName ? `📎 ${grp.lastMessage.fileName}` : '📎 Fichier'))
                            : `Classe ${grp.classe} • ${grp.memberCount} membres`}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              }
              const conv = item as Conversation;
              return (
                <button
                  key={conv.id}
                  onClick={() => openConversation(conv)}
                  className={clsx(
                    'flex w-full items-center gap-3 border-b border-slate-50 dark:border-slate-800 px-3 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/50',
                    isActive && activeChatType === 'conversation' && 'bg-[#eff6ff] dark:bg-blue-900/20'
                  )}
                >
                  {conv.otherUser?.profilePhotoUrl ? (
                    <img src={conv.otherUser.profilePhotoUrl} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#1e3a8a] text-sm font-semibold text-white">
                      {conv.otherUser ? getInitials(conv.otherUser.displayName) : '?'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {conv.otherUser?.displayName ?? 'Utilisateur supprimé'}
                      </span>
                      {conv.lastMessage && (
                        <span className="ml-2 shrink-0 text-xs text-slate-400 dark:text-slate-500">
                          {formatListTime(conv.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      {conv.missedCall ? (
                        <span className="flex items-center gap-1 truncate text-xs font-medium text-red-500">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                            <line x1="2" y1="2" x2="22" y2="22" />
                          </svg>
                          Appel {conv.missedCall.type === 'video' ? 'vidéo' : 'audio'} manqué
                        </span>
                      ) : (
                        <span className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {conv.lastMessage
                            ? (conv.lastMessage.senderId === currentUser?.id ? 'Vous: ' : '') +
                              (conv.lastMessage.content ||
                                (isAudioFile(null, conv.lastMessage.fileUrl)
                                  ? '🎤 Message vocal'
                                  : conv.lastMessage.fileUrl && conv.lastMessage.fileName
                                    ? `📎 ${conv.lastMessage.fileName}`
                                    : '📎 Fichier'))
                            : conv.otherUser?.roleLabel ?? ''}
                        </span>
                      )}
                      {conv.unreadCount > 0 && (
                        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#fbbf24] px-1.5 text-xs font-bold text-[#1e3a8a]">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Panneau droit : zone de chat ── */}
      <div
        className={clsx(
          'flex-1 flex-col',
          mobileShowChat ? 'flex' : 'hidden md:flex'
        )}
      >
        {(activeConversation || activeGroup) ? (
          <>
            {/* En-tête du chat */}
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-700 bg-[#1e3a8a] px-3 py-2.5 md:px-4">
              <button
                onClick={() => setMobileShowChat(false)}
                className="rounded-full p-1.5 text-white transition hover:bg-white/20 md:hidden"
                aria-label="Retour"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
              {activeGroup ? (
                <>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{activeGroup.name}</p>
                    <p className="truncate text-xs text-white/70">Classe {activeGroup.classe} • {activeGroup.memberCount} membres</p>
                  </div>
                </>
              ) : (
                <>
                  {activeConversation?.otherUser?.profilePhotoUrl ? (
                    <img src={activeConversation.otherUser.profilePhotoUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-sm font-semibold text-white">
                      {activeConversation?.otherUser ? getInitials(activeConversation.otherUser.displayName) : '?'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">
                      {activeConversation?.otherUser?.displayName ?? 'Utilisateur supprimé'}
                    </p>
                    <p className="truncate text-xs text-white/70">
                      {activeConversation?.otherUser?.roleLabel ?? ''}
                    </p>
                  </div>
                  {/* Bouton recherche dans la conversation */}
                  <button
                    onClick={() => setShowSearchInConv((s) => !s)}
                    className="rounded-full p-2 text-white transition hover:bg-white/20"
                    aria-label="Rechercher dans la conversation"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                    </svg>
                  </button>
                  <button
                    onClick={() => startCall('audio')}
                    className="rounded-full p-2 text-white transition hover:bg-white/20"
                    aria-label="Appel audio"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => startCall('video')}
                    className="rounded-full p-2 text-white transition hover:bg-white/20"
                    aria-label="Appel vidéo"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                      <polygon points="23 7 16 12 23 17 23 7" />
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </svg>
                  </button>
                </>
              )}
            </div>

            {/* Barre de recherche dans la conversation */}
            {showSearchInConv && (
              <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 py-2" style={{ animation: 'chatSlideIn 0.2s ease-out' }}>
                <div className="relative">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Rechercher dans cette conversation…"
                    value={convSearchQuery}
                    onChange={(e) => setConvSearchQuery(e.target.value)}
                    className="w-full rounded-lg bg-white dark:bg-slate-800 py-2 pl-9 pr-9 text-sm text-slate-700 dark:text-slate-200 outline-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-[#1e3a8a]/30"
                    autoFocus
                  />
                  <button
                    onClick={() => { setShowSearchInConv(false); setConvSearchQuery(''); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-200 dark:hover:bg-slate-700"
                    aria-label="Fermer la recherche"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Zone messages */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto px-3 py-4 md:px-8"
              style={{
                backgroundColor: '#e5ddd5',
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d1c7bd' fill-opacity='0.3'%3E%3Cpath d='M30 30c0-5.523-4.477-10-10-10s-10 4.477-10 10 4.477 10 10 10 10-4.477 10-10zm10 0c0-5.523-4.477-10-10-10s-10 4.477-10 10 4.477 10 10 10 10-4.477 10-10z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
              }}
            >
              {filteredMessages.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <div className="rounded-xl bg-white/90 dark:bg-slate-800/90 px-5 py-3 text-center text-sm text-slate-700 dark:text-slate-300 shadow-md">
                    {convSearchQuery
                      ? 'Aucun message trouvé pour cette recherche.'
                      : activeGroup
                        ? `Démarrez la conversation dans le groupe ${activeGroup.name}`
                        : `Démarrez votre conversation avec ${activeConversation?.otherUser?.displayName ?? 'cet utilisateur'}`}
                  </div>
                </div>
              ) : (
                <div className="mx-auto flex max-w-2xl flex-col">
                  {filteredMessages.map((msg, idx) => {
                    const isMe = msg.senderId === currentUser?.id;
                    const prevMsg = filteredMessages[idx - 1];
                    const nextMsg = filteredMessages[idx + 1];
                    const showDate =
                      !prevMsg ||
                      new Date(prevMsg.createdAt).toDateString() !== new Date(msg.createdAt).toDateString();

                    // Regroupement : même expéditeur + moins de 2 minutes d'écart
                    const isConsecutive =
                      prevMsg &&
                      prevMsg.senderId === msg.senderId &&
                      new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() < 120000 &&
                      !showDate;

                    const showSenderName =
                      activeChatType === 'group' &&
                      !isMe &&
                      (!prevMsg || prevMsg.senderId !== msg.senderId || showDate);

                    // Trouve le message de réponse
                    const replyToMessage = msg.replyToId
                      ? messages.find((m) => m.id === msg.replyToId)
                      : null;

                    return (
                      <div key={msg.id}>
                        {showDate && (
                          <div className="my-3 flex justify-center">
                            <span className="rounded-full bg-white/80 dark:bg-slate-800/80 px-3 py-1 text-xs font-medium text-slate-500 dark:text-slate-400 shadow-sm">
                              {new Date(msg.createdAt).toLocaleDateString('fr-FR', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                              })}
                            </span>
                          </div>
                        )}
                        <ChatBubble
                          msg={msg}
                          isMe={isMe}
                          isGroup={activeChatType === 'group'}
                          showSenderName={showSenderName}
                          isConsecutive={!!isConsecutive}
                          replyToMessage={replyToMessage}
                          onReply={(m) => setReplyTo(m)}
                          onDelete={deleteMessage}
                          onForward={forwardMsg}
                          onRetry={retrySend}
                          canDelete={isMe}
                        />
                      </div>
                    );
                  })}
                  {/* Indicateur de frappe */}
                  {showTyping && (
                    <div className="mt-2 flex justify-start">
                      <TypingIndicator isMe={false} />
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Barre de saisie moderne */}
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
              replyTo={replyTo ? {
                name: replyTo.senderName || (replyTo.senderId === currentUser?.id ? 'Vous' : 'Utilisateur'),
                preview: getMessagePreview(replyTo),
              } : null}
              onCancelReply={() => setReplyTo(null)}
            />
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center bg-slate-100 dark:bg-slate-950 p-8 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#1e3a8a]/10 dark:bg-blue-900/20">
              <Icon name="chat" className="h-10 w-10 text-[#1e3a8a] dark:text-blue-400" />
            </div>
            <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">SchoolChat</p>
            <p className="mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">
              Sélectionnez une conversation ou démarrez-en une nouvelle pour commencer à discuter.
            </p>
          </div>
        )}
      </div>

      {/* ── Overlay d'appel audio/vidéo ── */}
      {activeCall && (
        <CallOverlay
          conversationId={activeCall.conversationId}
          otherUserId={activeCall.otherUserId}
          otherUserName={activeCall.otherUserName}
          otherUserPhoto={activeCall.otherUserPhoto}
          callType={activeCall.callType}
          isCaller={activeCall.isCaller}
          incomingCallId={activeCall.callId}
          incomingOffer={activeCall.offer}
          onEnd={() => setActiveCall(null)}
        />
      )}

      {/* ── Modal : transfert de message ── */}
      {showForwardModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-16 md:pt-24">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white dark:bg-slate-800 shadow-xl" style={{ animation: 'chatSlideIn 0.2s ease-out' }}>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 bg-[#1e3a8a] px-4 py-3">
              <h3 className="text-base font-semibold text-white">Transférer le message</h3>
              <button
                onClick={() => { setShowForwardModal(false); setForwardMessage(null); }}
                className="rounded-full p-1.5 text-white transition hover:bg-white/20"
                aria-label="Fermer"
              >
                <Icon name="close" className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {conversations.length === 0 ? (
                <p className="p-6 text-center text-sm text-slate-400">Aucune conversation disponible.</p>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => doForward(conv.id)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    {conv.otherUser?.profilePhotoUrl ? (
                      <img src={conv.otherUser.profilePhotoUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1e3a8a] text-xs font-semibold text-white">
                        {conv.otherUser ? getInitials(conv.otherUser.displayName) : '?'}
                      </div>
                    )}
                    <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                      {conv.otherUser?.displayName ?? 'Utilisateur supprimé'}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal : nouveau groupe ── */}
      {showNewGroup && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-16 md:pt-24">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white dark:bg-slate-800 shadow-xl" style={{ animation: 'chatSlideIn 0.2s ease-out' }}>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 bg-[#1e3a8a] px-4 py-3">
              <h3 className="text-base font-semibold text-white">Nouveau groupe de classe</h3>
              <button
                onClick={() => { setShowNewGroup(false); setNewGroupName(''); setNewGroupClasse(''); }}
                className="rounded-full p-1.5 text-white transition hover:bg-white/20"
                aria-label="Fermer"
              >
                <Icon name="close" className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 p-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Nom du groupe</label>
                <input
                  type="text"
                  placeholder="Ex: Classe de 6e A"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Classe</label>
                <input
                  type="text"
                  list="available-classes"
                  placeholder="Ex: 6A"
                  value={newGroupClasse}
                  onChange={(e) => setNewGroupClasse(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                />
                <datalist id="available-classes">
                  {availableClasses.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  Tous les élèves inscrits avec cette classe seront automatiquement ajoutés.
                </p>
              </div>
              <button
                onClick={createGroup}
                disabled={!newGroupName.trim() || !newGroupClasse.trim() || creatingGroup}
                className="w-full rounded-full bg-[#1e3a8a] py-2.5 text-sm font-semibold text-white transition hover:bg-[#172554] disabled:opacity-40"
              >
                {creatingGroup ? 'Création…' : 'Créer le groupe'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal : nouvelle conversation ── */}
      {showNewChat && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-16 md:pt-24">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white dark:bg-slate-800 shadow-xl" style={{ animation: 'chatSlideIn 0.2s ease-out' }}>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 bg-[#1e3a8a] px-4 py-3">
              <h3 className="text-base font-semibold text-white">Nouvelle conversation</h3>
              <button
                onClick={() => setShowNewChat(false)}
                className="rounded-full p-1.5 text-white transition hover:bg-white/20"
                aria-label="Fermer"
              >
                <Icon name="close" className="h-5 w-5" />
              </button>
            </div>
            <div className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-4 py-3">
              <div className="relative">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  placeholder="Rechercher un utilisateur…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg bg-white dark:bg-slate-900 py-2 pl-9 pr-3 text-sm text-slate-700 dark:text-slate-200 outline-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-[#1e3a8a]/30"
                />
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-400 dark:text-slate-500">
                  Aucun utilisateur trouvé.
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => startNewChat(user.id)}
                    className="flex w-full items-center gap-3 border-b border-slate-50 dark:border-slate-700/50 px-4 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  >
                    {user.profilePhotoUrl ? (
                      <img src={user.profilePhotoUrl} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1e3a8a] text-sm font-semibold text-white">
                        {getInitials(user.displayName)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{user.displayName}</p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user.roleLabel}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
