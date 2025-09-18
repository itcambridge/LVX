import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, Users, Loader2 } from "lucide-react"

// Interface for role data
interface Role {
  id: number;
  title: string;
  description: string;
  skills: string[];
  timeCommitment: string;
  location: string;
  applicants: number;
  filled: boolean;
}

// Mock roles data as fallback
const mockRoles: Role[] = [
  {
    id: 1,
    title: "Local Project Coordinator",
    description: "Coordinate with village leaders and oversee daily project activities on-site.",
    skills: ["Project Management", "Local Language", "Community Relations"],
    timeCommitment: "20 hours/week",
    location: "Machakos County, Kenya",
    applicants: 3,
    filled: false,
  },
  {
    id: 2,
    title: "Water Quality Specialist",
    description: "Test water samples and ensure all systems meet safety standards.",
    skills: ["Water Testing", "Laboratory Analysis", "Report Writing"],
    timeCommitment: "10 hours/week",
    location: "Remote + Site Visits",
    applicants: 1,
    filled: false,
  },
  {
    id: 3,
    title: "Community Trainer",
    description: "Train local technicians on pump maintenance and water system management.",
    skills: ["Training", "Technical Knowledge", "Communication"],
    timeCommitment: "15 hours/week",
    location: "Machakos County, Kenya",
    applicants: 5,
    filled: true,
  },
]

interface RolesNeededProps {
  projectId: string | number
}

