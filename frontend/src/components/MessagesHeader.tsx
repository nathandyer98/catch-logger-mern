import { X } from "lucide-react";
import { useConversationStore } from "../store/useConversationStore";
import { Participant } from "../types/users";
import { useAuthStore } from "../store/useAuthStore";

const MessagesHeader = () => {
  const { selectedConversation, setSelectedConversation } =
    useConversationStore();

  const { authenticatedUser } = useAuthStore();

  const findOtherParticipants = (participants: Participant[]) => {
      return participants.filter((participant) => participant._id !== authenticatedUser?._id.toString());
  }

  return (
    <div className="p-2.5 border-b border-transparent/95">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="avatar">
            <div className="size-10 rounded-full relative">
              <img
                src={
                  selectedConversation?.type === "Direct"
                    ? findOtherParticipants(selectedConversation.participants)[0]?.profilePic || "/avatar.png"
                    : "/group-avatar.png"
                }
                alt={`${selectedConversation?._id}'s avatar`}
              />
            </div>
          </div>

          {/* User info */}
          <div>
            <h3 className="font-medium">
              {selectedConversation?.type === "Direct"
                ? findOtherParticipants(selectedConversation.participants)[0]?.username
                : selectedConversation?.participants
                    .map((p) => p.username)
                    .join(", ")}
            </h3>
            <p className="text-sm text-base-content/70"></p>
          </div>
        </div>

        {/* Close button */}
        <button onClick={() => setSelectedConversation("")}>
          <X />
        </button>
      </div>
    </div>
  );
};
export default MessagesHeader;
