import { Code2, Database, Terminal, Cpu, Binary, GitBranch } from 'lucide-react';

const GithubIcon = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export default function FloatingTechBackground() {
  const items = [
    // 5 Mobile visible (will also be visible on Tablet and Desktop)
    { type: 'icon', element: Code2, size: 24, top: '15%', left: '10%', color: '#60a5fa', delay: '0s', duration: '14s', anim: 'float-pattern-1', visibility: 'mobile' },
    { type: 'icon', element: Database, size: 22, top: '25%', left: '80%', color: '#34d399', delay: '-3s', duration: '16s', anim: 'float-pattern-2', visibility: 'mobile' },
    { type: 'icon', element: GithubIcon, size: 22, top: '55%', left: '85%', color: '#9ca3af', delay: '-5s', duration: '18s', anim: 'float-pattern-4', visibility: 'mobile' },
    { type: 'icon', element: Terminal, size: 20, top: '80%', left: '70%', color: '#3b82f6', delay: '-7s', duration: '20s', anim: 'float-pattern-2', visibility: 'mobile' },
    { type: 'text', element: '</>', size: 22, top: '85%', left: '40%', color: '#10b981', delay: '-1.5s', duration: '14s', anim: 'float-pattern-1', visibility: 'mobile' },

    // 4 Tablet visible (visible on Tablet and Desktop, hidden on Mobile)
    { type: 'text', element: '{}', size: 20, top: '40%', left: '20%', color: '#a855f7', delay: '-1s', duration: '12s', anim: 'float-pattern-3', visibility: 'tablet' },
    { type: 'text', element: '>_', size: 18, top: '70%', left: '15%', color: '#eab308', delay: '-2s', duration: '15s', anim: 'float-pattern-1', visibility: 'tablet' },
    { type: 'text', element: '[]', size: 18, top: '10%', left: '75%', color: '#60a5fa', delay: '-4s', duration: '13s', anim: 'float-pattern-3', visibility: 'tablet' },
    { type: 'text', element: 'python', size: 16, top: '50%', left: '60%', color: '#60a5fa', delay: '-2.5s', duration: '15s', anim: 'float-pattern-4', visibility: 'tablet' },

    // 4 Desktop visible (visible on Desktop only, hidden on Mobile and Tablet)
    { type: 'icon', element: Cpu, size: 24, top: '45%', left: '90%', color: '#f43f5e', delay: '-6s', duration: '17s', anim: 'float-pattern-4', visibility: 'desktop' },
    { type: 'icon', element: GitBranch, size: 20, top: '30%', left: '5%', color: '#fb923c', delay: '-8s', duration: '19s', anim: 'float-pattern-2', visibility: 'desktop' },
    { type: 'icon', element: Binary, size: 20, top: '65%', left: '30%', color: '#a855f7', delay: '-3.5s', duration: '16s', anim: 'float-pattern-3', visibility: 'desktop' },
    { type: 'text', element: 'java', size: 16, top: '20%', left: '45%', color: '#fb923c', delay: '-4.5s', duration: '18s', anim: 'float-pattern-1', visibility: 'desktop' }
  ];

  return (
    <>
      <style>{`
        .floating-tech-bg-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          z-index: 1;
          pointer-events: none;
          user-select: none;
        }

        .floating-tech-element {
          position: absolute;
          opacity: 0.1;
          will-change: transform;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: monospace;
          font-weight: bold;
        }

        @keyframes float-pattern-1 {
          0% { transform: translate3d(0, 0, 0) rotate(0deg); }
          50% { transform: translate3d(12px, -24px, 0) rotate(4deg); }
          100% { transform: translate3d(0, 0, 0) rotate(0deg); }
        }

        @keyframes float-pattern-2 {
          0% { transform: translate3d(0, 0, 0) rotate(0deg); }
          50% { transform: translate3d(-18px, -36px, 0) rotate(-7deg); }
          100% { transform: translate3d(0, 0, 0) rotate(0deg); }
        }

        @keyframes float-pattern-3 {
          0% { transform: translate3d(0, 0, 0) rotate(0deg); }
          50% { transform: translate3d(24px, 18px, 0) rotate(8deg); }
          100% { transform: translate3d(0, 0, 0) rotate(0deg); }
        }

        @keyframes float-pattern-4 {
          0% { transform: translate3d(0, 0, 0) rotate(0deg); }
          50% { transform: translate3d(-24px, 24px, 0) rotate(-5deg); }
          100% { transform: translate3d(0, 0, 0) rotate(0deg); }
        }

        @media (prefers-reduced-motion: reduce) {
          .floating-tech-element {
            animation: none !important;
          }
        }

        @media (max-width: 480px) {
          .tablet-visible, .desktop-visible {
            display: none !important;
          }
        }

        @media (min-width: 481px) and (max-width: 1024px) {
          .desktop-visible {
            display: none !important;
          }
        }
      `}</style>
      <div className="floating-tech-bg-container" aria-hidden="true">
        {items.map((item, idx) => {
          const IconComponent = item.type === 'icon' ? item.element : null;
          const classNames = `floating-tech-element ${item.visibility}-visible`;
          
          return (
            <div
              key={idx}
              className={classNames}
              style={{
                top: item.top,
                left: item.left,
                color: item.color,
                fontSize: item.size,
                animation: `${item.anim} ${item.duration} ease-in-out ${item.delay} infinite`,
              }}
            >
              {IconComponent ? <IconComponent size={item.size} /> : item.element}
            </div>
          );
        })}
      </div>
    </>
  );
}
