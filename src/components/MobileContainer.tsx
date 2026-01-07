import { ReactNode } from 'react';

interface MobileContainerProps {
  children: ReactNode;
}

export function MobileContainer({ children }: MobileContainerProps) {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      {/* Mobile device frame */}
      <div className="w-full max-w-[430px] min-h-screen md:min-h-[calc(100vh-40px)] md:max-h-[932px] md:rounded-[2.5rem] md:border-4 md:border-gray-700 md:shadow-2xl md:shadow-black/50 overflow-hidden relative bg-background">
        {/* Notch for mobile simulation on desktop */}
        <div className="hidden md:block absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-800 rounded-b-2xl z-50" />
        
        {/* Content */}
        <div className="h-full overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
