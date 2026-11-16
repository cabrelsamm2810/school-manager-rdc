'use client';

type StepIcon = 'camera' | 'search' | 'clipboard' | 'building' | 'check';

const STEPS: { label: string; icon: StepIcon }[] = [
  { label: 'Photo', icon: 'camera' },
  { label: 'Analyse', icon: 'search' },
  { label: 'Vérification', icon: 'clipboard' },
  { label: 'Institution', icon: 'building' },
  { label: 'Création', icon: 'check' },
];

const ACTIVE_COLOR = '#5E58A3';
const INACTIVE_COLOR = '#D1D5DB';
const ACTIVE_BG = '#E0E7FF';
const INACTIVE_BG = '#F3F4F6';

function StepSvg({ name, color, strokeWidth }: { name: StepIcon; color: string; strokeWidth: number }) {
  const common = { fill: 'none', stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (name) {
    case 'camera':
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" {...common}>
          <path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.9l.814-1.62a2 2 0 011.664-.9h5.856a2 2 0 011.664.9l.814 1.62A2 2 0 0019.07 7H20a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <circle cx="12" cy="13" r="3" />
        </svg>
      );
    case 'search':
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
      );
    case 'clipboard':
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" {...common}>
          <rect x="8" y="3" width="8" height="4" rx="1" />
          <path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
          <path d="M9 12h6M9 16h4" />
        </svg>
      );
    case 'check':
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M8 12l3 3l5-5" />
        </svg>
      );
    case 'building':
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" {...common}>
          <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
        </svg>
      );
  }
}

export function OcrWorkflowStepper({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-between px-1">
      {STEPS.map((step, idx) => {
        const isDone = idx < currentStep;
        const isActive = idx === currentStep;
        const color = isDone || isActive ? ACTIVE_COLOR : INACTIVE_COLOR;
        const bg = isDone || isActive ? ACTIVE_BG : INACTIVE_BG;
        const sw = isActive || isDone ? 2.5 : 1.5;

        return (
          <div key={step.label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-300"
                style={{ backgroundColor: bg }}
              >
                <StepSvg name={step.icon} color={color} strokeWidth={sw} />
              </div>
              <span
                className="text-[10px] font-medium transition-colors duration-300"
                style={{ color }}
              >
                {step.label}
              </span>
            </div>

            {idx < STEPS.length - 1 && (
              <div
                className="mx-1 h-0.5 flex-1 rounded-full transition-colors duration-300"
                style={{
                  backgroundColor: isDone ? ACTIVE_COLOR : INACTIVE_COLOR,
                  opacity: isDone ? 0.4 : 0.3,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
