import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, Users } from "lucide-react"

// Mock roles data
const rolesNeeded = [
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
  projectId: number
}

export function RolesNeeded({ projectId }: RolesNeededProps) {
  return (
    <div className="space-y-4">
      <div className="text-center py-4">
        <h3 className="font-semibold mb-2">Help Make This Happen</h3>
        <p className="text-sm text-muted-foreground text-balance">
          We need skilled volunteers to ensure project success. Apply for roles that match your expertise.
        </p>
      </div>

      {rolesNeeded.map((role) => (
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
              disabled={role.filled}
            >
              {role.filled ? "Position Filled" : "Apply for This Role"}
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
