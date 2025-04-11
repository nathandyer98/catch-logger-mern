import { useRef, useState } from "react";
import ReactCrop, { centerCrop, convertToPixelCrop, makeAspectCrop, type Crop } from 'react-image-crop'
import setCanvasPreview from "../utils/setCanvasPreview.ts";
import { X } from "lucide-react";


const ASPECT_RATIO = 4 / 3;
const MIN_WIDTH = 400;
const MIN_HEIGHT = 300;


const defaultCrop: Crop = {
    unit: 'px',
    x: 0,   
    y: 0, 
    width: MIN_WIDTH, 
    height: MIN_HEIGHT, 
};

interface UploadImageModalProps {
    closeModal: () => void; 
    onCropComplete: (croppedImageUrl: string)=> void; 
}

const UploadImageModal = ({ closeModal, onCropComplete }: UploadImageModalProps) => {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState<Crop>(defaultCrop);
    const [error, setError] = useState<string | null>(null);

    const imageRef = useRef<HTMLImageElement | null>(null);
    const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageSrc(null); // Reset image source before loading new image
        setError(null); // Reset error message
        const imageDataUrl = await readFile(file);
        setImageSrc(imageDataUrl);
    };

    const readFile = (file: File): Promise<string> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                const imageELement = new Image();
                imageELement.src = reader.result as string;
                imageELement.addEventListener('load', () => {
                    if (imageELement.naturalWidth < MIN_WIDTH || imageELement.naturalHeight < MIN_HEIGHT) {
                        setError("Image is too small. Minimum size is 400x300 pixels.");
                        setImageSrc(null);
                        return;
                    }
                    setError(null); 
                });
                 resolve(reader.result as string); 
                }, false);
            reader.readAsDataURL(file);
        })
    }

    const triggerFileInput = () => {
        document.getElementById('fileInput')?.click();
      };

    const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = e.currentTarget;
        const cropWidthPercent = (MIN_WIDTH / width) * 100;
        const cropHeightPercent = (MIN_HEIGHT / height) * 100;
        const crop = makeAspectCrop({ unit: '%', width: cropWidthPercent, height: cropHeightPercent }, ASPECT_RATIO, width, height );
        const centeredCrop = centerCrop(crop, width, height);
        setCrop(centeredCrop);
    }

    const setCanvas = () => {
        setCanvasPreview(
            imageRef.current as HTMLImageElement, // Cast to HTMLImageElement
            previewCanvasRef.current as HTMLCanvasElement, // Cast to HTMLCanvasElement
            convertToPixelCrop(crop, imageRef.current!.width, imageRef.current!.height) // Use non-null assertion operator
        );
        const croppedImageUrl = previewCanvasRef.current?.toDataURL('image/jpeg', 1); // Get the cropped image URL
        if (croppedImageUrl) {
            onCropComplete(croppedImageUrl);
        }
    }
    
    return (
        <div className="relative z-10 ">
          <div className="fixed inset-0 z-10 w-screen overflow-y-auto bg-gray-900 bg-opacity-75 transition-all backdrop-blur-sm">
            <div className="flex min-h-full justify-center px-2 py-12 text-center items-center"> {/* Added min-h-full and items-center */}
              <div className="relative w-[90%] sm:w-[60%] md:w-[50%] lg:w-[40%] min-h-[60vh] max-h-[90vh] flex flex-col rounded-2xl bg-gray-800 text-slate-100 text-left shadow-xl transition-all"> {/* Added flex, flex-col, max-h */}
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-medium leading-6 text-white">Crop Image</h3>
                    <button
                        type="button"
                        className="rounded-md p-1 inline-flex items-center justify-center text-gray-400 hover:bg-gray-700 focus:outline-none"
                        onClick={closeModal}
                    >
                        <span className="sr-only">Close menu</span>
                        <X size={20} />
                    </button>
                </div>
                
                
                {/* Body - Cropper or Upload Prompt */}
                <div className="flex-grow p-5 overflow-y-scroll relative">
                  {imageSrc ? (
                    <div className="inset-0 w-full h-full"> {/* Container for Cropper */}
                    <ReactCrop 
                    crop={crop}
                    onChange={(percentCrop) => setCrop(percentCrop)}
                    keepSelection={true}
                    aspect={ASPECT_RATIO}
                    minWidth={MIN_WIDTH}
                    minHeight={MIN_HEIGHT}>
                        <img src={imageSrc} ref={imageRef} onLoad={onImageLoad} />
                    </ReactCrop>
                    </div>
                  ) : (
                     <div className="flex flex-col items-center justify-center h-full">
                        <p className="mb-4 text-gray-400">Select an image to crop.</p>
                         <button
                            onClick={triggerFileInput}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition duration-150 ease-in-out"
                            >
                            Choose Image
                        </button>
                     </div>
                  )}
                  {/* Hidden File Input */}
                  <input
                    type="file"
                    id="fileInput"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
                {/* Error Message */}
                {error && (<div className="w-full flex justify-center px-5 py-2 text-red-500 pb-10 text-lg font-medium">{error}</div>)}
    
    
                 {/* Footer - Controls & Preview */}
                {imageSrc && (
                    <div className="px-5 py-4 border-t border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4">
                         {/* Action Buttons */}
                        <div className="flex gap-3 w-full sm:w-auto justify-end">
                            <button
                                onClick={triggerFileInput} // Allow changing image
                                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md text-sm transition duration-150 ease-in-out"
                                >
                                Change Image
                            </button>
                            <button
                                onClick={() => setCanvas()} // Set canvas preview}
                                disabled={!crop} // Disable if cropping not done
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
                                >
                                Confirm Crop
                            </button>
                        </div>
                    {/* Preview Canvas */}
                    {crop && ( <canvas ref={previewCanvasRef} className="absolute z-[-10] mt-4 display-none" />)}    
                    </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
}

export default UploadImageModal