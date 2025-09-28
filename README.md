# Catalyst - School Well-being Platform with Military-Grade Secure Communications

A comprehensive, multi-tenant well-being platform designed for school ecosystems, empowering students, parents, and educators to foster mental health and positive behavior through secure, AI-moderated communication channels.

## 🌟 Features

### 🔐 Military-Grade Secure Communications
- **End-to-End Encryption**: RSA-OAEP + AES-GCM hybrid encryption for private messages
- **AI Content Moderation**: Real-time threat detection with sentiment analysis
- **Emergency Safety System**: One-click incident reporting with immediate admin alerts
- **Zero-Trust Architecture**: Every communication authenticated and authorized
- **Role-Based Permissions**: Strict access control based on user roles and relationships
- **Office Hours Enforcement**: Time-based messaging restrictions for student safety
- **Parent Consent Management**: Comprehensive consent tracking and validation
- **Audit Logging**: Immutable logs for all communication events

### For Students
- **Breathing Exercises**: Guided mindfulness sessions with visual feedback
- **Courage Log**: Private journal for recording brave moments
- **Kindness Counter**: Track and celebrate acts of kindness
- **Gratitude Journal**: Daily reflection and thankfulness practice
- **Habit Tracker**: Monitor sleep and water intake
- **Teacher Connect**: Safe communication channel with conversation starters
- **Emergency Safety Button**: Immediate help request with incident reporting
- **Strengths Quiz**: Discover personal strengths and talents
- **XP & Leveling System**: Gamified progress tracking

### For Parents
- **Child Progress Monitoring**: View anonymized well-being metrics
- **Family Communication Hub**: Secure messaging with teachers
- **Child Message Transparency**: Read-only access to child's communications
- **Consent Management**: Control child's communication permissions
- **Emergency Notifications**: Immediate alerts for safety incidents
- **Parenting Resources**: Tips and guidance for supporting well-being

### For Teachers
- **Class Analytics**: Monitor student engagement and well-being
- **Secure Parent Communication**: Encrypted messaging with families
- **Class Announcements**: Broadcast important updates safely
- **Office Hours Management**: Configure availability for student messages
- **Content Moderation Tools**: Review and manage flagged communications
- **Emergency Response**: Immediate notification of safety incidents

### For Administrators
- **Security Center**: Complete oversight of all communications
- **Moderation Queue**: Review and manage flagged content
- **Emergency Incident Management**: Handle safety reports and escalations
- **Communication Analytics**: Monitor platform usage and safety metrics
- **User Management**: Add/manage teachers, students, parents with role permissions
- **Audit Log Access**: Complete transparency of all platform activities
- **Emergency Lockdown**: Instant platform-wide communication controls

## 🏗️ Architecture

### Tech Stack
- **Framework**: Next.js 15+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui with Radix UI primitives
- **State Management**: Redux Toolkit
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Real-time**: Supabase Realtime for live messaging
- **Encryption**: Web Crypto API (RSA-OAEP + AES-GCM)
- **Testing**: Jest with React Testing Library
- **Icons**: Lucide React
- **Forms**: React Hook Form with Zod validation
- **Animations**: Framer Motion

### Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   │   ├── login/
│   │   ├── register/
│   │   └── register/school/
│   ├── (dashboard)/       # Protected dashboard routes
│   │   ├── student/       # Student features
│   │   ├── parent/        # Parent dashboard
│   │   ├── teacher/       # Teacher tools
│   │   └── admin/         # Admin panel
│   ├── api/               # API routes
│   └── globals.css
├── components/            # Reusable UI components
│   └── ui/               # shadcn/ui components
├── features/             # Feature-based modules
├── lib/                  # Core utilities
│   ├── redux/           # Redux store and slices
│   ├── supabaseClient.ts
│   └── utils.ts
├── types/               # TypeScript definitions
└── middleware.ts        # Route protection
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd catalyst
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Set up the database**
   - Create a new Supabase project
   - Run the SQL schema from `database/schema.sql` in your Supabase SQL editor
   - Configure Row Level Security policies as needed

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📊 Database Schema

The application uses a comprehensive PostgreSQL schema with the following main tables:

- **schools**: School information and configuration
- **profiles**: User profiles extending Supabase auth
- **courage_log**: Student courage journal entries
- **gratitude_entries**: Gratitude journal entries
- **help_requests**: Student support requests
- **habit_tracker**: Daily habit tracking data
- **kindness_counter**: Acts of kindness tracking
- **parent_child_relationships**: Family connections
- **teacher_classes**: Class assignments
- **bullying_reports**: Incident reporting

## 🔐 Security Features

- **Row Level Security (RLS)**: Database-level access control
- **Role-based Access Control**: Different permissions for each user type
- **Protected Routes**: Middleware-based route protection
- **Secure Authentication**: Supabase Auth integration
- **Data Privacy**: Anonymized analytics and reporting

## 🎯 User Flows

### School Registration
1. Admin registers school at `/register/school`
2. System generates unique 12-character school code
3. Admin account created with full permissions

### User Onboarding
1. Users register at `/register` with school code
2. System verifies school code exists
3. Role-based profile creation
4. Automatic redirect to appropriate dashboard

### Student Well-being Journey
1. Daily login to student dashboard
2. Complete well-being activities (breathing, journaling, etc.)
3. Earn XP and gems for engagement
4. Level up and unlock new features
5. Request help when needed

## 🔧 Configuration

### Supabase Setup
1. Create tables using the provided schema
2. Configure authentication providers
3. Set up Row Level Security policies
4. Configure storage buckets for avatars (optional)

### Environment Configuration
- Development: Use `.env.local`
- Production: Configure environment variables in your hosting platform

## 🚀 Deployment

### Recommended Platforms
- **Vercel**: Optimal for Next.js applications
- **Netlify**: Alternative with good Next.js support
- **Railway**: Full-stack deployment option

### Deployment Steps
1. Build the application: `npm run build`
2. Configure environment variables on your platform
3. Deploy using your platform's CLI or web interface
4. Verify database connections and authentication

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation wiki

## 🙏 Acknowledgments

- Built with Next.js and the React ecosystem
- UI components from shadcn/ui and Radix UI
- Database and authentication powered by Supabase
- Icons provided by Lucide React

---

**Catalyst** - Empowering school communities through technology and well-being. 🌱
#   c a l a l y s t - w e l l b e i n g  
 #   c a l a l y s t - w e l l b e i n g  
 #   c a t a l y s t 1  
 