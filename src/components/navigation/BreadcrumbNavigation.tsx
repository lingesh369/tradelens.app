import React from 'react';
import { Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useNavigation } from '@/context/NavigationContext';

interface BreadcrumbNavigationProps {
  currentPageTitle: string;
  className?: string;
}

const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({ currentPageTitle, className }) => {
  const { navigationState } = useNavigation();

  // Default breadcrumb if no navigation state (remove Home)
  const defaultBreadcrumbs = [
    { label: 'Trades', href: '/trades' },
  ];

  const breadcrumbs = navigationState.breadcrumbs.length > 0 
    ? navigationState.breadcrumbs.filter(item => item.label !== 'Home') // Remove Home from any breadcrumb
    : defaultBreadcrumbs;

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList className="gap-1">
        {breadcrumbs.map((item, index) => (
          <React.Fragment key={index}>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={item.href} className="text-sm">
                  {item.label}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </React.Fragment>
        ))}
        <BreadcrumbItem>
          <BreadcrumbPage className="text-sm">{currentPageTitle}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export { BreadcrumbNavigation };
