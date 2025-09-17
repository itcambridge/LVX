"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { supabase } from "@/lib/supabase"

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

  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-2 pb-2">
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
    </ScrollArea>
  )
}
