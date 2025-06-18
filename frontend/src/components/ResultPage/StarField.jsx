import React from 'react';
import './Starfield.css';

function Starfield() {
  // Generate stars for one SVG
  const generateStars = () => {
    const stars = [];
    for (let i = 0; i < 200; i++) {
      const cx = (Math.round(Math.random() * 10000) / 100) + '%';
      const cy = (Math.round(Math.random() * 10000) / 100) + '%';
      const r = Math.round((Math.random() + 0.5) * 10) / 10;
      stars.push(
        <circle
          key={i}
          className={`star ${i % 3 === 0 ? 'opacity-80' : ''} ${i % 7 === 0 ? 'opacity-60' : ''} ${i % 13 === 0 ? 'opacity-40' : ''} ${i % 19 === 0 ? 'opacity-20' : ''}`}
          cx={cx}
          cy={cy}
          r={r}
        />
      );
    }
    return stars;
  };

  // Generate three star SVGs
  const starLayers = [];
  for (let s = 0; s < 3; s++) {
    starLayers.push(
      <svg
        key={s}
        className={`stars absolute top-0 left-0 w-full h-full ${s === 1 ? 'animate-twinkle-delay-1' : s === 2 ? 'animate-twinkle-delay-2' : 'animate-twinkle'}`}
        width="100%"
        height="100%"
        preserveAspectRatio="none"
      >
        {generateStars()}
      </svg>
    );
  }

  return (
    <div className="stars-wrapper">
      {starLayers}
      <svg className="extras" width="100%" height="100%" preserveAspectRatio="none">
        <defs>
          <radialGradient id="comet-gradient" cx="0" cy=".5" r="0.5">
            <stop offset="0%" stopColor="rgba(255,255,255,.8)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>
        <g transform="rotate(-135)">
          <ellipse
            className="comet comet-a"
            fill="url(#comet-gradient)"
            cx="0"
            cy="0"
            rx="150"
            ry="2"
          />
        </g>
        <g transform="rotate(20)">
          <ellipse
            className="comet comet-b"
            fill="url(#comet-gradient)"
            cx="100%"
            cy="0"
            rx="150"
            ry="2"
          />
        </g>
        <g transform="rotate(300)">
          <ellipse
            className="comet comet-c"
            fill="url(#comet-gradient)"
            cx="40%"
            cy="100%"
            rx="150"
            ry="2"
          />
        </g>
      </svg>
    </div>
  );
}

export default Starfield;