// src/components/common/AdComponent.jsx
import { useEffect, useRef } from "react";

const AdComponent = () => {
  const adRef = useRef(null); // Ref to track the ad element

  useEffect(() => {
    if (adRef.current) {
      // Check if the ad is already populated
      if (!adRef.current.querySelector('.adsbygoogle')) {
        window.adsbygoogle.push({});
      }
    }
  }, []);

  return (
    <div className="my-4" ref={adRef}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-6561467807135376"
        data-ad-slot="4124298712"
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
};

export default AdComponent;
