import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import "./CSAnim.css";
import TextPressure from "./TextPressure";
import GlitchText from "./GlitchText";

function CSAnim() {
  const navigate = useNavigate();
  const containerRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      gsap.to(containerRef.current, {
        opacity: 0,
        duration: 1,
        ease: "power2.out",
        onComplete: () => {
          navigate("/input-form");
        },
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div id="text-pres" ref={containerRef}>
      <GlitchText
        speed={1}
        enableShadows={true}
        enableOnHover={false}
        className="custom-class"
      >
        Originality matters
      </GlitchText>
      <TextPressure
        from={0}
        to={100}
        separator=","
        direction="up"
        duration={1}
        className="count-up-text"
      />
    </div>
  );
}

export default CSAnim;
