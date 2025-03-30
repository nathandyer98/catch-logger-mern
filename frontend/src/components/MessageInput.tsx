import { useRef, useState } from "react";

import { useMessageStore } from "../store/useMessageStore";
import { MessageData } from "../types/conversations";
import toast from "react-hot-toast";
import { Send, X, Image } from "lucide-react";
import { useConversationStore } from "../store/useConversationStore";

const defaultMessageData = {
    text: "",
    image: "",
};

const MessageInput = () => {
    const [messageData, setMessageData] = useState<MessageData>(defaultMessageData);
    const [selectedImg, setSelectedImg] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { sendMessage } = useMessageStore();
    const { selectedConversation } = useConversationStore();

    const validateMessage = () => {
      if (!messageData.text.trim() && !selectedImg) return toast.error("Message is required");
      return true;
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const base64Image = reader.result as string;
            setSelectedImg(base64Image);
            setMessageData({ ...messageData, image: base64Image });
        };
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        const success = validateMessage();

        if (success === true) {
            if (selectedConversation) {
                await sendMessage(selectedConversation._id, messageData);
            } else {
                toast.error("No conversation selected");
            }
            setMessageData(defaultMessageData);
            setSelectedImg(null);
        }
    };

    return (
        <div className="p-4 w-full">
            {selectedImg && (
                <div className="mb-3 flex items-center gap-2">
                    <div className="relative">
                        <img
                          src={selectedImg}
                          alt="Preview"
                          className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
                        />
                        <button
                          onClick={() => setSelectedImg(null)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300
                          flex items-center justify-center"
                          type="button"
                        >
                          <X className="size-3" />
                        </button>
                    </div>
                </div>
            )}
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <div className="flex-1 flex gap-2">
                    <input
                        type="text"
                        className="w-full input input-bordered rounded-lg input-sm sm:input-md"
                        placeholder="Type a message..."
                        value={messageData.text}
                        onChange={(e) => setMessageData({ ...messageData, text: e.target.value })}
                        />
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        />
                    <button
                        type="button"
                        className={`sm:flex btn btn-circle ${selectedImg ? "text-emerald-500" : "text-zinc-400"}`}
                        onClick={() => fileInputRef.current?.click()}
                        >
                        <Image size={20} />
                    </button>
                </div>
                    <button
                        type="submit"
                        className="btn btn-circle"
                        disabled={!messageData.text.trim() && !selectedImg}
                        >
                        <Send size={20} />
                    </button>
            </form> 
        </div>
    );
};
export default MessageInput;


