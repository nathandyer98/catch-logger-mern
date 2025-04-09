import { useState } from 'react';
import { Catch } from '../types/catches';

interface Props {
  catchData: Catch;
}

const ProfilePostWidget = ({ catchData }: Props) => {
    const image = catchData.photo;
    const [isHovered, setIsHovered] = useState(false);

    
    return (
        <div className="relative rounded-lg shadow-md overflow-hidden" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
            <img src={image} alt="Catch" className="w-full h-72 object-cover"/>
            {isHovered && (
                <div className="absolute flex flex-col inset-0 bg-black bg-opacity-50 transition-all duration-300 items-center justify-center">
                    <p className="text-white text-lg font-semibold">{catchData.text}</p>
                    <p className="text-white text-sm font-semibold">{`${catchData.weight}lb`}</p> 
                    <div className="flex gap-5 items-center">
                    <p className="text-white text-sm font-semibold">📍 {catchData.lake}</p>
                    <p className="text-white text-sm font-semibold">{new Date(catchData.createdAt).toLocaleDateString()}</p>    
                    </div>
                </div>
            )}
        </div>
    )
}

export default ProfilePostWidget