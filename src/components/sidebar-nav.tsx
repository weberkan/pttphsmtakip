
'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Building, Users, BarChart2, Map, Folder, Briefcase, SlidersHorizontal } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import * as React from 'react';

export const menuConfig = {
  yonetim: {
    title: 'Yönetim',
    items: [
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
    ]
  },
  raporlama: {
    title: 'Raporlama ve Analiz',
    items: [
       { id: 'raporlama', href: 'raporlama', title: 'Genel Raporlama', icon: BarChart2 }
    ]
  }
};


interface SidebarNavProps {
    activePrimaryNav: 'yonetim' | 'raporlama';
}

export function SidebarNav({ activePrimaryNav }: SidebarNavProps) {
  const searchParams = useSearchParams();
  const currentView = searchParams.get('view') || 'dashboard';

  const { items } = menuConfig[activePrimaryNav];
  
  const defaultOpenAccordion = items.find(item => 'subItems' in item && item.subItems?.some(sub => sub.href === currentView))?.id;

  if (activePrimaryNav === 'yonetim') {
    return (
      <nav className="flex flex-col gap-2 px-4">
        <Accordion type="multiple" defaultValue={defaultOpenAccordion ? [defaultOpenAccordion] : []} className="w-full">
          {items.map((item) => (
            'subItems' in item && (
              <AccordionItem key={item.id} value={item.id} className="border-b-0">
                <AccordionTrigger className="p-2 -mx-2 hover:bg-accent hover:no-underline rounded-md text-sm font-medium [&[data-state=open]>svg]:text-primary data-[state=open]:text-primary">
                  <div className="flex items-center gap-3">
                      <item.icon className="h-5 w-5" />
                      {item.title}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pl-6 border-l ml-4 mt-1">
                  <div className="flex flex-col gap-1 mt-1">
                      {item.subItems.map((subItem) => (
                      <Link
                          key={subItem.href}
                          href={`/?view=${subItem.href}`}
                          className={cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary',
                            currentView === subItem.href ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : 'text-muted-foreground'
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
      </nav>
    );
  }

  if (activePrimaryNav === 'raporlama') {
    return (
        <nav className="flex flex-col gap-2 px-4">
            {items.map((item) => (
                'href' in item && (
                    <Link
                        key={item.href}
                        href={`/?view=${item.href}`}
                        className={cn(
                            'flex items-center gap-3 rounded-lg p-2 text-sm font-medium transition-all hover:text-primary',
                            currentView === item.href ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : 'text-foreground'
                        )}
                        >
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                    </Link>
                )
            ))}
        </nav>
    );
  }

  return null;
}
