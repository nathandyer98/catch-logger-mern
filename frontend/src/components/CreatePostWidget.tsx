import { Camera, ChevronDown, Loader, X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { FishSpecies } from "../enum/FishSpecies";
import { useState } from "react";
import { CatchFormData } from "../types/forms";
import toast from "react-hot-toast";
import { useCatchStore } from "../store/useCatchStore";

const defaultFormData: CatchFormData = {
  species: "" as FishSpecies,
  weight: 0,
  lake: "",
  dateCaught: new Date(),
  photo: "",
  rig: "",
  bait: "",
  distance: 0,
  location: "",
  comments: "",
};

const CreatePostWidget = () => {
  const [formData, setFormData] = useState<CatchFormData>(defaultFormData);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedImg, setSelectedImg] = useState<string | null>(null);

  const { authenticatedUser } = useAuthStore();
  const { addCatch, isAddingCatch } = useCatchStore();

  const validateForm = () => {
    if (!formData.species.trim()) return toast.error("Species is required");
    if (!formData.weight) return toast.error("Weight is required");
    if (!formData.lake.trim()) return toast.error("Lake is required");

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
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const success = validateForm();

    if (success === true) {
      console.log("form data", formData);
      await addCatch(formData);
      setFormData(defaultFormData);
      setSelectedImg(null);
    }
  };

  return (
    <div className="relative max-w-full mx-auto bg-primary/5 rounded-2xl shadow-sm mb-6">
      {isAddingCatch && (
        <div className="absolute rounded-2xl top-0 left-0 w-full h-full bg-black/60 flex items-center justify-center z-10">
          <Loader className="animate-spin text-primary" />
        </div>
      )}
      <form className="flex-1" onSubmit={handleSubmit}>
        <div className="p-4">
          <div className="flex gap-5 align-middle">
            <img
              className="w-14 h-14 rounded-full object-cover"
              src={authenticatedUser?.profilePic || "/avatar.png"}
              alt="Profile Picture"
            />
            <div className="flex-1 min-h-[20px] p-2">
              <textarea
                placeholder="Share your latest catch..."
                className="textarea textarea-bordered w-full resize-none bg-transparent border-0"
              />
            </div>
          </div>

          <div className="flex-1 space-y-3">
            {/* Image Preview Here */}
            {selectedImg && (
              <div className="relative rounded-lg overflow-hidden">
                <img
                  src={selectedImg}
                  alt="Catch preview"
                  className="w-full h-auto max-h-[300px] object-cover"
                />
                <button
                  className="flex items-center justify-center absolute top-2 right-2 h-8 w-8 bg-base-200 rounded-full hover:bg-base-200/90 hover:scale-105"
                  onClick={() => setSelectedImg(null)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 ">
              <select
                className=" select select-sm border-0 bg-transparent w-full text-center"
                value={formData.species}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    species: e.target.value as FishSpecies,
                  })
                }
              >
                {!formData.species && (
                  <option selected>Select species...</option>
                )}
                {Object.values(FishSpecies).map((key, index) => (
                  <option value={key} key={`${key}-${index}`}>
                    {key}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-2">
                <input
                  placeholder="Weight (lbs)"
                  type="number"
                  step="0.1"
                  className="input bg-transparent border-0 h-8 w-full max-w-xs text-center"
                  value={formData.weight}
                  onChange={(e) =>
                    setFormData({ ...formData, weight: Number(e.target.value) })
                  }
                />
                <span>lbs</span>
              </div>
              <input
                placeholder="Lake name"
                className="input bg-transparent border-0 h-8 w-full max-w-xs text-center"
                value={formData.lake}
                onChange={(e) =>
                  setFormData({ ...formData, lake: e.target.value })
                }
              />
              <input
                type="datetime-local"
                className="input bg-transparent border-0 h-8 w-full max-w-xs text-center"
                value={formData.dateCaught.toISOString().slice(0, 16)}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    dateCaught: new Date(e.target.value),
                  });
                }}
              />
            </div>
            {isExpanded && (
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 py-4 ">
                <input
                  placeholder="Rig"
                  className="input bg-transparent border-0 h-8 w-full max-w-xs text-center"
                  value={formData.rig}
                  onChange={(e) =>
                    setFormData({ ...formData, rig: e.target.value })
                  }
                />
                <input
                  placeholder="Bait"
                  className="input bg-transparent border-0 h-8 w-full max-w-xs text-center"
                  value={formData.bait}
                  onChange={(e) =>
                    setFormData({ ...formData, bait: e.target.value })
                  }
                />
                <input
                  placeholder="Distance (ft)"
                  className="input bg-transparent border-0 h-8 w-full max-w-xs text-center"
                  value={formData.distance}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      distance: Number(e.target.value),
                    })
                  }
                />
                <input
                  placeholder="Location"
                  className="input bg-transparent border-0 h-8 w-full max-w-xs text-center"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                />
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-3 border-t">
          <div className="flex-1 flex items-center gap-5">
            <label
              htmlFor="avatar-upload"
              className="flex justify-start items-center ml-4 h-9 w-9 cursor-pointer"
            >
              <Camera className="w-5 h-5" />
              <input
                type="file"
                id="avatar-upload"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </label>
            <label
              htmlFor="expand"
              className="flex justify-start items-center cursor-pointer"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <ChevronDown
                className={`h-5 w-5 transition-transform duration-600" ${
                  isExpanded && " -rotate-180"
                }`}
              />
            </label>
          </div>
          <button className="btn btn-sm rounded-md btn-outline">Post</button>
        </div>
      </form>
    </div>
  );
};

export default CreatePostWidget;
