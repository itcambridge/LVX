# LVX (Libertas Vox) Codebase Documentation

## Project Overview

LVX (Libertas Vox) is a mobile-first platform designed to empower working-class communities by providing a decentralized way to propose initiatives, donate tokens, connect skills, and reward contributors. The platform enables users to turn emotion into action, bypassing centralized control, and giving individuals direct agency over what gets funded and built.

The application follows a modern web architecture with a focus on mobile-first design, responsive UI, and a seamless user experience. It's built using Next.js with React, leveraging the App Router pattern for efficient page routing and component organization.

## Technology Stack

- **Frontend Framework**: Next.js 14 with App Router
- **UI Library**: React 18
- **Styling**: Tailwind CSS with custom theming
- **UI Components**: Custom components built on top of Radix UI primitives
- **State Management**: React Hooks (useState, useContext)
- **Form Handling**: React Hook Form with Zod validation
- **Data Visualization**: Recharts for charts and graphs
- **Theming**: Next-themes for light/dark mode support
- **Icons**: Lucide React for consistent iconography
- **Typography**: Geist font family

## Key Features

### 1. Project Discovery and Browsing

The platform provides a comprehensive project discovery experience through:

- **Home Feed**: A curated list of trending projects with filtering capabilities
- **Category Filtering**: Projects can be filtered by categories like Environment, Education, Community, Healthcare, etc.
- **Search Functionality**: Users can search for projects by title or description
- **Project Cards**: Each project is displayed as a card with key information including:
  - Project title and summary
  - Category
  - Funding progress
  - Creator information
  - Supporter count
  - Time remaining
  - Action buttons (Support, Like, Comment, Share)

Implementation files:
- `app/page.tsx`: Main home page with project listing
- `components/project-card.tsx`: Reusable project card component
- `components/category-filter.tsx`: Category filtering component

### 2. Project Creation

Users can create new projects through a multi-step wizard:

- **Step 1: Project Basics**
  - Title, summary, category, location
  - Funding goal and duration
  
- **Step 2: Project Details**
  - Detailed description
  - Project images
  - AI-enhanced description option
  
- **Step 3: Project Milestones**
  - Define key milestones with titles, descriptions, target dates, and budgets
  - AI-suggested milestones option
  
- **Step 4: Roles & Review**
  - Define roles needed for the project with skills, time commitment
  - AI-suggested roles option
  - Final review before launching

Implementation files:
- `app/create/page.tsx`: Project creation wizard

### 3. Project Details and Engagement

Detailed project pages provide comprehensive information and engagement options:

- **Project Overview**: Title, summary, description, creator info, location, end date
- **Funding Progress**: Current funding, goal, percentage funded, supporter count
- **Tabbed Content**:
  - About: Detailed description and milestones
  - Updates: Project updates from the creator
  - Roles: Roles needed for the project
  - Comments: Community discussion

Implementation files:
- `app/project/[id]/page.tsx`: Project detail page
- `components/comments-section.tsx`: Comments functionality
- `components/roles-needed.tsx`: Roles display component

### 4. Donations

The platform facilitates donations to projects through:

- **Donation Panel**: Multi-step donation process
  - Step 1: Select or enter donation amount and optional message
  - Step 2: Display project's treasury address for token transfer
  - Step 3: Confirmation and thank you message
- **Treasury Tracking**: Shows total donations, top donors, recent donations

Implementation files:
- `components/donation-panel.tsx`: Donation flow component

### 5. Skills & Staffing

Projects can define roles needed and users can apply their skills:

- **Role Definition**: Project creators can define roles with:
  - Title and description
  - Skills needed
  - Time commitment
  - Location
- **Role Applications**: Users can apply for roles that match their skills
- **Skill Listing**: Users can list their skills on their profiles

Implementation files:
- `components/roles-needed.tsx`: Roles display and application component

### 6. Voting & Governance

The platform includes a democratic governance system:

- **Active Polls**: Users can vote on platform features, policies, and governance
- **Poll Types**: Different types of polls (Platform Feature, Policy, Governance)
- **Voting Options**: Multiple choice voting with real-time results
- **Results Display**: Visual representation of voting results with progress bars
- **Completed Polls**: Archive of past polls with results

Implementation files:
- `app/vote/page.tsx`: Voting page with active and completed polls

### 7. User Profiles

Comprehensive user profiles showcase:

