/**
 * Analytics Charts Component
 * Displays revenue charts and conversion metrics
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { TrendingUp, TrendingDown, Target, Zap, Trophy, ArrowUpRight, ArrowDownRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AnalyticsData, TopProduct } from "@/hooks/use-analytics";

interface AnalyticsChartsProps {
  analytics: AnalyticsData;
}

const formatPrice = (amount: number) => {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
};

const formatPriceShort = (amount: number) => {
  if (amount >= 1000000) return (amount / 1000000).toFixed(1) + "M";
  if (amount >= 1000) return (amount / 1000).toFixed(0) + "K";
  return amount.toString();
};

export function RevenueChart({ analytics }: AnalyticsChartsProps) {
  const maxRevenue = Math.max(...analytics.dailyRevenue.map(d => d.revenue), 1);
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Revenus (7 jours)</span>
          <Badge variant="secondary" className="font-normal">
            {formatPrice(analytics.weeklyRevenue)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.dailyRevenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis 
                dataKey="shortDate" 
                axisLine={false} 
                tickLine={false}
                tick={{ fontSize: 12, fill: '#888' }}
              />
              <YAxis 
                hide 
                domain={[0, maxRevenue * 1.1]}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-popover border rounded-lg p-2 shadow-lg">
                        <p className="font-medium">{data.shortDate}</p>
                        <p className="text-sm text-green-600">{formatPrice(data.revenue)}</p>
                        <p className="text-xs text-muted-foreground">{data.orders} commandes</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                {analytics.dailyRevenue.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={index === analytics.dailyRevenue.length - 1 ? '#22c55e' : '#e5e7eb'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function PerformanceMetrics({ analytics }: AnalyticsChartsProps) {
  const isPositiveChange = analytics.revenueChange >= 0;
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Performance du jour</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Today vs Yesterday */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div>
            <p className="text-sm text-muted-foreground">Aujourd'hui</p>
            <p className="text-xl font-bold text-green-600">{formatPrice(analytics.todayRevenue)}</p>
          </div>
          <div className={`flex items-center gap-1 ${isPositiveChange ? 'text-green-600' : 'text-red-500'}`}>
            {isPositiveChange ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            <span className="font-medium">
              {isPositiveChange ? '+' : ''}{analytics.revenueChange.toFixed(0)}%
            </span>
          </div>
        </div>
        
        {/* Conversion Rate */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-500" />
            <span className="text-sm">Taux de conversion</span>
          </div>
          <span className="font-semibold">{analytics.conversionRate.toFixed(0)}%</span>
        </div>
        
        {/* Average Order Value */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            <span className="text-sm">Panier moyen</span>
          </div>
          <span className="font-semibold">{formatPrice(analytics.averageOrderValue)}</span>
        </div>
        
        {/* Today's orders */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isPositiveChange ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm">Ventes du jour</span>
          </div>
          <span className="font-semibold">{analytics.todayPaidOrders} payées / {analytics.todayOrders} total</span>
        </div>
      </CardContent>
    </Card>
  );
}

interface TopProductsProps {
  products: TopProduct[];
}

export function TopProductsCard({ products }: TopProductsProps) {
  if (products.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Top produits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-4 text-sm">
            Aucune vente encore
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          Top produits
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {products.map((product, index) => (
            <div key={product.productId} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  index === 0 ? 'bg-amber-100 text-amber-700' :
                  index === 1 ? 'bg-gray-100 text-gray-700' :
                  index === 2 ? 'bg-orange-100 text-orange-700' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium text-sm">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{product.quantity} vendus</p>
                </div>
              </div>
              <span className="font-semibold text-sm text-green-600">
                {formatPriceShort(product.revenue)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ConversionFunnel({ analytics }: AnalyticsChartsProps) {
  const { statusBreakdown } = analytics;
  const total = Object.values(statusBreakdown).reduce((sum, v) => sum + v, 0);
  
  const funnelData = [
    { label: "Réservées", value: statusBreakdown.reserved + statusBreakdown.paid + statusBreakdown.expired, color: "bg-blue-500" },
    { label: "Payées", value: statusBreakdown.paid, color: "bg-green-500" },
    { label: "Expirées", value: statusBreakdown.expired, color: "bg-red-400" },
  ];
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Entonnoir de conversion</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {funnelData.map((item, index) => {
            const percentage = total > 0 ? (item.value / total) * 100 : 0;
            return (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{item.label}</span>
                  <span className="font-medium">{item.value}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${item.color} transition-all duration-500`}
                    style={{ width: `${Math.max(percentage, item.value > 0 ? 5 : 0)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

