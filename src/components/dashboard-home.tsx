
"use client";

import type { Position, Personnel, TasraPosition } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { Users, Briefcase, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface DashboardHomeProps {
  positions: Position[];
  personnel: Personnel[];
  tasraPositions: TasraPosition[];
  tasraPersonnel: Personnel[];
}

const motivationalQuotes = [
  "Başarı, her gün tekrarlanan küçük çabaların toplamıdır.",
  "Bugünün işini yarına bırakma, çünkü yarının da kendi işleri olacak.",
  "Harika işler yapmanın tek yolu, yaptığınız işi sevmektir.",
  "En büyük zafer, hiç düşmemek değil, her düştüğünde yeniden ayağa kalkabilmektir.",
  "Geleceği tahmin etmenin en iyi yolu, onu yaratmaktır.",
  "Küçük başlangıçlar, büyük sonuçlar doğurur.",
  "Sadece başaranlar değil, deneyenler de değerlidir.",
  "Motivasyon, sizi başlatan şeydir. Alışkanlık ise devam etmenizi sağlayan.",
  "Her başarı hikayesinin arkasında, kararlılıkla atılmış adımlar vardır."
];

export function DashboardHome({ positions, personnel, tasraPositions, tasraPersonnel }: DashboardHomeProps) {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState("");
  const [quote, setQuote] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    if (user) {
        const hour = new Date().getHours();
        let timeOfDayGreeting = '';
        if (hour < 12) {
            timeOfDayGreeting = 'Günaydın';
        } else if (hour < 18) {
            timeOfDayGreeting = 'İyi Günler';
        } else {
            timeOfDayGreeting = 'Hayırlı Akşamlar';
        }
        setGreeting(`${timeOfDayGreeting}, ${user.firstName}!`);
    }
    
    setQuote(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);
    
    const today = new Date();
    const formattedDate = format(today, 'd MMMM yyyy', { locale: tr });
    setCurrentDate(formattedDate);
  }, [user]);

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
      <div className="flex justify-between items-start mb-6">
        <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">{greeting}</h2>
            <p className="text-muted-foreground mt-1">{quote}</p>
        </div>
        <div className="hidden sm:flex items-center gap-3 rounded-md border bg-card px-4 py-2 text-sm font-medium">
           <Calendar className="h-5 w-5 text-muted-foreground" />
           <span>{currentDate}</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-soft-blue text-soft-blue-foreground">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              <span className="font-bold">Merkez</span> Toplam Pozisyon
            </CardTitle>
            <Briefcase className="h-4 w-4 text-soft-blue-foreground/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{merkezStats.total}</div>
            <p className="text-xs text-soft-blue-foreground/80">{merkezStats.dolu} dolu, {merkezStats.bos} boş</p>
          </CardContent>
        </Card>
        <Card className="bg-soft-blue text-soft-blue-foreground">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              <span className="font-bold">Taşra</span> Toplam Pozisyon
            </CardTitle>
            <Briefcase className="h-4 w-4 text-soft-blue-foreground/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasraStats.total}</div>
             <p className="text-xs text-soft-blue-foreground/80">{tasraStats.dolu} dolu, {tasraStats.bos} boş</p>
          </CardContent>
        </Card>
         <Card className="bg-soft-green text-soft-green-foreground">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              <span className="font-bold">Merkez</span> Personel
            </CardTitle>
            <Users className="h-4 w-4 text-soft-green-foreground/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{merkezStats.personnel}</div>
            <p className="text-xs text-soft-green-foreground/80">Toplam merkez personeli</p>
          </CardContent>
        </Card>
        <Card className="bg-soft-green text-soft-green-foreground">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              <span className="font-bold">Taşra</span> Personel
            </CardTitle>
            <Users className="h-4 w-4 text-soft-green-foreground/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasraStats.personnel}</div>
             <p className="text-xs text-soft-green-foreground/80">Toplam taşra personeli</p>
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
                                    {`(${(percent * 100).toFixed(0)}%)`}
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
