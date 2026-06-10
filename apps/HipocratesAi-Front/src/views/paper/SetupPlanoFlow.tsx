import { useState } from 'react';
import SetupPlanoLayout from './SetupPlanoLayout';
import Step1 from './Steps/Step1';
import Step2 from './Steps/Step2';
import Step3 from './Steps/Step3';
import Step4 from './Steps/Step4';

interface SetupPlanoFlowProps {
  onClose: () => void;
  onFinish: () => void;
}

export default function SetupPlanoFlow({ onClose, onFinish }: SetupPlanoFlowProps) {
  const [step, setStep] = useState(1);

  return (
    <SetupPlanoLayout>
      {step === 1 && <Step1 onNext={() => setStep(2)} onClose={onClose} />}
      {step === 2 && <Step2 onNext={() => setStep(3)} onBack={() => setStep(1)} onClose={onClose} />}
      {step === 3 && <Step3 onNext={() => setStep(4)} onBack={() => setStep(2)} onClose={onClose} />}
      {step === 4 && <Step4 onBack={() => setStep(3)} onClose={onClose} onFinish={onFinish} />}
    </SetupPlanoLayout>
  );
}
