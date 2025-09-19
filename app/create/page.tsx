"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, ArrowRight, Upload, Sparkles, Plus, X } from "lucide-react"
import Link from "next/link"

const CATEGORIES = [
  "Free Speech",
  "Immigration",
  "Culture",
  "Technology",
  "Law",
  "Politics",
  "Protest",
]

const SUGGESTED_SKILLS = [
  "Project Management",
  "Community Organizing",
  "Social Media",
  "Fundraising",
  "Event Planning",
  "Writing",
  "Design",
  "Photography",
  "Legal Aid",
  "Translation",
  "Teaching",
  "Healthcare",
  "Technology",
  "Marketing",
  "Accounting",
]

interface Milestone {
  id: string
  title: string
  description: string
  targetDate: string
  budget: string
}

interface Role {
  id: string
  title: string
  description: string
  skills: string[]
  timeCommitment: string
}

export default function CreateProjectPage() {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    description: "",
    category: "",
    location: "",
    fundingGoal: "",
    duration: "",
    images: [] as string[],
  })
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [aiSuggestions, setAiSuggestions] = useState({
    milestones: false,
    roles: false,
    pitch: false,
  })

  const handleNext = () => {
    if (step < 4) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleAiSuggestion = (type: "milestones" | "roles" | "pitch") => {
    setAiSuggestions((prev) => ({ ...prev, [type]: true }))

    // Mock AI suggestions - in real app would call AI API
    setTimeout(() => {
      if (type === "milestones") {
        const suggestedMilestones: Milestone[] = [
          {
            id: "1",
            title: "Project Planning & Permits",
            description: "Complete site surveys, obtain necessary permits, and finalize project plans",
            targetDate: "2024-03-01",
            budget: "2000",
          },
          {
            id: "2",
            title: "Equipment Procurement",
            description: "Purchase and transport all necessary equipment and materials to site",
            targetDate: "2024-03-15",
            budget: "15000",
          },
          {
            id: "3",
            title: "Implementation Phase",
            description: "Execute main project activities with community involvement",
            targetDate: "2024-04-30",
            budget: "8000",
          },
        ]
        setMilestones(suggestedMilestones)
      } else if (type === "roles") {
        const suggestedRoles: Role[] = [
          {
            id: "1",
            title: "Project Coordinator",
            description: "Oversee daily operations and coordinate with stakeholders",
            skills: ["Project Management", "Communication", "Leadership"],
            timeCommitment: "20 hours/week",
          },
          {
            id: "2",
            title: "Community Liaison",
            description: "Build relationships with local community and gather feedback",
            skills: ["Community Relations", "Local Language", "Cultural Awareness"],
            timeCommitment: "15 hours/week",
          },
        ]
        setRoles(suggestedRoles)
      } else if (type === "pitch") {
        setFormData((prev) => ({
          ...prev,
          description: `${prev.description}\n\nThis project addresses a critical need in our community by providing sustainable solutions that will have lasting impact. Our approach combines proven methodologies with community-driven implementation to ensure long-term success.\n\nKey benefits include:\n• Immediate positive impact on community wellbeing\n• Sustainable, long-term solutions\n• Local capacity building and skill development\n• Measurable outcomes and transparent reporting\n\nWith your support, we can create meaningful change that extends far beyond the initial project timeline.`,
        }))
      }
      setAiSuggestions((prev) => ({ ...prev, [type]: false }))
    }, 2000)
  }

  const addMilestone = () => {
    const newMilestone: Milestone = {
      id: Date.now().toString(),
      title: "",
      description: "",
      targetDate: "",
      budget: "",
    }
    setMilestones([...milestones, newMilestone])
  }

  const updateMilestone = (id: string, field: keyof Milestone, value: string) => {
    setMilestones(milestones.map((m) => (m.id === id ? { ...m, [field]: value } : m)))
  }

  const removeMilestone = (id: string) => {
    setMilestones(milestones.filter((m) => m.id !== id))
  }

  const addRole = () => {
    const newRole: Role = {
      id: Date.now().toString(),
      title: "",
      description: "",
      skills: [],
      timeCommitment: "",
    }
    setRoles([...roles, newRole])
  }

  const updateRole = (id: string, field: keyof Role, value: string | string[]) => {
    setRoles(roles.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
  }

  const removeRole = (id: string) => {
    setRoles(roles.filter((r) => r.id !== id))
  }

const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  if (!files || files.length === 0) return;
  
  setIsUploading(true);
  
  try {
    const uploadedUrls: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `project-images/${fileName}`;
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('projects')
        .upload(filePath, file);
      
      if (uploadError) {
        console.error("Error uploading image:", uploadError);
        continue;
      }
      
      // Get the public URL
      const { data } = supabase.storage
        .from('projects')
        .getPublicUrl(filePath);
      
      if (data?.publicUrl) {
        uploadedUrls.push(data.publicUrl);
      }
    }
    
    // Update form data with new images
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...uploadedUrls]
    }));
    
    // Clear the input
    e.target.value = '';
    
  } catch (error) {
    console.error("Error handling image upload:", error);
  } finally {
    setIsUploading(false);
  }
};

