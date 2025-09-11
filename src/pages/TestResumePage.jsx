import ResumeViewer from '../components/resume-viewer/ResumeViewer';
import FloatingEditButton from '../components/common/FloatingEditButton';
import { useEditMode } from '../contexts/EditModeContext';

function TestResumePage() {
  const { isEditMode } = useEditMode();
  const testData = {
    personal_information: {
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "555-0123",
      profiles: {
        linkedin: "https://linkedin.com/in/johndoe",
        github: "https://github.com/johndoe",
        website: "https://johndoe.com",
        portfolio: "https://portfolio.johndoe.com",
        scholar: "https://scholar.google.com/citations?user=johndoe",
        orcid: "https://orcid.org/0000-0000-0000-0000",
        other: [
          { label: "Twitter", url: "https://twitter.com/johndoe" },
          { label: "Stack Overflow", url: "https://stackoverflow.com/users/johndoe" }
        ]
      }
    },
    
    summary: "Experienced software engineer with expertise in full-stack development and cloud architecture.",
    
    skills: {
      soft_skills: ["Leadership", "Communication", "Problem Solving", "Team Building", "Critical Thinking", "Adaptability"],
      technical: ["React", "Node.js", "AWS", "Docker", "Kubernetes", "GraphQL", "MongoDB", "Redis", "Microservices", "CI/CD", "TDD"],
      tools: ["VS Code", "Git", "Jira", "Confluence", "Slack", "Postman", "Jenkins", "Datadog"],
      domains: ["FinTech", "Healthcare", "E-commerce", "SaaS", "Enterprise Software"],
      programming_languages: ["JavaScript", "Python", "TypeScript", "Go", "Rust", "Java", "C++"],
      spoken_languages: ["English", "Spanish", "French", "Mandarin"]
    },
    
    credentials: {
      certifications: [
        { 
          name: "AWS Solutions Architect",
          issuer: "Amazon Web Services",
          issue_date: "2023-01",
          expiry_date: "2026-01",
          credential_id: "AWS-123456"
        },
        {
          name: "Certified Kubernetes Administrator",
          issuer: "Cloud Native Computing Foundation",
          issue_date: "2022-06",
          expiry_date: "2025-06",
          credential_id: "CKA-789012"
        },
        {
          name: "Google Cloud Professional Developer",
          issuer: "Google Cloud",
          issue_date: "2023-03",
          expiry_date: "2025-03",
          credential_id: "GCP-345678"
        }
      ],
      licenses: [
        {
          name: "Professional Engineer",
          authority: "State Board",
          region: "California",
          issue_date: "2022-06",
          expiry_date: "2025-06",
          license_id: "PE-78910"
        },
        {
          name: "Project Management Professional",
          authority: "PMI",
          region: "Global",
          issue_date: "2021-09",
          expiry_date: "2024-09",
          license_id: "PMP-111213"
        }
      ],
      security_clearances: ["Secret", "Public Trust"],
      work_authorization: ["US Citizen", "Eligible for clearance upgrades"]
    },
    
    experience: [
      {
        organization: "Tech Corp",
        role: "Senior Software Engineer",
        department: "Engineering",
        employment_type: "full-time",
        dates: { start: "2021-01", end: "Present" },
        responsibilities: [
          "Lead development of microservices architecture",
          "Mentor junior developers",
          "Conduct code reviews and ensure best practices",
          "Collaborate with product team on technical requirements"
        ],
        achievements: [
          "Reduced API response time by 40%",
          "Implemented CI/CD pipeline",
          "Led migration to Kubernetes, improving deployment efficiency by 60%",
          "Established coding standards adopted company-wide"
        ],
        technologies: ["React", "Node.js", "AWS", "Docker", "Kubernetes"]
      },
      {
        organization: "StartupXYZ",
        role: "Full Stack Developer",
        department: "Product Development",
        employment_type: "full-time",
        dates: { start: "2019-03", end: "2020-12" },
        responsibilities: [
          "Developed RESTful APIs for mobile applications",
          "Implemented real-time features using WebSockets",
          "Managed database design and optimization"
        ],
        achievements: [
          "Built MVP that secured Series A funding",
          "Increased app performance by 50%",
          "Reduced server costs by 30% through optimization"
        ],
        technologies: ["Vue.js", "Python", "PostgreSQL", "Redis"]
      },
      {
        organization: "Enterprise Solutions Inc",
        role: "Software Engineer Intern",
        department: "R&D",
        employment_type: "internship",
        dates: { start: "2018-06", end: "2018-08" },
        responsibilities: [
          "Assisted in developing internal tools",
          "Participated in agile development process"
        ],
        achievements: [
          "Automated testing process saving 10 hours weekly",
          "Received return offer for full-time position"
        ],
        technologies: ["Java", "Spring Boot", "MySQL"]
      }
    ],
    
    education: [
      {
        degree: "Master of Science",
        field_of_study: "Computer Science",
        institution: "Stanford University",
        dates: { start: "2018", end: "2020" },
        gpa: "3.8",
        honors_awards: ["Dean's List", "Research Excellence Award", "Graduate Teaching Award"],
        coursework: ["Machine Learning", "Distributed Systems", "Advanced Algorithms", "Cloud Computing", "Software Architecture"],
        thesis_title: "Optimizing Distributed Consensus Algorithms",
        advisor: "Dr. Jane Smith"
      },
      {
        degree: "Bachelor of Science",
        field_of_study: "Software Engineering",
        institution: "UC Berkeley",
        dates: { start: "2014", end: "2018" },
        gpa: "3.6",
        honors_awards: ["Cum Laude", "Undergraduate Research Award"],
        coursework: ["Data Structures", "Operating Systems", "Database Systems", "Web Development"],
        thesis_title: null,
        advisor: null
      }
    ],
    
    projects: [
      {
        name: "Open Source CMS",
        role: "Lead Developer",
        organization: "Personal Project",
        description: "Built a content management system using modern web technologies",
        dates: { start: "2023-01", end: "2023-06" },
        links: [
          { label: "GitHub", url: "https://github.com/johndoe/cms" },
          { label: "Demo", url: "https://cms-demo.johndoe.com" },
          { label: "Documentation", url: "https://docs.cms.johndoe.com" }
        ],
        technologies: ["React", "GraphQL", "PostgreSQL", "Docker", "TypeScript"],
        impact: ["1000+ GitHub stars", "Used by 50+ organizations", "10+ active contributors"]
      },
      {
        name: "AI-Powered Code Review Tool",
        role: "Co-founder",
        organization: "Hackathon Project",
        description: "Developed an AI tool that automatically reviews code for best practices and security issues",
        dates: { start: "2022-09", end: "2022-12" },
        links: [
          { label: "GitHub", url: "https://github.com/johndoe/ai-reviewer" }
        ],
        technologies: ["Python", "OpenAI API", "FastAPI", "React"],
        impact: ["Won 1st place at TechHack 2022", "500+ downloads in first month"]
      },
      {
        name: "Real-time Analytics Dashboard",
        role: "Technical Lead",
        organization: "Tech Corp",
        description: "Enterprise dashboard for monitoring system metrics and business KPIs",
        dates: { start: "2021-06", end: "Present" },
        links: [],
        technologies: ["Vue.js", "D3.js", "WebSocket", "Redis", "Elasticsearch"],
        impact: ["Reduced incident response time by 35%", "Serving 10M+ events daily"]
      }
    ],
    
    publications: [
      {
        title: "Efficient Algorithms for Distributed Systems",
        type: "journal",
        venue: "IEEE Computer Science Review",
        date: "2023-03",
        authors: ["John Doe", "Jane Smith", "Robert Johnson"],
        doi: "10.1234/example",
        url: "https://ieee.org/example",
        notes: "Peer-reviewed publication on consensus algorithms"
      },
      {
        title: "Machine Learning Approaches to Code Review Automation",
        type: "conference",
        venue: "International Conference on Software Engineering",
        date: "2022-11",
        authors: ["John Doe", "Alice Chen"],
        doi: "10.5678/icse2022",
        url: "https://icse2022.org/papers/ml-code-review",
        notes: "Best paper award nominee"
      },
      {
        title: "Scalable Microservices: Patterns and Anti-patterns",
        type: "preprint",
        venue: "arXiv",
        date: "2023-08",
        authors: ["John Doe"],
        doi: null,
        url: "https://arxiv.org/abs/2308.12345",
        notes: "Under review at ACM Computing Surveys"
      }
    ],
    
    awards_honors: [
      {
        name: "Innovation Award",
        issuer: "Tech Corp",
        date: "2023",
        description: "For exceptional contributions to platform architecture"
      },
      {
        name: "Employee of the Year",
        issuer: "StartupXYZ",
        date: "2020",
        description: "Recognized for outstanding performance and leadership"
      },
      {
        name: "Best Technical Presentation",
        issuer: "DevCon 2023",
        date: "2023-09",
        description: "For talk on 'Microservices at Scale'"
      }
    ],
    
    service_volunteering: [
      {
        organization: "Code for Good",
        role: "Technical Lead",
        dates: { start: "2022", end: "Present" },
        description: "Lead volunteer teams building software for nonprofits"
      },
      {
        organization: "Tech Education Initiative",
        role: "Mentor",
        dates: { start: "2021", end: "Present" },
        description: "Teach programming to underprivileged youth"
      },
      {
        organization: "Open Source Foundation",
        role: "Committee Member",
        dates: { start: "2020", end: "2022" },
        description: "Reviewed grant applications for open source projects"
      }
    ],
    
    open_source: [
      {
        project: "React Testing Library",
        role: "Contributor",
        repo_url: "https://github.com/testing-library/react-testing-library",
        contributions: [
          "Fixed accessibility issues",
          "Added new testing utilities",
          "Improved documentation for async testing"
        ]
      },
      {
        project: "Node.js",
        role: "Contributor",
        repo_url: "https://github.com/nodejs/node",
        contributions: [
          "Performance improvements in HTTP module",
          "Bug fixes in stream API"
        ]
      },
      {
        project: "Awesome JavaScript",
        role: "Maintainer",
        repo_url: "https://github.com/sorrycc/awesome-javascript",
        contributions: [
          "Curate and review submissions",
          "Keep resources up to date"
        ]
      }
    ],
    
    presentations: [
      {
        title: "Microservices at Scale",
        event: "DevCon 2023",
        type: "talk",
        date: "2023-09",
        url: "https://devcon.com/talks/microservices"
      },
      {
        title: "Introduction to Kubernetes",
        event: "Cloud Summit 2023",
        type: "tutorial",
        date: "2023-06",
        url: "https://cloudsummit.com/tutorials/k8s"
      },
      {
        title: "The Future of Web Development",
        event: "JS Conference 2022",
        type: "keynote",
        date: "2022-10",
        url: "https://jsconf.com/keynotes/future-web"
      },
      {
        title: "Machine Learning in Production",
        event: "AI Symposium 2023",
        type: "poster",
        date: "2023-04",
        url: null
      }
    ],
    
    patents: [
      {
        title: "Method for Optimizing Database Queries",
        number: "US123456",
        date: "2023-05",
        assignee: "Tech Corp",
        url: "https://patents.google.com/patent/US123456"
      },
      {
        title: "System for Real-time Data Synchronization",
        number: "US789012",
        date: "2023-08",
        assignee: "Tech Corp",
        url: "https://patents.google.com/patent/US789012"
      }
    ],
    
    teaching: [
      {
        role: "Guest Lecturer",
        course: "CS101 - Introduction to Programming",
        institution: "Local University",
        term: "Fall 2023",
        responsibilities: [
          "Taught Python basics",
          "Graded assignments",
          "Held office hours"
        ]
      },
      {
        role: "Teaching Assistant",
        course: "CS350 - Software Engineering",
        institution: "Stanford University",
        term: "Spring 2019",
        responsibilities: [
          "Led discussion sections",
          "Created programming assignments",
          "Mentored student projects"
        ]
      },
      {
        role: "Workshop Instructor",
        course: "Web Development Bootcamp",
        institution: "Code Academy",
        term: "Summer 2022",
        responsibilities: [
          "Taught full-stack JavaScript",
          "Provided career guidance"
        ]
      }
    ],
    
    creative_portfolio: [
      {
        title: "Tech Blog",
        medium: "Writing",
        role: "Author",
        venue: "Medium",
        date: "2023",
        url: "https://medium.com/@johndoe"
      },
      {
        title: "Developer Podcast",
        medium: "Audio",
        role: "Host",
        venue: "Spotify",
        date: "2022-2023",
        url: "https://spotify.com/devtalk"
      },
      {
        title: "Code Art Installation",
        medium: "Digital Art",
        role: "Creator",
        venue: "Tech Museum",
        date: "2023-03",
        url: "https://techmuseum.org/code-art"
      }
    ],
    
    affiliations_memberships: [
      {
        organization: "IEEE",
        role: "Member",
        dates: { start: "2020", end: "Present" }
      },
      {
        organization: "ACM",
        role: "Senior Member",
        dates: { start: "2019", end: "Present" }
      },
      {
        organization: "Python Software Foundation",
        role: "Contributing Member",
        dates: { start: "2021", end: null, is_current: true }
      }
    ],
    
    grants_funding: [
      {
        name: "Research Innovation Grant",
        sponsor: "National Science Foundation",
        amount: "$50,000",
        date: "2023",
        role: "Co-Investigator"
      },
      {
        name: "Open Source Development Fund",
        sponsor: "Google",
        amount: "$25,000",
        date: "2022",
        role: "Principal Investigator"
      },
      {
        name: "AI Research Fellowship",
        sponsor: "Microsoft Research",
        amount: "$75,000",
        date: "2023",
        role: "Fellow"
      }
    ],
    
    references: [
      {
        name: "Jane Smith",
        relationship: "Former Manager",
        contact: "jane.smith@techcorp.com, 555-9876"
      },
      {
        name: "Dr. Robert Johnson",
        relationship: "Graduate Advisor",
        contact: "rjohnson@stanford.edu, 555-5432"
      },
      {
        name: "Alice Chen",
        relationship: "Colleague & Co-author",
        contact: "alice.chen@startup.com, 555-1234"
      }
    ],
    
    interests: ["Machine Learning", "Cloud Architecture", "Open Source", "Blockchain", "Quantum Computing", "DevOps", "Cybersecurity", "Technical Writing"],
    
    other: "Active security clearance. Available for relocation. Fluent in multiple programming paradigms including functional, object-oriented, and reactive programming. Regular speaker at tech conferences and active contributor to the developer community. Passionate about mentoring and knowledge sharing."
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Test Resume Page</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            This page contains test data matching the parser schema. Use the edit button to toggle between view and edit modes.
          </p>
        </div>
        
        <ResumeViewer 
          data={testData} 
          resumeId="test-resume-id" 
          editable={isEditMode}
          isLoading={false}
        />
        
        {/* Floating Edit Mode Toggle */}
        <FloatingEditButton />
      </div>
    </div>
  );
}

export default TestResumePage;