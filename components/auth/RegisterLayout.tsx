'use client';

import { useState } from 'react';
import { RegisterForm } from './RegisterForm';
import { RegisterIllustration } from './RegisterIllustration';

export function RegisterLayout() {
  const [step, setStep] = useState(0);

  return (
    <div className="reg-layout">
      {/* Illustration panel */}
      <aside className="reg-layout-illustration">
        <RegisterIllustration step={step} />
      </aside>
      {/* Form panel */}
      <div className="reg-layout-form">
        <RegisterForm onStepChange={setStep} />
      </div>
    </div>
  );
}
