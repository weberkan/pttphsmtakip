'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Building, Users, BarChart2, Map, Folder, Briefcase } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import * as React from 'react';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

const menuItems = [
  {
    id: 'merkez',
    title: 'Merkez Teşkilatı',
    icon: Building,
    subItems: [
      { href: 'merkez-pozisyon', title: 'Pozisyon Yönetimi', icon: Briefcase },
      { href: 'merkez-personel', title: 'Personel Yönetimi', icon: Users },
      { href: 'merkez-sema', title: 'Organizasyon Şeması', icon: Folder },
    ],
  },
  {
    id: 'tasra',
    title: 'Taşra Teşkilatı',
    icon: Map,
    subItems: [
      { href: 'tasra-pozisyon', title: 'Pozisyon Yönetimi', icon: Briefcase },
      { href: 'tasra-personel', title: 'Personel Yönetimi', icon: Users },
    ],
  },
  { href: 'raporlama', title: 'Raporlama ve Analiz', icon: BarChart2 },
];


export function SidebarNav({ isCollapsed }: { isCollapsed: boolean }) {
  const searchParams = useSearchParams();
  const currentView = searchParams.get('view') || 'dashboard';

  const defaultOpenAccordion = isCollapsed ? undefined : menuItems.find(item => 'subItems' in item && item.subItems?.some(sub => sub.href === currentView))?.id;
  
  return (
    <nav className="flex flex-col gap-2 p-2 pt-4">
      <Accordion type="multiple" defaultValue={defaultOpenAccordion ? [defaultOpenAccordion] : []} className="w-full" value={isCollapsed ? [] : (defaultOpenAccordion ? [defaultOpenAccordion] : undefined)}>
        {menuItems.filter(item => 'subItems' in item).map((item) => (
          'subItems' in item && (
            <AccordionItem key={item.id} value={item.id} className="border-b-0">
               <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AccordionTrigger 
                      className={cn(
                        "p-2 -mx-2 hover:bg-accent hover:no-underline rounded-md text-sm font-medium",
                        isCollapsed && "justify-center"
                      )}
                      disabled={isCollapsed}
                      hideChevron={isCollapsed}
                    >
                      <div className="flex items-center gap-3">
                          <item.icon className="h-4 w-4" />
                          <span className={cn(isCollapsed && 'hidden')}>{item.title}</span>
                      </div>
                    </AccordionTrigger>
                  </TooltipTrigger>
                  {isCollapsed && <TooltipContent side="right">{item.title}</TooltipContent>}
                </Tooltip>
              </TooltipProvider>
              <AccordionContent className="pl-6 border-l ml-3 mt-1">
                <div className="flex flex-col gap-1 mt-1">
                    {item.subItems.map((subItem) => (
                    <Link
                        key={subItem.href}
                        href={`/?view=${subItem.href}`}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary',
                          currentView === subItem.href ? 'bg-muted text-primary' : 'text-muted-foreground'
                        )}
                    >
                        <subItem.icon className="h-4 w-4" />
                        <span>{subItem.title}</span>
                    </Link>
                    ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        ))}
      </Accordion>

      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              key="raporlama"
              href="/?view=raporlama"
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary',
                currentView === 'raporlama' ? 'bg-muted text-primary' : 'text-muted-foreground',
                isCollapsed && 'justify-center'
              )}
            >
              <BarChart2 className="h-4 w-4" />
              <span className={cn(isCollapsed && 'hidden')}>Raporlama ve Analiz</span>
            </Link>
          </TooltipTrigger>
          {isCollapsed && <TooltipContent side="right">Raporlama ve Analiz</TooltipContent>}
        </Tooltip>
      </TooltipProvider>
    </nav>
  );
}
