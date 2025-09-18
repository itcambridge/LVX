"use client"

import { useState, useEffect, useRef } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { supabase } from "@/lib/supabase"
import { ChevronLeft, ChevronRight } from "lucide-react"

// Default category for "All Projects"
const ALL_CATEGORY = { id: "all", label: "All Projects", count: 0 }

// Interface for category data
interface Category {
  id: string;
  label: string;
  count: number;
}

interface CategoryFilterProps {
  selectedCategory: string
  onCategoryChange: (category: string) => void
}

export function CategoryFilter({ selectedCategory, onCategoryChange }: CategoryFilterProps) {
  const [categories, setCategories] = useState<Category[]>([ALL_CATEGORY])
  const [loading, setLoading] = useState(true)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Fetch categories from Supabase
  useEffect(() => {
    async function fetchCategories() {
      try {
        // First try to get categories with count
        try {
          const { data, error } = await supabase
            .from('categories')
            .select('id, name, count')
            .order('count', { ascending: false });

          if (error) {
            throw error;
          }

          // Transform the data to match our Category interface
          const transformedCategories = data.map((category: any) => ({
            id: category.name.toLowerCase(),
            label: category.name,
            count: category.count || 0
          }));

          // Update the "All Projects" count to be the sum of all other categories
          const totalCount = transformedCategories.reduce((sum: number, category: Category) => sum + category.count, 0);
          const allWithCount = { ...ALL_CATEGORY, count: totalCount };

          // Set the categories with "All Projects" at the beginning
          setCategories([allWithCount, ...transformedCategories]);
          return;
        } catch (categoryError) {
          console.error('Error fetching categories with count:', categoryError);
          console.log('Falling back to fetching categories without count');
        }

        // Fallback: Just get categories without count
        const { data, error } = await supabase
          .from('categories')
          .select('id, name');

        if (error) {
          console.error('Error fetching categories:', error);
          return;
        }

        // Transform the data to match our Category interface
        const transformedCategories = data.map((category: any) => ({
          id: category.name.toLowerCase(),
          label: category.name,
          count: 0 // Default count
        }));

        // Set the categories with "All Projects" at the beginning
        setCategories([ALL_CATEGORY, ...transformedCategories]);
      } catch (error) {
        console.error('Error in fetchCategories:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  // Check if scroll is possible and in which directions
  const checkScroll = () => {
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      setCanScrollLeft(scrollElement.scrollLeft > 0);
      setCanScrollRight(
        scrollElement.scrollLeft < scrollElement.scrollWidth - scrollElement.clientWidth - 2 // 2px buffer for rounding errors
      );
    }
  };

  // Scroll left or right by a fixed amount
  const scroll = (direction: 'left' | 'right') => {
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      const scrollAmount = scrollElement.clientWidth * 0.6; // Scroll by 60% of visible width
      const newPosition = direction === 'left' 
        ? scrollElement.scrollLeft - scrollAmount 
        : scrollElement.scrollLeft + scrollAmount;
      
      scrollElement.scrollTo({
        left: newPosition,
        behavior: 'smooth'
      });
    }
  };

  // Add scroll event listener to update button states
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      checkScroll();
      scrollElement.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      
      return () => {
        scrollElement.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [categories]); // Re-run when categories change

  return (
    <div className="relative w-full">
      {/* Left scroll button */}
      {canScrollLeft && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 h-8 w-8 bg-background/80 backdrop-blur-sm shadow-sm"
          onClick={() => scroll('left')}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}
      
      {/* Right scroll button */}
      {canScrollRight && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 h-8 w-8 bg-background/80 backdrop-blur-sm shadow-sm"
          onClick={() => scroll('right')}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
      
      <div 
        ref={scrollRef}
        className="flex gap-2 pb-2 overflow-x-auto scrollbar-hide px-1 py-1 scroll-smooth"
        style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
        onScroll={checkScroll}
      >
        {categories.map((category) => (
          <Badge
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            className={`cursor-pointer transition-colors shrink-0 ${
              selectedCategory === category.id
                ? "bg-accent text-accent-foreground hover:bg-accent/90"
                : "hover:bg-muted"
            }`}
            onClick={() => onCategoryChange(category.id)}
          >
            {category.label}
            <span className="ml-1 text-xs opacity-75">({category.count})</span>
          </Badge>
        ))}
      </div>
      
      <style jsx>{`
        /* Hide scrollbar for Chrome, Safari and Opera */
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}
