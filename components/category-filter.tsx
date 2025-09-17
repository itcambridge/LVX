"use client"

import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

const CATEGORIES = [
  { id: "all", label: "All Projects", count: 1247 },
  { id: "environment", label: "Environment", count: 234 },
  { id: "education", label: "Education", count: 189 },
  { id: "community", label: "Community", count: 156 },
  { id: "healthcare", label: "Healthcare", count: 143 },
  { id: "justice", label: "Social Justice", count: 198 },
  { id: "technology", label: "Technology", count: 87 },
  { id: "arts", label: "Arts & Culture", count: 92 },
]

interface CategoryFilterProps {
  selectedCategory: string
  onCategoryChange: (category: string) => void
}

export function CategoryFilter({ selectedCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-2 pb-2">
        {CATEGORIES.map((category) => (
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
