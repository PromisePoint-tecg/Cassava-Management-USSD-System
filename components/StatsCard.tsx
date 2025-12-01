import React from 'react';
import { ArrowUpRight, ArrowDownRight, LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  icon: LucideIcon;
  colorClass: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, trend, trendUp, icon: Icon, colorClass }) => {
  return (
    <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${colorClass} bg-opacity-10`}>
          <Icon className={`w-5 h-5 ${colorClass.replace('bg-', 'text-')}`} />
        </div>
        {trend && (
          <div className={`flex items-center text-xs font-medium ${trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
            {trendUp ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
            <span className="hidden sm:inline">{trend}</span>
          </div>
        )}
      </div>
      <h3 className="text-gray-500 text-xs font-medium mb-1">{title}</h3>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
};