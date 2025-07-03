
'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Building, Users, BarChart2, Map, Folder, Briefcase, LayoutDashboard, UserCheck } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';

const baseMenuItems = [
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
  {
    id: 'raporlama',
    title: 'Raporlama ve Analiz',
    icon: BarChart2,
    href: 'raporlama',
  },
];

const adminMenuItem = {
    id: 'admin',
    title: 'Yönetim Paneli',
    icon: UserCheck,
    subItems: [
      { href: 'kullanici-onay', title: 'Kullanıcı Onayları', icon: UserCheck },
    ]
};


interface SidebarNavProps {
    isCollapsed: boolean;
}

export function SidebarNav({ isCollapsed }: SidebarNavProps) {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const currentView = searchParams.get('view') || 'dashboard';

  const menuItems = user?.role === 'admin' ? [...baseMenuItems, adminMenuItem] : baseMenuItems;
  
  const defaultOpenAccordion = menuItems.find(item => item.subItems?.some(sub => sub.href === currentView))?.id;

  if (isCollapsed) {
    const allLinks = menuItems.flatMap(item => 
        item.subItems ? item.subItems.map(sub => ({ ...sub, groupTitle: item.title, id: sub.href })) : { ...item, groupTitle: item.title, id: item.href }
    );
    
    return (
        <TooltipProvider delayDuration={0}>
            <nav className="flex flex-col items-center gap-1 px-2">
                {allLinks.map((link) => (
                    link.href && (
                        <Tooltip key={link.id}>
                            <TooltipTrigger asChild>
                                <Link
                                    href={`/?view=${link.href}`}
                                    className={cn(
                                        'flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:text-foreground md:h-10 md:w-10',
                                        currentView === link.href ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                                    )}
                                >
                                    <link.icon className="h-5 w-5" />
                                    <span className="sr-only">{link.title}</span>
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                               <p>{link.title}</p>
                               {link.groupTitle !== link.title && <p className="text-xs text-muted-foreground">{link.groupTitle}</p>}
                            </TooltipContent>
                        </Tooltip>
                    )
                ))}
            </nav>
        </TooltipProvider>
    );
  }

  return (
    <nav className="flex flex-col gap-2 px-4">
       <Accordion type="multiple" defaultValue={defaultOpenAccordion ? [defaultOpenAccordion] : []} className="w-full">
        {menuItems.map((item) => (
          item.subItems ? (
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
          ) : (
             item.href && (
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
          )
        ))}
      </Accordion>
    </nav>
  );
}
