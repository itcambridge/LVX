"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Trash2, ArrowLeft, RefreshCw } from "lucide-react"
import Link from "next/link"

interface Project {
  id: string
  title: string
  created_at: string
  category: string
  fund_total: number
  fund_goal: number
  supporters: number
}

export default function AdminPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const [deleteStatus, setDeleteStatus] = useState<{ success: boolean; message: string } | null>(null)

  // Fetch projects
  const fetchProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      setDeleteStatus(null)

      const { data, error } = await supabase
        .from('projects')
        .select(`
          id,
          title,
          created_at,
          fund_total,
          fund_goal,
          supporters,
          categories(name)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Error fetching projects: ${error.message}`)
      }

      // Transform data to include category name
      const formattedProjects = data.map((project: any) => ({
        id: project.id,
        title: project.title,
        created_at: new Date(project.created_at).toLocaleString(),
        category: project.categories?.name || 'Uncategorized',
        fund_total: project.fund_total || 0,
        fund_goal: project.fund_goal || 0,
        supporters: project.supporters || 0
      }))

      setProjects(formattedProjects)
    } catch (err) {
      console.error('Error loading projects:', err)
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Load projects on component mount
  useEffect(() => {
    fetchProjects()
  }, [])

  // Handle delete confirmation
  const confirmDelete = (project: Project) => {
    setProjectToDelete(project)
    setDeleteDialogOpen(true)
  }

  // Delete project and all related data
  const deleteProject = async () => {
    if (!projectToDelete) return

    try {
      setLoading(true)
      setDeleteStatus(null)
      
      // Step 1: Delete project images
      const { error: imagesError } = await supabase
        .from('project_images')
        .delete()
        .eq('project_id', projectToDelete.id)
      
      if (imagesError) {
        console.error('Error deleting project images:', imagesError)
      }
      
      // Step 2: Delete project milestones
      const { error: milestonesError } = await supabase
        .from('project_milestones')
        .delete()
        .eq('project_id', projectToDelete.id)
      
      if (milestonesError) {
        console.error('Error deleting project milestones:', milestonesError)
      }
      
      // Step 3: Delete project updates
      const { error: updatesError } = await supabase
        .from('project_updates')
        .delete()
        .eq('project_id', projectToDelete.id)
      
      if (updatesError) {
        console.error('Error deleting project updates:', updatesError)
      }
      
      // Step 4: Get roles to delete role skills
      const { data: roles, error: rolesQueryError } = await supabase
        .from('roles')
        .select('id')
        .eq('project_id', projectToDelete.id)
      
      if (rolesQueryError) {
        console.error('Error querying roles:', rolesQueryError)
      } else if (roles && roles.length > 0) {
        // Delete role skills for each role
        for (const role of roles) {
          const { error: roleSkillsError } = await supabase
            .from('role_skills')
            .delete()
            .eq('role_id', role.id)
          
          if (roleSkillsError) {
            console.error(`Error deleting skills for role ${role.id}:`, roleSkillsError)
          }
        }
      }
      
      // Step 5: Delete roles
      const { error: rolesError } = await supabase
        .from('roles')
        .delete()
        .eq('project_id', projectToDelete.id)
      
      if (rolesError) {
        console.error('Error deleting roles:', rolesError)
      }
      
      // Step 6: Delete the project
      const { error: projectError } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectToDelete.id)
      
      if (projectError) {
        throw new Error(`Error deleting project: ${projectError.message}`)
      }
      
      // Success
      setDeleteStatus({
        success: true,
        message: `Project "${projectToDelete.title}" and all related data have been deleted.`
      })
      
      // Refresh the projects list
      fetchProjects()
    } catch (err) {
      console.error('Error deleting project:', err)
      setDeleteStatus({
        success: false,
        message: err instanceof Error ? err.message : 'An unknown error occurred'
      })
    } finally {
      setLoading(false)
      setDeleteDialogOpen(false)
      setProjectToDelete(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between px-4 py-3 max-w-5xl mx-auto">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-semibold">Admin Dashboard</h1>
          <Button variant="ghost" size="icon" onClick={fetchProjects} disabled={loading}>
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="px-4 max-w-5xl mx-auto py-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Project Management</CardTitle>
          </CardHeader>
          <CardContent>
            {deleteStatus && (
              <div className={`p-4 mb-4 rounded-md ${deleteStatus.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {deleteStatus.message}
              </div>
            )}

            {error && (
              <div className="p-4 mb-4 rounded-md bg-red-50 text-red-700 border border-red-200">
                {error}
              </div>
            )}

            {loading && !error ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading projects...</p>
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No projects found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Funding</TableHead>
                      <TableHead className="text-right">Supporters</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projects.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell className="font-medium">{project.title}</TableCell>
                        <TableCell>{project.category}</TableCell>
                        <TableCell>{project.created_at}</TableCell>
                        <TableCell className="text-right">${project.fund_total.toLocaleString()} / ${project.fund_goal.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{project.supporters}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => confirmDelete(project)}
                            className="gap-1"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Database Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              For more advanced database operations, use the SQL scripts provided or access the Supabase dashboard directly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="outline" asChild>
                <Link href="https://app.supabase.com/project/_/editor" target="_blank" rel="noopener noreferrer">
                  Open Supabase SQL Editor
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="https://app.supabase.com/project/_/database/tables" target="_blank" rel="noopener noreferrer">
                  Manage Database Tables
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the project "{projectToDelete?.title}" and all related data including images, milestones, updates, and roles.
              <br /><br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteProject} className="bg-red-600 hover:bg-red-700">
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