const removeImage = (index: number) => {
  setFormData(prev => ({
    ...prev,
    images: prev.images.filter((_, i) => i !== index)
  }));
};

const handleSubmit = async () => {
  try {
    // Show loading state
    setIsSubmitting(true);
    
    console.log("Creating project:", { formData, milestones, roles });
    
    // 1. Insert the project into the projects table
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .insert({
        title: formData.title,
        summary: formData.summary,
        description: formData.description,
        category_id: await getCategoryId(formData.category),
        fund_goal: parseFloat(formData.fundingGoal) || 0,
        fund_total: 0, // Starting with 0 funds
        supporters: 0, // Starting with 0 supporters
        location: formData.location,
        start_date: new Date().toISOString(),
        end_date: getEndDate(formData.duration),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single();
    
    if (projectError) {
      throw new Error(`Error creating project: ${projectError.message}`);
    }
    
    const projectId = projectData.id;
    console.log("Project created with ID:", projectId);
    
    // 2. Insert milestones
    if (milestones.length > 0) {
      const milestonesData = milestones.map((milestone, index) => ({
        project_id: projectId,
        title: milestone.title,
        description: milestone.description,
        target_date: milestone.targetDate || null,
        budget: parseFloat(milestone.budget) || null,
        completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      
      const { error: milestonesError } = await supabase
        .from('project_milestones')
        .insert(milestonesData);
      
      if (milestonesError) {
        console.error("Error creating milestones:", milestonesError);
      }
    }
    
    // 3. Insert roles
    if (roles.length > 0) {
      const rolesData = roles.map((role) => ({
        project_id: projectId,
        title: role.title,
        description: role.description,
        time_commitment: role.timeCommitment,
        filled: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      
      const { data: rolesInsertData, error: rolesError } = await supabase
        .from('roles')
        .insert(rolesData)
        .select('id');
      
      if (rolesError) {
        console.error("Error creating roles:", rolesError);
      } else if (rolesInsertData) {
        // 4. Insert role skills
        for (let i = 0; i < roles.length; i++) {
          if (roles[i].skills.length > 0 && rolesInsertData[i]) {
            const roleId = rolesInsertData[i].id;
            
            // For each skill, first ensure it exists in the skills table
            for (const skillName of roles[i].skills) {
              // Check if skill exists
              const { data: existingSkill } = await supabase
                .from('skills')
                .select('id')
                .eq('name', skillName)
                .single();
              
              let skillId;
              
              if (!existingSkill) {
                // Create the skill
                const { data: newSkill, error: skillError } = await supabase
                  .from('skills')
                  .insert({ name: skillName, created_at: new Date().toISOString() })
                  .select('id')
                  .single();
                
                if (skillError) {
                  console.error(`Error creating skill ${skillName}:`, skillError);
                  continue;
                }
                
                skillId = newSkill.id;
              } else {
                skillId = existingSkill.id;
              }
              
              // Link skill to role
              const { error: roleSkillError } = await supabase
                .from('role_skills')
                .insert({
                  role_id: roleId,
                  skill_id: skillId,
                  created_at: new Date().toISOString()
                });
              
              if (roleSkillError) {
                console.error(`Error linking skill ${skillName} to role:`, roleSkillError);
              }
            }
          }
        }
      }
    }
    
    // 5. Handle project images
    if (formData.images.length > 0) {
      const projectImagesData = formData.images.map((imageUrl, index) => ({
        project_id: projectId,
        image_url: imageUrl,
        display_order: index,
        created_at: new Date().toISOString()
      }));
      
      const { error: imagesError } = await supabase
        .from('project_images')
        .insert(projectImagesData);
      
      if (imagesError) {
        console.error("Error saving project images:", imagesError);
      }
    }
    
    // Success! Redirect to the project page or home page
    window.location.href = `/project/${projectId}`;
    
  } catch (error) {
    console.error("Error submitting project:", error);
    setSubmitError("Failed to create project. Please try again.");
  } finally {
    setIsSubmitting(false);
  }
};

// Helper function to get or create a category ID
const getCategoryId = async (categoryName: string): Promise<string | null> => {
  if (!categoryName) return null;
  
  // Check if category exists
  const { data: existingCategory } = await supabase
    .from('categories')
    .select('id')
    .eq('name', categoryName)
    .single();
  
  if (existingCategory) {
    return existingCategory.id;
  }
  
  // Create new category
  const { data: newCategory, error } = await supabase
    .from('categories')
    .insert({ 
      name: categoryName, 
      count: 1,
      created_at: new Date().toISOString() 
    })
    .select('id')
    .single();
  
  if (error) {
    console.error("Error creating category:", error);
    return null;
  }
  
  return newCategory.id;
};

// Helper function to calculate end date from duration string
const getEndDate = (duration: string): string | null => {
  if (!duration) return null;
  
  const now = new Date();
  
  // Try to parse the duration (e.g., "3 months", "2 weeks", "1 year")
  const match = duration.match(/(\d+)\s*(day|days|week|weeks|month|months|year|years)/i);
  
  if (match) {
    const amount = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    
    if (unit.startsWith('day')) {
      now.setDate(now.getDate() + amount);
    } else if (unit.startsWith('week')) {
      now.setDate(now.getDate() + (amount * 7));
    } else if (unit.startsWith('month')) {
      now.setMonth(now.getMonth() + amount);
    } else if (unit.startsWith('year')) {
      now.setFullYear(now.getFullYear() + amount);
    }
  } else {
    // Default to 3 months if we can't parse
    now.setMonth(now.getMonth() + 3);
  }
  
  return now.toISOString();
};

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between px-4 py-3 max-w-md mx-auto">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-semibold">Create Project</h1>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </div>

      <div className="px-4 max-w-md mx-auto pb-6">
        {/* Progress Indicator */}
        <div className="flex items-center gap-2 my-6">
          {[1, 2, 3, 4].map((stepNumber) => (
            <div key={stepNumber} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  stepNumber <= step ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {stepNumber}
              </div>
              {stepNumber < 4 && (
                <div className={`flex-1 h-1 rounded ${stepNumber < step ? "bg-accent" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Basic Information */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Project Basics</CardTitle>
              <p className="text-sm text-muted-foreground">Tell us about your project idea</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Project Title</Label>
                <Input
                  id="title"
                  placeholder="Give your project a compelling name"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="summary">One-Line Summary</Label>
                <Input
                  id="summary"
                  placeholder="Describe your project in one compelling sentence"
                  value={formData.summary}
                  onChange={(e) => setFormData((prev) => ({ ...prev, summary: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="Where will this project take place?"
                  value={formData.location}
                  onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fundingGoal">Funding Goal ($)</Label>
                  <Input
                    id="fundingGoal"
                    type="number"
                    placeholder="25000"
                    value={formData.fundingGoal}
                    onChange={(e) => setFormData((prev) => ({ ...prev, fundingGoal: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration</Label>
                  <Input
                    id="duration"
                    placeholder="3 months"
                    value={formData.duration}
                    onChange={(e) => setFormData((prev) => ({ ...prev, duration: e.target.value }))}
                  />
                </div>
              </div>

              <Button onClick={handleNext} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Detailed Description */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
              <p className="text-sm text-muted-foreground">Provide a comprehensive description of your project</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description">Project Description</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAiSuggestion("pitch")}
                    disabled={aiSuggestions.pitch}
                    className="gap-2 text-xs"
                  >
                    <Sparkles className="h-3 w-3" />
                    {aiSuggestions.pitch ? "Generating..." : "AI Enhance"}
                  </Button>
                </div>
                <Textarea
                  id="description"
                  placeholder="Describe your project in detail. What problem does it solve? How will you approach it? What impact will it have?"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={8}
                />
              </div>

                <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Project Images</Label>
                  <span className="text-xs text-muted-foreground">1920×1080 pixels</span>
                </div>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">Upload project images</p>
                  <div className="flex flex-col items-center gap-2">
                    <input
                      type="file"
                      id="image-upload"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => document.getElementById('image-upload')?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? "Uploading..." : "Choose Files"}
                    </Button>
                    
                    {formData.images.length > 0 && (
                      <div className="mt-4 w-full">
                        <p className="text-sm font-medium mb-2">Selected Images ({formData.images.length})</p>
                        <div className="grid grid-cols-3 gap-2">
                          {formData.images.map((image, index) => (
                            <div key={index} className="relative group">
                              <img 
                                src={image} 
                                alt={`Project image ${index + 1}`} 
                                className="w-full h-16 object-cover rounded-md"
                              />
                              <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeImage(index)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleBack} className="flex-1 bg-transparent">
                  Back
                </Button>
                <Button onClick={handleNext} className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground">
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Milestones */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Project Milestones</CardTitle>
              <p className="text-sm text-muted-foreground">Break your project into key milestones</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Milestones ({milestones.length})</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAiSuggestion("milestones")}
                  disabled={aiSuggestions.milestones}
                  className="gap-2"
                >
                  <Sparkles className="h-3 w-3" />
                  {aiSuggestions.milestones ? "Generating..." : "AI Suggest"}
                </Button>
              </div>

              <div className="space-y-3">
                {milestones.map((milestone) => (
                  <Card key={milestone.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Input
                          placeholder="Milestone title"
                          value={milestone.title}
                          onChange={(e) => updateMilestone(milestone.id, "title", e.target.value)}
                          className="flex-1 mr-2"
                        />
                        <Button variant="ghost" size="icon" onClick={() => removeMilestone(milestone.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <Textarea
                        placeholder="Describe this milestone"
                        value={milestone.description}
                        onChange={(e) => updateMilestone(milestone.id, "description", e.target.value)}
                        rows={2}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Target Date</Label>
                          <Input
                            type="date"
                            value={milestone.targetDate}
                            onChange={(e) => updateMilestone(milestone.id, "targetDate", e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Budget ($)</Label>
                          <Input
                            type="number"
                            placeholder="5000"
                            value={milestone.budget}
                            onChange={(e) => updateMilestone(milestone.id, "budget", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <Button variant="outline" onClick={addMilestone} className="w-full gap-2 bg-transparent">
                <Plus className="h-4 w-4" />
                Add Milestone
              </Button>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleBack} className="flex-1 bg-transparent">
                  Back
                </Button>
                <Button onClick={handleNext} className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground">
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Roles & Review */}
        {step === 4 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Roles Needed</CardTitle>
                <p className="text-sm text-muted-foreground">What help do you need to make this project successful?</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Volunteer Roles ({roles.length})</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAiSuggestion("roles")}
                    disabled={aiSuggestions.roles}
                    className="gap-2"
                  >
                    <Sparkles className="h-3 w-3" />
                    {aiSuggestions.roles ? "Generating..." : "AI Suggest"}
                  </Button>
                </div>

                <div className="space-y-3">
                  {roles.map((role) => (
                    <Card key={role.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Input
                            placeholder="Role title"
                            value={role.title}
                            onChange={(e) => updateRole(role.id, "title", e.target.value)}
                            className="flex-1 mr-2"
                          />
                          <Button variant="ghost" size="icon" onClick={() => removeRole(role.id)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <Textarea
                          placeholder="Describe this role and responsibilities"
                          value={role.description}
                          onChange={(e) => updateRole(role.id, "description", e.target.value)}
                          rows={2}
                        />
                        <div className="space-y-2">
                          <Label className="text-xs">Skills Needed</Label>
                          <div className="flex flex-wrap gap-1">
                            {SUGGESTED_SKILLS.map((skill) => (
                              <Badge
                                key={skill}
                                variant={role.skills.includes(skill) ? "default" : "outline"}
                                className={`cursor-pointer text-xs ${
                                  role.skills.includes(skill) ? "bg-accent text-accent-foreground" : ""
                                }`}
                                onClick={() => {
                                  const newSkills = role.skills.includes(skill)
                                    ? role.skills.filter((s) => s !== skill)
                                    : [...role.skills, skill]
                                  updateRole(role.id, "skills", newSkills)
                                }}
                              >
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Input
                          placeholder="Time commitment (e.g., 10 hours/week)"
                          value={role.timeCommitment}
                          onChange={(e) => updateRole(role.id, "timeCommitment", e.target.value)}
                        />
                      </div>
                    </Card>
                  ))}
                </div>

                <Button variant="outline" onClick={addRole} className="w-full gap-2 bg-transparent">
                  <Plus className="h-4 w-4" />
                  Add Role
                </Button>
              </CardContent>
            </Card>

            {/* Review & Submit */}
            <Card className="bg-accent/5 border-accent/20">
              <CardHeader>
                <CardTitle className="text-accent">Ready to Launch?</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Review your project details and launch it to the FreeSpeech.Live community
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Project:</span>
                    <span className="font-medium">{formData.title || "Untitled Project"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category:</span>
                    <span>{formData.category || "Not selected"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Funding Goal:</span>
                    <span>${formData.fundingGoal || "0"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Milestones:</span>
                    <span>{milestones.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Roles:</span>
                    <span>{roles.length}</span>
                  </div>
                </div>

              <div className="space-y-2">
                {submitError && (
                  <div className="text-red-500 text-sm p-2 bg-red-50 rounded border border-red-200">
                    {submitError}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleBack} className="flex-1 bg-transparent" disabled={isSubmitting}>
                    Back
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Creating Project..." : "Launch Project"}
                  </Button>
                </div>
              </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
