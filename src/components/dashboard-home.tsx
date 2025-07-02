"use client";

import type { Position, Personnel, TasraPosition } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { Users, Briefcase } from 'lucide-react';

interface DashboardHomeProps {
  positions: Position[];
  personnel: Personnel[];
  tasraPositions: TasraPosition[];
  tasraPersonnel: Personnel[];
}

export function DashboardHome({ positions, personnel, tasraPositions, tasraPersonnel }: DashboardHomeProps) {

  const merkezStats = {
    total: positions.length,
    dolu: positions.filter(p => p.status !== 'Boş').length,
    asil: positions.filter(p => p.status === 'Asıl').length,
    vekalet: positions.filter(p => p.status === 'Vekalet').length,
    yurutme: positions.filter(p => p.status === 'Yürütme').length,
    bos: positions.filter(p => p.status === 'Boş').length,
    personnel: personnel.length,
  };

  const tasraStats = {
    total: tasraPositions.length,
    dolu: tasraPositions.filter(p => p.status !== 'Boş').length,
    asil: tasraPositions.filter(p => p.status === 'Asıl').length,
    vekalet: tasraPositions.filter(p => p.status === 'Vekalet').length,
    yurutme: tasraPositions.filter(p => p.status === 'Yürütme').length,
    bos: tasraPositions.filter(p => p.status === 'Boş').length,
    personnel: tasraPersonnel.length,
  };

  const merkezChartData = [
    { name: 'Asıl', value: merkezStats.asil, fill: 'hsl(var(--chart-1))' },
    { name: 'Vekalet', value: merkezStats.vekalet, fill: 'hsl(var(--chart-2))' },
    { name: 'Yürütme', value: merkezStats.yurutme, fill: 'hsl(var(--chart-3))' },
    { name: 'Boş', value: merkezStats.bos, fill: 'hsl(var(--chart-4))' },
  ];

  const tasraPieChartData = [
    { name: 'Asıl', value: tasraStats.asil, fill: 'hsl(var(--chart-1))' },
    { name: 'Vekalet', value: tasraStats.vekalet, fill: 'hsl(var(--chart-2))' },
    { name: 'Yürütme', value: tasraStats.yurutme, fill: 'hsl(var(--chart-3))' },
    { name: 'Boş', value: tasraStats.bos, fill: 'hsl(var(--chart-4))' },
  ];
  
  const chartConfig = {
    value: { label: 'Sayı' },
    Asıl: { label: 'Asıl', color: 'hsl(var(--chart-1))' },
    Vekalet: { label: 'Vekalet', color: 'hsl(var(--chart-2))' },
    Yürütme: { label: 'Yürütme', color: 'hsl(var(--chart-3))' },
    Boş: { label: 'Boş', color: 'hsl(var(--chart-4))' },
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Merkez Toplam Pozisyon</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{merkezStats.total}</div>
            <p className="text-xs text-muted-foreground">{merkezStats.dolu} dolu, {merkezStats.bos} boş</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taşra Toplam Pozisyon</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasraStats.total}</div>
             <p className="text-xs text-muted-foreground">{tasraStats.dolu} dolu, {tasraStats.bos} boş</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Merkez Personel</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{merkezStats.personnel}</div>
            <p className="text-xs text-muted-foreground">Toplam merkez personeli</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taşra Personel</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasraStats.personnel}</div>
             <p className="text-xs text-muted-foreground">Toplam taşra personeli</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Merkez Pozisyon Durumları</CardTitle>
             <CardDescription>Merkezdeki pozisyonların durumlarına göre dağılımı.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart accessibilityLayer data={merkezChartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                 <CartesianGrid horizontal={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <XAxis dataKey="value" type="number" />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar dataKey="value" radius={5} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Taşra Pozisyon Durumları</CardTitle>
                <CardDescription>Taşradaki pozisyonların durumlarına göre dağılımı.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <PieChart>
                        <ChartTooltip content={<ChartTooltipContent nameKey="value" hideLabel />} />
                        <Pie data={tasraPieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                            const RADIAN = Math.PI / 180;
                            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                            const x = cx + radius * Math.cos(-midAngle * RADIAN);
                            const y = cy + radius * Math.sin(-midAngle * RADIAN);
                            return (
                                <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                                    {`${(percent * 100).toFixed(0)}%`}
                                </text>
                            );
                        }}>
                             {tasraPieChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Pie>
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
      </div>

    </div>
  );
}
