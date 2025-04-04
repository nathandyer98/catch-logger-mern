import { useEffect } from 'react'
import { useMessageStore } from '../store/useMessageStore';
import { useConversationStore } from '../store/useConversationStore';
import { useAuthStore } from '../store/useAuthStore';
import MessagesHeader from './MessagesHeader';
import MessageInput from './MessageInput';
import { formatMessageTime } from '../services/utils';
import MessagesSkeleton from './skeleton/MessagesSkeleton';
import { Message } from '../types/conversations';
import { Participant } from '../types/users';

const MessagesContainer = () => {
    const { messages, getMessages, isMessagesLoading } = useMessageStore();
    const { selectedConversation } = useConversationStore();
    const { authenticatedUser } = useAuthStore();
    // const messageEndRef = useRef(null);

    const isMessageFromAuthenticatedUser = (message: Message) => {
        return message.from === authenticatedUser?._id;
    };

    const getUserData = (userId: string) => {
      if( userId === authenticatedUser?._id) return authenticatedUser
      return selectedConversation?.participants.find((p) => p._id === userId) ;
    }

    useEffect(() => {
        if (selectedConversation?._id) {
            getMessages(selectedConversation._id);
        }
    }, [selectedConversation?._id,getMessages,]);

    return (
      <div className="flex flex-col h-full">
        <MessagesHeader />

        <div className="flex-1 p-4 space-y-2 overflow-y-auto " style={{ scrollbarWidth: 'thin' }}>
          {isMessagesLoading ? (
              <MessagesSkeleton />
            ) : (
              messages.map((message) => (
                <MessageBubble
                  fromAuthenticatedUser={isMessageFromAuthenticatedUser(message)}
                  key={message._id}
                  id={message._id}
                  messageText={message.text}
                  messageimage={message.image}
                  createdAt={message.createdAt}
                  from={getUserData(message.from) || null}/>)))}
        </div>
        <MessageInput />
      </div>
    );
}

// make messages editable
// allow users to click profilePicture to navigate to profile

interface MessageBubble {
  id: string;
  fromAuthenticatedUser: boolean;
  messageText: string;
  messageimage: string;
  createdAt: Date;
  from: Participant | null;
}

const MessageBubble: React.FC<MessageBubble> = ({ id, fromAuthenticatedUser, messageText, messageimage, createdAt, from }: MessageBubble) => {
  return (
    <div className={`chat  ${fromAuthenticatedUser? "chat-end" : "chat-start"} `} key={id}>
      <div className="chat-image avatar">
        <div className="size-10 rounded-full border">
          <img src={from?.profilePic || "/avatar.png"} alt="profile pic" />
        </div>
      </div>
      <div className="chat-bubble flex flex-col">
        {messageimage && (
          <img
            src={messageimage}
            alt="Attachment"
            className="sm:max-w-[200px] rounded-md mb-2"
          />
        )}
        {messageText && <p>{messageText}</p>}
      </div>
      <div className="chat-footer chat-end mb-1">
        <time className="text-xs opacity-50 ml-1">
          {formatMessageTime(createdAt)}
        </time> 
      </div>
    </div>
  );
};

export default MessagesContainer