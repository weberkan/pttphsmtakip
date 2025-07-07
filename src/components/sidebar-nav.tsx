
'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Building, Users, BarChart2, Map, Folder, Briefcase, Archive, Kanban, FileText, Printer, FileUp, ScrollText } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import * as React from 'react';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

const menuItems = [
  { href: 'talimatlar', title: 'Talimatlar', icon: Kanban },
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
  {
    id: 'depo',
    title: 'Depo',
    icon: Archive,
    subItems: [
      { href: 'depposh-taslak', title: 'Taslak', icon: FileText },
      { href: 'depposh-matbu', title: 'Matbu', icon: Printer },
      { href: 'depposh-guncel', title: 'Güncel', icon: FileUp },
      { href: 'depposh-mevzuat', title: 'Mevzuat', icon: ScrollText },
    ],
  }
];


export function SidebarNav({ isCollapsed }: { isCollapsed: boolean }) {
  const searchParams = useSearchParams();
  const currentView = searchParams.get('view') || 'dashboard';

  const activeAccordion = menuItems.find(item => 'subItems' in item && item.subItems?.some(sub => sub.href === currentView))?.id;

  const [openItems, setOpenItems] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (!isCollapsed && activeAccordion && !openItems.includes(activeAccordion)) {
        setOpenItems(prev => [...prev, activeAccordion]);
    }
  }, [activeAccordion, isCollapsed]);
  
  return (
    <nav className="flex flex-col gap-2 p-2 pt-4">
      <Accordion 
        type="multiple" 
        className="w-full"
        value={isCollapsed ? [] : openItems}
        onValueChange={setOpenItems}
      >
        {menuItems.map((item) => {
          if ('subItems' in item) {
            return (
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
            );
          }
          return (
            <TooltipProvider key={item.href} delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={`/?view=${item.href}`}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary',
                      currentView === item.href ? 'bg-muted text-primary' : 'text-muted-foreground',
                      isCollapsed && 'justify-center'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className={cn(isCollapsed && 'hidden')}>{item.title}</span>
                  </Link>
                </TooltipTrigger>
                {isCollapsed && <TooltipContent side="right">{item.title}</TooltipContent>}
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </Accordion>
    </nav>
  );
}
