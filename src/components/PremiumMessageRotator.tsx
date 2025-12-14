import { useState, useEffect } from 'react';

const PremiumMessageRotator = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const messages = [
    {
      arabic: "مشكلة الكهرباء؟ نحن هنا لحلها",
      english: "Electricity problem? We're here to solve it"
    },
    {
      arabic: "الحفر في الطريق؟ سنصلحها فوراً",
      english: "Potholes on the road? We'll fix them immediately"
    },
    {
      arabic: "القمامة متراكمة؟ فريقنا في الطريق",
      english: "Garbage piling up? Our team is on the way"
    },
    {
      arabic: "بلغ عن المشكلة، ونحن نهتم بالباقي",
      english: "Report the issue, we handle the rest"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % messages.length);
        setIsAnimating(false);
      }, 600);
    }, 4000);

    return () => clearInterval(interval);
  }, [messages.length]);

  const jumpToMessage = (index: number) => {
    if (index !== currentIndex) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex(index);
        setIsAnimating(false);
      }, 600);
    }
  };

  return (
    <div className="relative w-full overflow-hidden">
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px) rotate(0deg);
          }
          25% {
            transform: translateY(-20px) translateX(10px) rotate(90deg);
          }
          50% {
            transform: translateY(-40px) translateX(-10px) rotate(180deg);
          }
          75% {
            transform: translateY(-20px) translateX(10px) rotate(270deg);
          }
        }
        .animate-float {
          animation: float 20s infinite ease-in-out;
        }
        @keyframes dropWord {
          0% {
            opacity: 0;
            transform: translateY(-20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .word-drop {
          display: inline-block;
          animation: dropWord 0.6s ease-out forwards;
        }
      `}</style>

      {/* Floating particles background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        {[...Array(15)].map((_, i) => {
          const randomSize = Math.random() * 80 + 40;
          const randomLeft = Math.random() * 100;
          const randomTop = Math.random() * 100;
          const randomDuration = Math.random() * 15 + 20;
          const randomDelay = Math.random() * 5;
          
          return (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${randomSize}px`,
                height: `${randomSize}px`,
                left: `${randomLeft}%`,
                top: `${randomTop}%`,
                backgroundColor: `hsl(227, 72%, 56%, 0.2)`,
                animation: `float ${randomDuration}s infinite ease-in-out`,
                animationDelay: `${randomDelay}s`,
              }}
            />
          );
        })}
      </div>

      {/* Main container */}
      <div className="relative z-10 mx-auto max-w-2xl px-6 py-20 sm:py-24 lg:py-28">
        {/* Top decorative line */}
        <div className="mb-12 flex items-center justify-center gap-4">
          <div className="h-1 w-12 rounded-full bg-gradient-to-r from-primary to-transparent" />
          <div className="text-sm font-medium text-primary uppercase tracking-widest">
            {['Smart', 'Solutions'].map((word, idx) => (
              <span
                key={idx}
                className="word-drop inline-block"
                style={{ animationDelay: `${idx * 0.15}s` }}
              >
                {word}
                {idx < 1 && <span className="mr-2" />}
              </span>
            ))}
          </div>
          <div className="h-1 w-12 rounded-full bg-gradient-to-l from-primary to-transparent" />
        </div>

        {/* Text Container with fade animation */}
        <div className="mb-12 min-h-40 text-center flex items-center justify-center">
          <div
            className="w-full transition-all duration-600 ease-out"
            style={{
              opacity: isAnimating ? 0 : 1,
              transform: isAnimating ? 'scale(0.95)' : 'scale(1)',
            }}
          >
            {/* Arabic text */}
            <h2
              className="mb-6 text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl text-foreground"
              dir="rtl"
            >
              {messages[currentIndex].arabic}
            </h2>

            {/* English text */}
            <p className="text-lg sm:text-xl font-semibold text-foreground">
              {messages[currentIndex].english}
            </p>
          </div>
        </div>

        {/* Bottom decorative line */}
        <div className="mb-12 flex items-center justify-center gap-4">
          <div className="h-1 w-12 rounded-full bg-gradient-to-r from-transparent to-primary" />
          <div className="h-1 w-1 rounded-full bg-primary" />
          <div className="h-1 w-12 rounded-full bg-gradient-to-l from-transparent to-primary" />
        </div>

        {/* Progress Bar */}
        <div className="mb-8 h-1 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300 ease-out"
            style={{
              width: `${((currentIndex + 1) / messages.length) * 100}%`,
            }}
          />
        </div>

        {/* Progress Indicators */}
        <div className="flex items-center justify-center gap-3">
          {messages.map((_, index) => (
            <button
              key={index}
              onClick={() => jumpToMessage(index)}
              className="group relative cursor-pointer transition-all duration-300"
              aria-label={`Go to message ${index + 1}`}
            >
              <div
                className="rounded-full bg-primary transition-all duration-300"
                style={{
                  height: '12px',
                  opacity: index === currentIndex ? 1 : 0.4,
                  width: index === currentIndex ? '32px' : '12px',
                }}
              />
              <span className="absolute top-full mt-2 whitespace-nowrap text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                Message {index + 1}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PremiumMessageRotator;