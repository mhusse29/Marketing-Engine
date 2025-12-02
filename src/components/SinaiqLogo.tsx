import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/format';

type Props = {
  size?: number;
  compact?: boolean;
  className?: string;
  linkToLanding?: boolean;
};

export default function SinaiqLogo({ size = 18, compact = false, className = '', linkToLanding = false }: Props) {
  const navigate = useNavigate();
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(linkToLanding ? '/landing' : '/');
  };
  
  if (compact) {
    return (
      <a 
        href={linkToLanding ? '/landing' : '/'} 
        onClick={handleClick}
        aria-label="SINA IQ" 
        className={cn('inline-flex items-center cursor-pointer', className)}
      >
        <span
          aria-hidden
          className="grid place-items-center rounded-full"
          style={{
            width: size + 6,
            height: size + 6,
            background:
              'radial-gradient(120% 120% at 20% 20%, var(--brand-accent) 0%, rgba(255,255,255,.08) 40%, rgba(255,255,255,.02) 100%)',
            border: '1px solid rgba(255,255,255,.10)',
            boxShadow: '0 6px 18px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.10)',
          }}
        >
          <span
            className="font-extrabold leading-none"
            style={{
              fontSize: size - 2,
              letterSpacing: '0.02em',
              color: 'white',
              textShadow: '0 1px 0 rgba(0,0,0,.35)',
            }}
          >
            S
          </span>
        </span>
      </a>
    );
  }

  return (
    <a 
      href={linkToLanding ? '/landing' : '/'} 
      onClick={handleClick}
      aria-label="SINA IQ" 
      className={cn('select-none cursor-pointer', className)}
    >
      <span
        aria-hidden
        className="font-extrabold tracking-[0.14em] leading-none align-middle"
        style={{
          fontSize: size,
          color: '#fff',
          WebkitFontSmoothing: 'antialiased',
          textRendering: 'geometricPrecision',
        }}
      >
        SINAIQ
      </span>
    </a>
  );
}
