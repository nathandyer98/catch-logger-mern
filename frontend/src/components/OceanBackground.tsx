const OceanBackground = () => {
  return (
    
    <div className="fixed inset-0 z-[-1] bg-[#0A2342] max-h-screen overflow-x-hidden overflow-y-hidden">
    <div className="w-full h-full absolute top-0 left-0 bg-gradient-to-b from-black/70 to-transparent"></div>

      {[...Array(100)].map((_, index) => {
        //Amount of bubbles
        const size = Math.random() * 10 + 3;
        return (
          <div
            key={index}
            className="absolute bg-white/10 rounded-full animate-bubble"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 60 + 40}%`,
              animationDelay: `${Math.random() * 7}s`,
            }}
          />
        );
      })}
    </div>
  );
};

export default OceanBackground;
