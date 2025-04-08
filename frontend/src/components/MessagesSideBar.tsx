import { useEffect, useState } from "react";

import { useConversationStore } from "../store/useConversationStore";

import { Conversation, LastMessage } from "../types/conversations";
import { SquarePen, X } from "lucide-react";
import CreateConversationModal from "./CreateConversationModal";
import { Participant } from "../types/users";
import { useAuthStore } from "../store/useAuthStore";

const MessagesSideBar = () => {
  const {
    conversations,
    isFetchingConversations,
    fetchConversations,
    selectedConversation,
    setSelectedConversation,
    deleteConversation,
  } = useConversationStore();

  const { authenticatedUser } = useAuthStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
    
  const handleSelectConversation = ( selectedConversationId: string) => {
    setSelectedConversation(selectedConversationId);
  };

  const handleDeleteConversation = (conversationId: string) => {
    deleteConversation(conversationId);
    setSelectedConversation("");
  }

  const findOtherParticipants = (participants: Participant[]) => {
    return participants.filter((participant) => participant._id !== authenticatedUser?._id.toString());
  }

  const getDisplayName = (conversation: Conversation) => {
    if (conversation.type === "Direct") {
      return findOtherParticipants(conversation.participants)[0]?.username;
    } else {
      return conversation.participants.map((p) => p.username).join(", ");
    }
  };

  const getDisplayImage = (conversation: Conversation) => {
    if (conversation.type === "Direct") {
      return findOtherParticipants(conversation.participants)[0]?.profilePic;
    } else {
      return "/group-avatar.png";
    }
  };


  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return (
    <>
      <div className="flex flex-col gap-5 w-full pb-2 pr-2 h-full">
        {/* Modal */}
        {isModalOpen && (
            <CreateConversationModal handleClose={() => { setIsModalOpen(false)} } />
        )}

        {/* Header */}
        <div className="flex items-center justify-between w-full flex-shrink-0">
          <p className="font-bold">Messages</p>
          <button className="hover:opacity-80 transition-all" onClick={() => setIsModalOpen(true)}>
            <SquarePen className="w-6 h-6" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex flex-col flex-grow gap-2 overflow-y-auto min-h-auto">
          {isFetchingConversations ? (
            <div className="text-center p-4">Loading...</div> //LOADING SKELETON
          ) : (
            conversations?.map((conversation) => (
              <ConversationItems
                key={conversation._id}
                id={conversation._id}
                name={getDisplayName(conversation)}
                conversationImage={getDisplayImage(conversation)}
                lastMessage={conversation.lastMessage ?? null}
                unreadCount={conversation.unreadMessagesCount}
                isSelected={selectedConversation?._id === conversation._id}
                handleSelect={handleSelectConversation}
                handleDelete={handleDeleteConversation}/>)))}
        </div>
      </div>
    </>
  );
};

interface ConversationItemsProps {
  id: string;
  name: string;
  conversationImage: string;
  lastMessage: LastMessage | null;
  unreadCount: number;
  isSelected: boolean;
  handleSelect: (conversationId: string) => void;
  handleDelete: (id: string) => void;
}

const ConversationItems: React.FC<ConversationItemsProps> = ({ id, name, conversationImage, lastMessage, unreadCount, isSelected, handleSelect, handleDelete }) => {

  const onDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleDelete(id);
  }

  return (
    <div className={`flex items-center justify-between w-full p-2 rounded-xl transition-colors duration-200 cursor-pointer ${isSelected ? 'bg-transparent/35' : 'bg-transparent/15 hover:bg-transparent/25'}`} onClick={() => handleSelect(id)}>
      <div className="flex items-center min-w-0 flex-grow mr-2 relative">
      <div className="absolute -top-[10px] -left-[6px] z-10">
            {unreadCount > 0 && <span className="bg-gray-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] inline-block text-center">
              {unreadCount}
            </span>}
          </div>
        <div className="relative mr-3 flex-shrink-0">
          <img
            className="w-10 h-10 rounded-full object-cover"
            src={conversationImage || "/avatar.png"}
            alt={`${name}'s avatar`}
          />
          {/* TODO: Future: Add online status indicator here */}
        </div>
        <div className="flex flex-col gap-1">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-primary-900 truncate">{name}</h3>
        </div>
        {lastMessage && (<span className="text-sm text-gray-600 truncate">{`${lastMessage.from.username}: ${lastMessage.text}`}</span>)}
        </div>
        </div>
          {/* TODO: Future: Popup to confirm delete */}
        <button className="p-1 hover:opacity-80 rounded-full flex-shrink-0transition-all" onClick={onDeleteClick}><X className="w-6 h-6 z-20" /></button>
      </div>
  );
};

export default MessagesSideBar;
