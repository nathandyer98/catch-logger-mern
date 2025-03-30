import { useEffect, useState } from "react";
import { Participant } from "../types/users";
import { useConversationStore } from "../store/useConversationStore";
import { useParticipantStore } from "../store/useParticipantStore";
import { Search, Users, X } from "lucide-react";


interface CreateConversationModalProps {
    handleClose: () => void;
}

const CreateConversationModal = ({ handleClose }: CreateConversationModalProps) => {
    const { searchedUsers, searchUsers, setSearchedUsers, isSearchingUsers, selectedUsers, setSelectedUsers } = useParticipantStore();
    const { createConversation } = useConversationStore();

    const [searchTerm, setSearchTerm] = useState<string>('');
  
    const handleUserSelect = (newUser: Participant) => {
      const isSelected = selectedUsers.some(user => user._id === newUser._id);
      if (isSelected) {
        const updatedSelection = selectedUsers.filter(user => user._id !== newUser._id);
        setSelectedUsers(updatedSelection);
      } else {
        const updatedSelection = [...selectedUsers, newUser];
        setSelectedUsers(updatedSelection);
      }
    };
      
    const handleCreateConversation = () => {
      if (selectedUsers && selectedUsers.length > 0) createConversation(selectedUsers);
      handleClose();
      setSelectedUsers([]);
    }

    useEffect(() => {
      if (searchTerm.trim() === '') {
        setSearchedUsers([]);
        return;
      }
        if (searchTerm) {
            searchUsers(searchTerm);
        } else {
            setSearchTerm('');
        }
    }, [searchTerm, searchUsers, setSearchedUsers]);

    return (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-md">
            <button 
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
              onClick={()=>{
                handleClose();
                setSelectedUsers([]);
              }}
            >
              <X className="h-4 w-4" />
            </button>
            
            <h3 className="font-bold text-lg mb-4">Find Users to Chat With</h3>
            
            {/* Search Bar */}
            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="input input-bordered w-full pl-10"
                placeholder="Search by username or name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Users List */}
            <div className="border rounded-md h-64 overflow-y-auto">
              {isSearchingUsers ? (
                <div className="flex items-center justify-center h-full">
                  <span className="loading loading-spinner loading-md"></span>
                </div>
              ) : searchedUsers.length > 0 ? 
                (searchedUsers?.map(user => (
                    <div 
                      key={user._id} 
                      className="flex items-center p-3 border-b last:border-b-0 hover:bg-base-200"
                    >
                      <label className="cursor-pointer flex items-center w-full">
                        <input 
                          type="checkbox"
                          className="checkbox checkbox-sm mr-3"
                          checked={selectedUsers.some(selectedUser => selectedUser._id === user._id) || false}
                          onChange={() => handleUserSelect(user)}
                        />
                        <div className="avatar mr-3">
                          <div className="w-10 h-10 rounded-full">
                            <img src={user.profilePic || "/avatar.png"} alt={user.username} />
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{user.fullName}</p>
                          <p className="text-sm text-opacity-70">@{user.username}</p>
                        </div>
                      </label>
                    </div>
                  ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-opacity-70">
                  <Users className="h-12 w-12 mb-2 opacity-50" />
                  {searchTerm ? "No users found" : "Search for users to chat with"}
                </div>
              )}
            </div>

            {/* Selected Users */}
            {selectedUsers && (
              <div className="mt-4">
                <p className="font-bold mb-3  ">Selected Users</p>
                <div className="flex flex-wrap gap-4">
                  {selectedUsers?.map(user => (
                    <div key={user._id} className="flex items-center relative">
                      <button 
                        className="btn btn-xs btn-circle btn-ghost  absolute -top-3 -right-3 z-10"
                        onClick={() => handleUserSelect(user)}
                      >
                        <X className="h-4 w-4 font-bold font-white" />
                      </button>
                      <div className="avatar">
                        <div className="avatar w-12 h-12 rounded-full">
                          <img src={user.profilePic || "/avatar.png"} alt={user.username} />
                        </div>
                      </div>
                    </div>
                  ))}  
                </div>
              </div>              
            )}
            
            <div className="modal-action">
              <button 
                className={`btn btn-primary w-full ${selectedUsers.length === 0 ? 'btn-disabled' : ''}`}
                onClick={handleCreateConversation}
                disabled={selectedUsers.length === 0}
              >
                Start Conversation { `(${selectedUsers.length})`}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={handleClose}></div>
        </div>
      );
}

export default CreateConversationModal