- **User Information**: Name, bio, avatar, location, join date, verification status
- **Skills & Expertise**: User skills displayed as badges
- **Impact Metrics**: Impact score and total donations
- **Tabbed Content**:
  - Overview: Stats and recent activity
  - Projects: Created and supported projects
  - Activity: Role applications and account settings

Implementation files:
- `app/profile/page.tsx`: User profile page

### 8. Navigation & Layout

The application features a mobile-first navigation system:

- **Bottom Navigation**: Mobile-friendly navigation with Home, Create, Vote, and Profile tabs
- **Responsive Layout**: Adapts to different screen sizes with a focus on mobile experience
- **Theme Support**: Light and dark mode support

Implementation files:
- `components/bottom-nav.tsx`: Bottom navigation component
- `components/theme-provider.tsx`: Theme provider for light/dark mode
- `app/layout.tsx`: Main layout component

## Component Structure

The codebase follows a well-organized component structure:

- **Page Components**: Located in the `app/` directory, following Next.js App Router convention
- **Reusable Components**: Located in the `components/` directory
  - **Feature Components**: Specific feature implementations like `project-card.tsx`, `donation-panel.tsx`
  - **UI Components**: Basic UI building blocks in `components/ui/` like buttons, cards, inputs
- **Hooks**: Custom React hooks in the `hooks/` directory
- **Utilities**: Helper functions in the `lib/` directory

## UI/UX Design

The UI design follows modern mobile-first principles:

- **Design System**: Consistent use of spacing, typography, and color
- **Component Library**: Built on Radix UI primitives for accessibility and consistency
- **Responsive Design**: Adapts to different screen sizes with a focus on mobile
- **Micro-interactions**: Subtle animations and transitions for a polished feel
- **Accessibility**: Semantic HTML, proper ARIA attributes, keyboard navigation

Key UI patterns include:
- Cards for content containers
- Badges for categories and statuses
- Progress bars for funding progress
- Tabs for organizing content
- Bottom navigation for mobile navigation

## Future Development

Based on the PRD (Product Requirements Document), future development plans include:

- **Automated Donation Confirmation**: Using blockchain indexers to automatically confirm donations
- **Milestone-based Escrow Payouts**: Smart contract integration for milestone-based fund releases
- **Reputation System**: For contributors to build trust and credibility
- **Quadratic Voting**: For more fair and democratic decision-making
- **In-app Notifications**: Real-time updates on project activities

## Testing the Application

To test the LVX application, follow these steps:

### Setting Up the Development Environment

1. **Clone the repository**:
   ```bash
   git clone [repository-url]
   cd LVX
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```
   Note: The project uses pnpm as the package manager (as indicated by the presence of pnpm-lock.yaml).

### Running the Development Server

1. **Start the development server**:
   ```bash
   pnpm dev
   ```

2. **Access the application**:
   Open your browser and navigate to `http://localhost:3000`

### Testing Key Features

1. **Project Discovery**:
   - Browse the home page to see project listings
   - Test the category filters
   - Use the search functionality to find specific projects

2. **Project Creation**:
   - Navigate to the Create page via the bottom navigation
   - Go through the multi-step wizard to create a new project
   - Test the AI suggestion features

3. **Project Details**:
   - Click on a project card to view its details
   - Test the different tabs (About, Updates, Roles, Comments)
   - Try the donation flow (without submitting actual transactions)

4. **Voting System**:
   - Navigate to the Vote page
   - Test voting on different polls
   - View completed polls and their results

5. **User Profile**:
   - Visit the Profile page
   - Test the different tabs (Overview, Projects, Activity)

### Testing Across Devices

Since this is a mobile-first application:
- Test on various mobile device sizes using browser developer tools
- Test on tablet and desktop views
- Verify that the responsive design works correctly across all breakpoints

### Automated Testing

While not explicitly included in the codebase we've examined, a production version of this application would likely include:

1. **Unit Tests**: Using Jest for testing individual components and functions
2. **Component Tests**: Using React Testing Library to test component rendering and interactions
3. **End-to-End Tests**: Using Cypress or Playwright to test complete user flows

To run these tests (if implemented):
```bash
# Run unit and component tests
pnpm test

# Run end-to-end tests
pnpm test:e2e
```

## Conclusion

The LVX platform represents a comprehensive solution for community-driven initiatives, combining modern web technologies with thoughtful UX design to create an accessible and powerful tool for social change. The codebase is well-structured, following best practices for component organization, state management, and responsive design.
