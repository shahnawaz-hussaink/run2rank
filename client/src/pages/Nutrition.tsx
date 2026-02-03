import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Utensils, Apple, Beef, Fish, Salad, Milk, Egg, Wheat, Droplets, AlertCircle, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BottomNav } from '@/components/BottomNav';
import { useHealthData } from '@/hooks/useHealthData';
import { Loader2 } from 'lucide-react';

interface NutritionItem {
  name: string;
  icon: React.ElementType;
  benefit: string;
  examples: string[];
  color: string;
  bgColor: string;
}

const underweightNutrition: NutritionItem[] = [
  {
    name: 'Healthy Fats',
    icon: Fish,
    benefit: 'Increase calorie intake with nutrient-dense fats',
    examples: ['Avocados', 'Nuts & Seeds', 'Olive Oil', 'Fatty Fish'],
    color: 'text-amber-600',
    bgColor: 'from-amber-100 to-amber-50'
  },
  {
    name: 'Protein Rich Foods',
    icon: Beef,
    benefit: 'Build muscle mass and healthy weight',
    examples: ['Lean Meats', 'Eggs', 'Greek Yogurt', 'Legumes'],
    color: 'text-red-600',
    bgColor: 'from-red-100 to-red-50'
  },
  {
    name: 'Complex Carbs',
    icon: Wheat,
    benefit: 'Sustained energy and healthy weight gain',
    examples: ['Whole Grains', 'Brown Rice', 'Oats', 'Sweet Potatoes'],
    color: 'text-orange-600',
    bgColor: 'from-orange-100 to-orange-50'
  },
  {
    name: 'Dairy Products',
    icon: Milk,
    benefit: 'Calcium and calories for weight gain',
    examples: ['Whole Milk', 'Cheese', 'Yogurt', 'Paneer'],
    color: 'text-blue-600',
    bgColor: 'from-blue-100 to-blue-50'
  }
];

const overweightNutrition: NutritionItem[] = [
  {
    name: 'Leafy Greens',
    icon: Salad,
    benefit: 'Low calories, high fiber for satiety',
    examples: ['Spinach', 'Kale', 'Lettuce', 'Broccoli'],
    color: 'text-emerald-600',
    bgColor: 'from-emerald-100 to-emerald-50'
  },
  {
    name: 'Lean Proteins',
    icon: Egg,
    benefit: 'Keep you full while building muscle',
    examples: ['Chicken Breast', 'Fish', 'Egg Whites', 'Tofu'],
    color: 'text-cyan-600',
    bgColor: 'from-cyan-100 to-cyan-50'
  },
  {
    name: 'Fruits',
    icon: Apple,
    benefit: 'Natural sugars with fiber and vitamins',
    examples: ['Berries', 'Apples', 'Oranges', 'Watermelon'],
    color: 'text-rose-600',
    bgColor: 'from-rose-100 to-rose-50'
  },
  {
    name: 'Hydration',
    icon: Droplets,
    benefit: 'Boost metabolism and reduce hunger',
    examples: ['Water', 'Green Tea', 'Herbal Infusions', 'Lemon Water'],
    color: 'text-sky-600',
    bgColor: 'from-sky-100 to-sky-50'
  }
];

export default function NutritionPage() {
  const navigate = useNavigate();
  const { healthData, loading } = useHealthData();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-cyan-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const bmi = healthData?.bmi || 0;
  const isUnderweight = bmi > 0 && bmi < 18.5;
  const isOverweight = bmi >= 25;
  const isNormal = bmi >= 18.5 && bmi < 25;

  const nutritionItems = isUnderweight ? underweightNutrition : overweightNutrition;
  
  const getStatusInfo = () => {
    if (isUnderweight) {
      return {
        title: 'Gain Healthy Weight',
        subtitle: 'Nutrition plan to reach optimal BMI',
        icon: TrendingUp,
        gradient: 'from-amber-500 to-orange-500',
        targetBmi: '18.5 - 24.9',
        message: 'Focus on nutrient-dense, calorie-rich foods to build healthy mass.'
      };
    }
    if (isOverweight) {
      return {
        title: 'Achieve Healthy Weight',
        subtitle: 'Nutrition plan for sustainable weight loss',
        icon: TrendingDown,
        gradient: 'from-rose-500 to-pink-500',
        targetBmi: '18.5 - 24.9',
        message: 'Focus on whole foods, portion control, and staying hydrated.'
      };
    }
    return {
      title: 'Maintain Your Health',
      subtitle: 'You have a healthy BMI!',
      icon: Target,
      gradient: 'from-emerald-500 to-cyan-500',
      targetBmi: '18.5 - 24.9',
      message: 'Keep up your balanced diet and active lifestyle!'
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="flex flex-col min-h-full bg-gradient-to-br from-emerald-50 via-white to-cyan-50">
      {/* Decorative Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-green-200/40 to-emerald-200/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-emerald-200/40 to-green-200/40 rounded-full blur-3xl" />
      </div>

      <div className="flex-1 relative z-10 pb-4">
        {/* Header */}
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/health')}
              className="rounded-xl bg-white/80 backdrop-blur-xl shadow-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Nutrition Guide</h1>
              <p className="text-sm text-gray-500">Personalized for your BMI</p>
            </div>
          </div>
        </div>

        {/* BMI Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mb-4"
        >
          <div className={`bg-gradient-to-r ${statusInfo.gradient} rounded-2xl p-5 text-white shadow-lg`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <statusInfo.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold">{statusInfo.title}</h2>
                <p className="text-sm text-white/80">{statusInfo.subtitle}</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 mb-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/80">Your BMI</span>
                <span className="font-bold">{bmi > 0 ? bmi.toFixed(1) : 'Not set'}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-white/80">Target Range</span>
                <span className="font-bold">{statusInfo.targetBmi}</span>
              </div>
            </div>
            <p className="text-sm text-white/90">{statusInfo.message}</p>
          </div>
        </motion.div>

        {/* Normal BMI Message */}
        {isNormal && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mx-4 mb-4"
          >
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 shadow-lg border border-white/50 text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-emerald-100 to-cyan-100 flex items-center justify-center">
                <Utensils className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Great Job! 🎉</h3>
              <p className="text-sm text-gray-600">
                Your BMI is in the healthy range. Continue eating a balanced diet with plenty of fruits, vegetables, lean proteins, and whole grains.
              </p>
            </div>
          </motion.div>
        )}

        {/* Nutrition Recommendations */}
        {!isNormal && (
          <>
            <div className="px-4 mb-3">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Utensils className="w-5 h-5 text-emerald-500" />
                Recommended Foods
              </h3>
            </div>

            <div className="px-4 space-y-3">
              {nutritionItems.map((item, index) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.1 }}
                  className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 shadow-lg border border-white/50"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.bgColor} flex items-center justify-center flex-shrink-0`}>
                      <item.icon className={`w-6 h-6 ${item.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-800">{item.name}</h4>
                      <p className="text-xs text-gray-500 mb-2">{item.benefit}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {item.examples.map((example) => (
                          <span
                            key={example}
                            className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg"
                          >
                            {example}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {/* Tips Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mx-4 mt-4"
        >
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-100">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-gray-800 text-sm">Important Note</h4>
                <p className="text-xs text-gray-600 mt-1">
                  This is general guidance based on your BMI. For personalized nutrition advice, please consult a registered dietitian or healthcare provider.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <BottomNav />
    </div>
  );
}