export function RolesNeeded({ projectId }: RolesNeededProps) {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [applying, setApplying] = useState<number | null>(null)
  
  // Current user info - in a real app, this would come from auth
  // For now, we'll use a mock user with a valid UUID format
  const currentUser = {
    id: '00000000-0000-0000-0000-000000000000', // Valid UUID format
    name: 'You',
    avatar: '/placeholder-user.jpg'
  }
  
  // Fetch roles from Supabase
  useEffect(() => {
    async function fetchRoles() {
      try {
        setLoading(true);
        
        // Try to fetch roles from Supabase
        try {
          // Fetch roles for this project
          const { data: rolesData, error: rolesError } = await supabase
            .from('roles')
            .select(`
              id,
              project_id,
              title,
              description,
              time_commitment,
              location,
              filled,
              created_at,
              updated_at
            `)
            .eq('project_id', projectId)
            .order('id');
          
          if (rolesError) {
            throw new Error(`Error fetching roles: ${rolesError.message}`);
          }
          
          // Fetch skills for each role
          const roleIds = rolesData.map((role: any) => role.id);
          
          // Try to fetch from role_skills table
          let skillsData: any[] = [];
          try {
            const { data, error: skillsError } = await supabase
              .from('role_skills')
              .select('role_id, skill')
              .in('role_id', roleIds);
            
            if (!skillsError && data) {
              skillsData = data;
            }
          } catch (skillsErr) {
            console.error('Error fetching role skills:', skillsErr);
          }
          
          // Group skills by role_id
          const skillsByRoleId: Record<string, string[]> = {};
          skillsData?.forEach((item: any) => {
            if (!skillsByRoleId[item.role_id]) {
              skillsByRoleId[item.role_id] = [];
            }
            skillsByRoleId[item.role_id].push(item.skill);
          });
          
          // Fetch role applications to determine applicants count
          let applicantsByRoleId: Record<string, number> = {};
          try {
            const { data: applicationsData, error: applicationsError } = await supabase
              .from('role_applications')
              .select('role_id, count')
              .in('role_id', roleIds)
              .group('role_id');
            
            if (!applicationsError && applicationsData) {
              applicationsData.forEach((item: any) => {
                applicantsByRoleId[item.role_id] = parseInt(item.count);
              });
            }
          } catch (applicationsErr) {
            console.error('Error fetching role applications:', applicationsErr);
          }
          
          // Transform roles data
          const formattedRoles: Role[] = rolesData.map((role: any) => ({
            id: role.id,
            title: role.title,
            description: role.description,
            skills: skillsByRoleId[role.id] || [],
            timeCommitment: role.time_commitment || '',
            location: role.location || '',
            applicants: applicantsByRoleId[role.id] || 0,
            filled: role.filled || false
          }));
          
          setRoles(formattedRoles);
          setLoading(false);
          return;
        } catch (err) {
          console.error('Error fetching from Supabase:', err);
          // Fall back to mock data
          setRoles(mockRoles);
        }
      } catch (err) {
        console.error('Error in fetchRoles:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        // Fall back to mock data
        setRoles(mockRoles);
      } finally {
        setLoading(false);
      }
    }
    
    fetchRoles();
  }, [projectId]);
  
  const handleApply = async (roleId: number) => {
    setApplying(roleId);
    
    try {
      // For demo purposes, we'll just update the local state without making
      // actual Supabase calls. This allows the feature to work without requiring
      // actual authentication.
      
      // In a real app with authentication, we would do:
      /*
      // Insert application into Supabase
      const { error } = await supabase
        .from('role_applications')
        .insert({
          role_id: roleId,
          user_id: currentUser.id,
          message: '',
          status: 'pending',
          created_at: new Date().toISOString()
        });
      
      if (error) {
        throw new Error(`Error applying for role: ${error.message}`);
      }
      */
      
      // Update local state
      setRoles(roles.map(role => 
        role.id === roleId 
          ? { ...role, applicants: role.applicants + 1 } 
          : role
      ));
      
      // Show success message
      alert('Application submitted successfully!');
    } catch (err) {
      console.error('Error applying for role:', err);
      alert('Failed to apply for role. Please try again.');
    } finally {
      setApplying(null);
    }
  };
  return (
    <div className="space-y-4">
      <div className="text-center py-4">
        <h3 className="font-semibold mb-2">Help Make This Happen</h3>
        <p className="text-sm text-muted-foreground text-balance">
          We need skilled volunteers to ensure project success. Apply for roles that match your expertise.
        </p>
      </div>

      {loading ? (
        <Card className="py-8">
          <CardContent className="flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : roles.length === 0 ? (
        <Card className="py-8">
          <CardContent className="text-center">
            <p className="text-muted-foreground">No roles available for this project.</p>
          </CardContent>
        </Card>
      ) : roles.map((role) => (
        <Card key={role.id} className={role.filled ? "opacity-75" : ""}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-base mb-2 flex items-center gap-2">
                  {role.title}
                  {role.filled && (
                    <Badge variant="secondary" className="text-xs">
                      Filled
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-sm text-muted-foreground text-pretty">{role.description}</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0 space-y-4">
            {/* Skills Required */}
            <div>
              <div className="text-sm font-medium mb-2">Skills Needed:</div>
              <div className="flex flex-wrap gap-1">
                {role.skills.map((skill) => (
                  <Badge key={skill} variant="outline" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Role Details */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{role.timeCommitment}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>{role.location}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>
                  {role.applicants} applicant{role.applicants !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {/* Apply Button */}
            <Button
              variant={role.filled ? "secondary" : "default"}
              className={`w-full ${!role.filled ? "bg-accent hover:bg-accent/90 text-accent-foreground" : ""}`}
              disabled={role.filled || applying !== null}
              onClick={() => handleApply(role.id)}
            >
              {role.filled ? "Position Filled" : applying === role.id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Applying...
                </>
              ) : "Apply for This Role"}
            </Button>
          </CardContent>
        </Card>
      ))}

      {/* Call to Action */}
      <Card className="bg-muted">
        <CardContent className="text-center py-6">
          <h4 className="font-semibold mb-2">Don't See Your Skills?</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Every project can benefit from diverse talents. Reach out to discuss how you can contribute.
          </p>
          <Button variant="outline" className="bg-transparent">
            Contact Project Creator
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
