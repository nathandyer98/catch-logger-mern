const OceanBackground = () => {
  return (
    <div className="fixed inset-0 z-[-1] bg-[#0A2342] overflow-hidden">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100% 100%"
        className="absolute inset-0 w-full h-full"
      >
        <defs>
          <linearGradient
            id="oceanDepthGradient"
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="25%" stopColor="#0A2342" />
            <stop offset="80%" stopColor="#125D98" />
            <stop offset="100%" stopColor="#1E4A7B" />
          </linearGradient>
        </defs>
      </svg>

      {[...Array(100)].map((_, index) => {
        //Amount of bubbles
        const size = Math.random() * 10 + 5;
        return (
          <div
            key={index}
            className="absolute bg-white/10 rounded-full animate-bubble"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100 + 40}%`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        );
      })}
    </div>
  );
};

export default OceanBackground;
