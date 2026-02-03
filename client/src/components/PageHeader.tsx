import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconGradient?: string;
  rightElement?: ReactNode;
}

export function PageHeader({ 
  title, 
  subtitle, 
  icon: Icon, 
  iconGradient = 'from-emerald-500 to-cyan-500',
  rightElement 
}: PageHeaderProps) {
  return (
    <div className="px-4 pt-6 pb-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          {Icon && (
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${iconGradient} flex items-center justify-center shadow-lg`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold font-display text-gray-800">{title}</h1>
            {subtitle && (
              <p className="text-gray-500 text-sm">{subtitle}</p>
            )}
          </div>
        </div>
        {rightElement}
      </motion.div>
    </div>
  );
}
