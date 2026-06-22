import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  current?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ 
  items, 
  className,
  showHome = true 
}) => {
  const navigate = useNavigate();

  const allItems = showHome 
    ? [{ label: 'Dashboard', href: '/teacher/dashboard', icon: <Home className="h-4 w-4" /> }, ...items]
    : items;

  return (
    <nav 
      className={cn("flex items-center space-x-1 text-sm text-muted-foreground", className)}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center space-x-1">
        {allItems.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground/50" />
            )}
            
            {item.current || !item.href ? (
              <span 
                className={cn(
                  "flex items-center gap-1 font-medium",
                  item.current ? "text-foreground" : "text-muted-foreground"
                )}
                aria-current={item.current ? "page" : undefined}
              >
                {item.icon}
                {item.label}
              </span>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-1 text-muted-foreground hover:text-foreground"
                onClick={() => navigate(item.href!)}
              >
                <span className="flex items-center gap-1">
                  {item.icon}
                  {item.label}
                </span>
              </Button>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
