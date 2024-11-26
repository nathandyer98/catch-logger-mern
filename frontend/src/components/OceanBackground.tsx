const OceanBackground = () => {
  return (
    <div className="fixed inset-0 z-[-1] bg-[#0A2342] max-h-screen overflow-x-hidden overflow-y-hidden">
      <linearGradient id="oceanDepthGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="25%" stopColor="#0A2342" />
        <stop offset="80%" stopColor="#125D98" />
        <stop offset="100%" stopColor="#1E4A7B" />
      </linearGradient>

      {[...Array(80)].map((_, index) => {
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
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        );
      })}
    </div>
  );
};

export default OceanBackground;
