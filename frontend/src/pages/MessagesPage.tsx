import { useEffect } from "react";
import MessagesContainer from "../components/MessagesContainer";
import MessagesSideBar from "../components/MessagesSideBar";
import NoMessageContainer from "../components/NoMessageContainer";
import { useConversationStore } from "../store/useConversationStore";
import { useSocketStore } from "../store/useSocketStore";

const MessagesPage = () => {
  const { selectedConversation } = useConversationStore();
  const { joinConversation, leaveConversation } = useSocketStore()

  useEffect(() => {
    let didConnect = false; 
    if (selectedConversation) {
      joinConversation(selectedConversation._id);
      didConnect = true;
    }

    return () => {
      if (selectedConversation && didConnect) {
        console.log('Cleanup: Calling leaveConversation...');
        leaveConversation(selectedConversation._id);
      }
    };
  }, [joinConversation, leaveConversation, selectedConversation]);

  return (
    <div className="h-full w-full flex flex-col">

      {/* Messages Layout */}
      <div className="flex-1 flex overflow-hidden">

        {/* Sidebar - Fixed width */}
        <div className="w-[250px]">
          <MessagesSideBar />
        </div>
  
        {/* Chat Window  */}
        <div className="flex-1 flex flex-col">
          {/* Content area - Scrollable */}
          <div className="flex-1 overflow-y-auto border-l border-transparent/20">
            {!selectedConversation ? (
              <NoMessageContainer />
            ) : (
              <MessagesContainer />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
