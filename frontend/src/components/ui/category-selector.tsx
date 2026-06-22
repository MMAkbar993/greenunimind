import React, { useState, useEffect, useMemo } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useGetAllCategoriesWithSubcategoriesQuery } from '@/redux/features/category/categoryApi';

interface CategorySelectorProps {
  selectedCategoryId?: string;
  selectedSubcategoryId?: string;
  onCategoryChange: (categoryId: string) => void;
  onSubcategoryChange: (subcategoryId: string) => void;
  error?: string;
  className?: string;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedCategoryId,
  selectedSubcategoryId,
  onCategoryChange,
  onSubcategoryChange,
  error,
  className,
}) => {
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [subcategoryOpen, setSubcategoryOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [subcategorySearch, setSubcategorySearch] = useState('');

  const { data: categoriesData, isLoading } = useGetAllCategoriesWithSubcategoriesQuery();
  const categories = categoriesData?.data || [];

  const selectedCategory = useMemo(() => 
    categories.find(cat => cat._id === selectedCategoryId),
    [categories, selectedCategoryId]
  );

  const availableSubcategories = useMemo(() => 
    selectedCategory?.subcategories || [],
    [selectedCategory]
  );

  const selectedSubcategory = useMemo(() => 
    availableSubcategories.find(sub => sub._id === selectedSubcategoryId),
    [availableSubcategories, selectedSubcategoryId]
  );

  const filteredCategories = useMemo(() =>
    categories.filter(category => {
      const searchTerm = categorySearch.toLowerCase();
      return category.name.toLowerCase().includes(searchTerm) ||
             (category.description && category.description.toLowerCase().includes(searchTerm));
    }),
    [categories, categorySearch]
  );

  const filteredSubcategories = useMemo(() =>
    availableSubcategories.filter(subcategory => {
      const searchTerm = subcategorySearch.toLowerCase();
      return subcategory.name.toLowerCase().includes(searchTerm) ||
             (subcategory.description && subcategory.description.toLowerCase().includes(searchTerm));
    }),
    [availableSubcategories, subcategorySearch]
  );

  useEffect(() => {
    if (selectedCategoryId && !availableSubcategories.some(sub => sub._id === selectedSubcategoryId)) {
      onSubcategoryChange('');
    }
  }, [selectedCategoryId, availableSubcategories, selectedSubcategoryId, onSubcategoryChange]);

  const handleCategorySelect = (categoryId: string) => {
    onCategoryChange(categoryId);
    onSubcategoryChange('');
    setCategoryOpen(false);
    setCategorySearch('');
  };

  const handleSubcategorySelect = (subcategoryId: string) => {
    onSubcategoryChange(subcategoryId);
    setSubcategoryOpen(false);
    setSubcategorySearch('');
  };

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3 sm:space-y-4', className)}>
      <div className="space-y-2">
        <label className="text-sm sm:text-base font-medium text-gray-700">Category*</label>
        
        <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={categoryOpen}
              className={cn(
                'w-full justify-between h-10 sm:h-12 text-sm sm:text-base',
                !selectedCategory && 'text-muted-foreground',
                error && 'border-red-500'
              )}
            >
              <div className="flex items-center gap-2">
                {selectedCategory?.icon && (
                  <span className="text-lg">{selectedCategory.icon}</span>
                )}
                {selectedCategory ? selectedCategory.name : 'Select a course category...'}
              </div>
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput
                placeholder="Search categories..."
                value={categorySearch}
                onValueChange={setCategorySearch}
              />
              <CommandEmpty>No category found.</CommandEmpty>
              <CommandGroup className="max-h-64 overflow-auto">
                {filteredCategories.map((category) => (
                  <CommandItem
                    key={category._id}
                    value={category._id}
                    onSelect={() => handleCategorySelect(category._id)}
                    className="flex items-center gap-2"
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        selectedCategoryId === category._id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {category.icon && (
                      <span className="text-lg">{category.icon}</span>
                    )}
                    <div>
                      <div className="font-medium">{category.name}</div>
                      {category.description && (
                        <div className="text-xs text-muted-foreground">
                          {category.description}
                        </div>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <label className="text-sm sm:text-base font-medium text-gray-700">Subcategory*</label>
        <Popover open={subcategoryOpen} onOpenChange={setSubcategoryOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={subcategoryOpen}
              disabled={!selectedCategoryId || availableSubcategories.length === 0}
              className={cn(
                'w-full justify-between h-10 sm:h-12 text-sm sm:text-base',
                !selectedSubcategory && 'text-muted-foreground',
                error && 'border-red-500'
              )}
            >
              {selectedSubcategory ? selectedSubcategory.name : 'Select a subcategory...'}
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput
                placeholder="Search subcategories..."
                value={subcategorySearch}
                onValueChange={setSubcategorySearch}
              />
              <CommandEmpty>No subcategory found.</CommandEmpty>
              <CommandGroup className="max-h-64 overflow-auto">
                {filteredSubcategories.map((subcategory) => (
                  <CommandItem
                    key={subcategory._id}
                    value={subcategory._id}
                    onSelect={() => handleSubcategorySelect(subcategory._id)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        selectedSubcategoryId === subcategory._id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div>
                      <div className="font-medium">{subcategory.name}</div>
                      {subcategory.description && (
                        <div className="text-xs text-muted-foreground">
                          {subcategory.description}
                        </div>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {error && <p className="text-xs sm:text-sm text-red-600">{error}</p>}
    </div>
  );
};
