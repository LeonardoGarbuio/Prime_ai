"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ChartDataPoint {
    date: string;
    score: number;
    symmetry?: number;
    skin?: number;
    structure?: number;
}

interface EvolutionChartProps {
    data: ChartDataPoint[];
    evolution?: {
        totalChange: number;
        recentChange: number;
        weeksTracked: number;
        isImproving: boolean;
    } | null;
}

export function EvolutionChart({ data, evolution }: EvolutionChartProps) {
    if (data.length < 2) {
        return (
            <div className="bg-[#1C1C1E] rounded-2xl border border-white/10 p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                    <TrendingUp className="w-8 h-8 text-gray-500" />
                </div>
                <h3 className="text-white font-bold mb-2">Comece a Rastrear sua Evolução</h3>
                <p className="text-gray-400 text-sm max-w-sm mx-auto">
                    Faça análises semanais para visualizar seu progresso aqui.
                    Você precisa de pelo menos 2 análises para ver o gráfico.
                </p>
                <div className="mt-4 text-xs text-gray-500">
                    📊 {data.length}/2 análises registradas
                </div>
            </div>
        );
    }

    const latestScore = data[data.length - 1]?.score || 0;
    const firstScore = data[0]?.score || 0;
    const totalChange = (latestScore - firstScore).toFixed(1);
    const isPositive = parseFloat(totalChange) > 0;
    const isNeutral = parseFloat(totalChange) === 0;

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
                {/* Total Change */}
                <div className={`p-4 rounded-xl border ${isPositive
                        ? 'bg-green-500/10 border-green-500/30'
                        : isNeutral
                            ? 'bg-white/5 border-white/10'
                            : 'bg-red-500/10 border-red-500/30'
                    }`}>
                    <div className="flex items-center gap-2 mb-1">
                        {isPositive ? (
                            <TrendingUp className="w-4 h-4 text-green-400" />
                        ) : isNeutral ? (
                            <Minus className="w-4 h-4 text-gray-400" />
                        ) : (
                            <TrendingDown className="w-4 h-4 text-red-400" />
                        )}
                        <span className="text-[10px] text-gray-400 uppercase">Total</span>
                    </div>
                    <div className={`text-2xl font-bold ${isPositive ? 'text-green-400' : isNeutral ? 'text-gray-400' : 'text-red-400'
                        }`}>
                        {isPositive ? '+' : ''}{totalChange}
                    </div>
                </div>

                {/* Weeks Tracked */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-[10px] text-gray-400 uppercase mb-1">Semanas</div>
                    <div className="text-2xl font-bold text-white">{data.length}</div>
                </div>

                {/* Latest Score */}
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                    <div className="text-[10px] text-primary/70 uppercase mb-1">Atual</div>
                    <div className="text-2xl font-bold text-primary">{latestScore}</div>
                </div>
            </div>

            {/* Chart */}
            <div className="bg-[#1C1C1E] rounded-2xl border border-white/10 p-4 pt-6">
                <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#39FF14" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#39FF14" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis
                                dataKey="date"
                                tick={{ fill: '#6b7280', fontSize: 10 }}
                                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                                tickLine={false}
                            />
                            <YAxis
                                domain={[0, 10]}
                                tick={{ fill: '#6b7280', fontSize: 10 }}
                                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                                tickLine={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1C1C1E',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px',
                                    color: '#fff'
                                }}
                                labelStyle={{ color: '#9ca3af' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="score"
                                stroke="#39FF14"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorScore)"
                                dot={{ fill: '#39FF14', strokeWidth: 2, r: 4 }}
                                activeDot={{ r: 6, stroke: '#39FF14', strokeWidth: 2 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Metrics Breakdown */}
            {data.length >= 2 && (
                <div className="grid grid-cols-2 gap-3">
                    <MetricCard
                        label="Simetria"
                        current={data[data.length - 1]?.symmetry || 0}
                        previous={data[0]?.symmetry || 0}
                    />
                    <MetricCard
                        label="Pele"
                        current={data[data.length - 1]?.skin || 0}
                        previous={data[0]?.skin || 0}
                    />
                </div>
            )}
        </div>
    );
}

function MetricCard({ label, current, previous }: { label: string; current: number; previous: number }) {
    const change = current - previous;
    const isPositive = change > 0;
    const isNeutral = change === 0;

    return (
        <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">{label}</span>
                <span className={`text-xs font-bold ${isPositive ? 'text-green-400' : isNeutral ? 'text-gray-400' : 'text-red-400'
                    }`}>
                    {isPositive ? '+' : ''}{change.toFixed(0)}%
                </span>
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-white">{current}%</span>
                <span className="text-xs text-gray-500">de {previous}%</span>
            </div>
        </div>
    );
}
