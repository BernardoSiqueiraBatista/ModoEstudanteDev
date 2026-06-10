import { useState } from 'react';
import SetupPlanoLayout from './SetupPlanoLayout';
import Step1 from './Steps/Step1';
import Step2 from './Steps/Step2';
import Step3 from './Steps/Step3';
import Step4 from './Steps/Step4';

export default function SetupPlanoManager({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(1);

  if (!open) return null;

  const handleNext = () => setStep((s) => Math.min(s + 1, 4));
  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  return (
    <SetupPlanoLayout>
      {step === 1 && <Step1 onNext={handleNext} onClose={onClose} />}
      {step === 2 && <Step2 onNext={handleNext} onBack={handleBack} onClose={onClose} />}
      {step === 3 && <Step3 onNext={handleNext} onBack={handleBack} onClose={onClose} />}
      {step === 4 && <Step4 onBack={handleBack} onClose={onClose} onFinish={onClose} />}
    </SetupPlanoLayout>
  );
}