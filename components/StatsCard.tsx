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
    <div className="bg-gradient-to-br from-white/22 via-white/18 to-white/20 backdrop-blur-2xl rounded-[2rem] border border-white/30 shadow-[0_8px_32px_0_rgba(31,38,135,0.15),0_1px_3px_0_rgba(255,255,255,0.8)_inset] p-5 relative overflow-hidden hover:from-white/25 hover:via-white/22 hover:to-white/23 transition-all duration-300">
      {/* Liquid Glass Effects */}
      <div className="absolute top-0 left-0 right-0 h-2/5 bg-gradient-to-b from-white/25 via-white/8 to-transparent rounded-t-[2rem] pointer-events-none blur-[1px]" />
      <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/2 via-black/1 to-transparent rounded-b-[2rem] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-br from-[#066f48]/2 via-transparent to-cyan-400/2 rounded-[2rem] pointer-events-none" />
      <div className="absolute top-0 left-0 w-2/3 h-2/3 bg-gradient-to-br from-white/15 via-white/5 to-transparent blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-to-tl from-[#066f48]/3 to-transparent blur-2xl rounded-full pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className={`p-2.5 rounded-xl ${colorClass} shadow-lg`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          {trend && (
            <div className={`flex items-center text-xs font-semibold ${trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
              {trendUp ? <ArrowUpRight className="w-3.5 h-3.5 mr-1" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-1" />}
              <span className="hidden sm:inline">{trend}</span>
            </div>
          )}
        </div>
        <h3 className="text-gray-600 text-xs font-medium mb-1.5">{title}</h3>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
};