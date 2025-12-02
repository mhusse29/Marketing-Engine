import { useEffect, useState } from 'react';

export const ScrollDebug = () => {
  const [scrollY, setScrollY] = useState(0);
  const [windowHeight, setWindowHeight] = useState(0);
  const [docHeight, setDocHeight] = useState(0);

  useEffect(() => {
    const updateScroll = () => {
      setScrollY(window.scrollY);
      setWindowHeight(window.innerHeight);
      setDocHeight(document.documentElement.scrollHeight);
    };

    updateScroll();
    window.addEventListener('scroll', updateScroll);
    window.addEventListener('resize', updateScroll);

    return () => {
      window.removeEventListener('scroll', updateScroll);
      window.removeEventListener('resize', updateScroll);
    };
  }, []);

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      left: 20,
      background: 'rgba(0, 230, 118, 0.9)',
      color: '#000',
      padding: '12px 16px',
      borderRadius: '8px',
      fontFamily: 'monospace',
      fontSize: '12px',
      zIndex: 9999,
      pointerEvents: 'none'
    }}>
      <div>Scroll Y: {Math.round(scrollY)}px</div>
      <div>Window H: {windowHeight}px</div>
      <div>Doc H: {docHeight}px</div>
      <div>Progress: {Math.round((scrollY / (docHeight - windowHeight)) * 100)}%</div>
    </div>
  );
};
