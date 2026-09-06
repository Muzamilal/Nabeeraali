import { Brain } from 'lucide-react';

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: { icon: 20, text: 'text-lg' },
    md: { icon: 28, text: 'text-xl' },
    lg: { icon: 40, text: 'text-3xl' },
  };
  const s = sizes[size];

  return (
    <div className="flex items-center gap-2.5">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-accent-500 blur-md opacity-50" />
        <div className="relative bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
          <Brain size={s.icon} className="text-white" strokeWidth={2.5} />
        </div>
      </div>
      <span className={`font-display font-bold ${s.text} gradient-text`}>QuizMaster AI</span>
    </div>
  );
}

