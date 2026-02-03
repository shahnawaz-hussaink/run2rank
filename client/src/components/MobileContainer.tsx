import { ReactNode } from 'react';

interface MobileContainerProps {
  children: ReactNode;
}

export function MobileContainer({ children }: MobileContainerProps) {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-0 md:p-4">
      {/* Mobile device frame */}
      <div className="w-full max-w-[430px] h-screen md:h-[calc(100vh-32px)] md:max-h-[900px] md:rounded-[2rem] md:border-4 md:border-gray-700 md:shadow-2xl md:shadow-black/50 overflow-hidden relative bg-background flex flex-col">
        {/* Content - hide scrollbar */}
        <div className="flex-1 overflow-auto scrollbar-hide">
          {children}
        </div>
      </div>
    </div>
  );
}
