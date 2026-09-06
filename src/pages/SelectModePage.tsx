import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileQuestion, BookOpen, Stethoscope, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { PageContainer } from '@/components/PageContainer';
import type { TestMode, QuizQuestion } from '@/types';

export function SelectModePage() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [selected, setSelected] = useState<TestMode | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('scanned_questions');
    const storedUrl = sessionStorage.getItem('scan_image_url');
    if (!stored) {
      navigate('/scan');
      return;
    }
    setQuestions(JSON.parse(stored));
    if (storedUrl) setImageUrl(storedUrl);
  }, [navigate]);

  const modes: {
    id: TestMode;
    title: string;
    description: string;
    icon: typeof FileQuestion;
    gradient: string;
    features: string[];
  }[] = [
    {
      id: 'mcq',
      title: 'MCQs Test',
      description: 'Multiple-choice questions with 4 options each. Perfect for quick practice.',
      icon: FileQuestion,
      gradient: 'from-primary-500 to-emerald-600',
      features: ['4 options per question', 'Instant feedback', 'Score tracking'],
    },
    {
      id: 'theoretical',
      title: 'Theoretical Test',
      description: 'Concept-based questions focusing on theory and explanations.',
      icon: BookOpen,
      gradient: 'from-accent-500 to-blue-600',
      features: ['Theory-focused', 'Detailed explanations', 'Concept building'],
    },
    {
      id: 'mdcat',
      title: 'MDCAT MCQs Test',
      description: 'Full MDCAT-style test with medical entrance exam format.',
      icon: Stethoscope,
      gradient: 'from-orange-500 to-red-600',
      features: ['MDCAT format', 'Exam simulation', 'Time-pressure ready'],
    },
  ];

  const handleStart = () => {
    if (!selected) return;
    sessionStorage.setItem('selected_mode', selected);
    navigate('/quiz');
  };

  return (
    <PageContainer>
      <Navbar />
      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-3xl font-bold font-display">Choose Your Test Mode</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            {questions.length} questions extracted. Select how you want to practice.
          </p>
        </div>

        {imageUrl && (
          <div className="mb-6 flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
            <img src={imageUrl} alt="Scanned" className="w-16 h-16 rounded-xl object-cover" />
            <div className="flex-1">
              <div className="text-sm font-medium">Source image</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{questions.length} questions detected</div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-5">
          {modes.map((mode, i) => {
            const Icon = mode.icon;
            const isSelected = selected === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setSelected(mode.id)}
                className={`relative text-left p-6 rounded-3xl border-2 transition-all duration-300 animate-fade-in-up group ${
                  isSelected
                    ? 'border-primary-500 bg-primary-500/5 scale-[1.02]'
                    : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-lg'
                }`}
                style={{ animationDelay: `${0.1 + i * 0.1}s` }}
              >
                {isSelected && (
                  <div className="absolute top-4 right-4 w-7 h-7 rounded-full bg-primary-500 flex items-center justify-center animate-bounce-in">
                    <Check size={16} className="text-white" strokeWidth={3} />
                  </div>
                )}
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${mode.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon size={28} className="text-white" />
                </div>
                <h3 className="text-lg font-bold font-display mb-2">{mode.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{mode.description}</p>
                <div className="space-y-1.5">
                  {mode.features.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${mode.gradient}`} />
                      {f}
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex items-center justify-between animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <button
            onClick={() => navigate('/scan')}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft size={18} /> Back
          </button>
          <button
            onClick={handleStart}
            disabled={!selected}
            className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-primary-500/25 transition-all"
          >
            Start Test <ArrowRight size={18} />
          </button>
        </div>
      </main>
    </PageContainer>
  );
}

