# Email Endpoints Analysis - Catalyst Wellbeing Platform

## Overview
This document identifies all endpoints and scenarios that require email notifications in the Catalyst platform.

---

## 🔐 Authentication & Account Management

### 1. **User Registration**
**Endpoints:**
- `/api/register-student` - Student registration
- `/api/register-school` - School/Admin registration  
- `/api/auth/google-register` - Google OAuth registration
- `/api/superpanel/schools/[id]/controls` (action: `add_user`)

**Email Requirements:**
- ✅ **Welcome Email** - Confirm account creation
- ✅ **Email Verification** - Link to verify email address
- ⚠️ **Currently:** Supabase handles this automatically (needs custom templates)

**Templates Needed:**
- `welcome-student.html`
- `welcome-teacher.html`
- `welcome-parent.html`
- `welcome-admin.html`
- `email-verification.html`

---

### 2. **Password Reset**
**Endpoints:**
- `/api/superpanel/schools/[id]/controls` (action: `reset_password`)
- Supabase Auth (built-in password reset)

**Email Requirements:**
- ✅ **Password Reset Link** - Magic link to reset password
- ✅ **Temporary Password** - For admin-initiated resets
- ✅ **Password Changed Confirmation** - Security notification

**Templates Needed:**
- `password-reset.html` ✅ (exists)
- `password-changed.html`
- `temporary-password.html`

---

### 3. **Email Verification**
**Endpoints:**
- `/api/verify-student`
- `/api/verify-school`
- Supabase Auth email confirmation

**Email Requirements:**
- ✅ **Email Confirmation Link**
- ✅ **Resend Verification**

**Templates Needed:**
- `confirm-signup.html` ✅ (exists)
- `supabase-confirm-signup.html` ✅ (exists)

---

## 👨‍👩‍👧 Parent-Child Linking

### 4. **Child Link Requests**
**Endpoints:**
- `/api/v1/parents/link-child`

**Email Requirements:**
- 📧 **Parent Invitation** - Invite parent to link their child
- 📧 **Link Request Notification** - Notify when parent requests to link
- 📧 **Link Approved** - Confirm successful linking
- 📧 **Link Denied** - Notify if request is denied

**Templates Needed:**
- `parent-link-invitation.html`
- `parent-link-request.html`
- `parent-link-approved.html`
- `parent-link-denied.html`

---

## 🏫 School & Class Management

### 5. **School Events**
**Endpoints:**
- `/api/school-events/register`

**Email Requirements:**
- 📧 **Event Registration Confirmation**
- 📧 **Event Reminder** - 24h before event
- 📧 **Event Cancellation**
- 📧 **Event Updates**

**Templates Needed:**
- `event-registration.html`
- `event-reminder.html`
- `event-cancelled.html`
- `event-updated.html`

---

### 6. **Teacher Communications**
**Endpoints:**
- `/api/teacher/send-shout-out`
- `/api/communications` (teacher messaging)

**Email Requirements:**
- 📧 **Shout-Out Notification** - Student receives praise
- 📧 **Parent Shout-Out Copy** - Parents get copy of shout-outs
- 📧 **Announcement Notification**

**Templates Needed:**
- `shout-out-student.html`
- `shout-out-parent.html`
- `teacher-announcement.html`

---

## 📊 Academic Notifications

### 7. **Grade Notifications**
**Endpoints:**
- `/api/teacher/grades` (when grades are posted)
- Parent notification triggers

**Email Requirements:**
- 📧 **New Grade Posted** - Student notification
- 📧 **Low Grade Alert** - Parent notification (below threshold)
- 📧 **Grade Improvement** - Positive reinforcement

**Templates Needed:**
- `grade-posted.html`
- `low-grade-alert.html`
- `grade-improved.html`

---

### 8. **Assignment & Homework**
**Endpoints:**
- Assignment creation endpoints
- Homework submission tracking

**Email Requirements:**
- 📧 **Assignment Due Reminder** - 24h before due
- 📧 **Missing Assignment** - Parent notification
- 📧 **Assignment Graded**

**Templates Needed:**
- `assignment-due.html`
- `assignment-missing.html`
- `assignment-graded.html`

---

### 9. **Examination Notifications**
**Endpoints:**
- Exam schedule APIs

**Email Requirements:**
- 📧 **Exam Schedule** - Upcoming exam notification
- 📧 **Exam Reminder** - 24h before exam
- 📧 **Results Published**

**Templates Needed:**
- `exam-scheduled.html`
- `exam-reminder.html`
- `exam-results.html`

---

## 📍 Attendance & Safety

### 10. **Attendance Alerts**
**Endpoints:**
- `/api/teacher/attendance` (mark attendance)
- `/api/v1/students/[id]/attendance`

**Email Requirements:**
- 📧 **Absence Notification** - Parent alert (immediate)
- 📧 **Attendance Report** - Weekly summary
- 📧 **Chronic Absenteeism** - Multiple absences alert

**Templates Needed:**
- `absence-alert.html`
- `attendance-weekly.html`
- `attendance-warning.html`

---

## 💰 Wallet & Financial

### 11. **Wallet Transactions**
**Endpoints:**
- `/api/student/wallet/send`
- `/api/student/wallet/create`
- `/api/student/wallet/setup-password`

**Email Requirements:**
- 📧 **Wallet Created** - Welcome to digital wallet
- 📧 **Transaction Sent** - Confirmation
- 📧 **Transaction Received** - Notification
- 📧 **Low Balance** - Warning
- 📧 **Security Alert** - Failed password attempts

**Templates Needed:**
- `wallet-created.html`
- `transaction-sent.html`
- `transaction-received.html`
- `wallet-low-balance.html`
- `wallet-security-alert.html`

---

## 🎯 Wellbeing & Mental Health

### 12. **Wellbeing Alerts**
**Endpoints:**
- `/api/v2/student/wellbeing`
- `/api/teacher/wellbeing-analytics`

**Email Requirements:**
- 📧 **Low Wellbeing Alert** - Teacher/counselor notification
- 📧 **Critical Alert** - Immediate intervention needed
- 📧 **Wellbeing Check-in** - Weekly reminder

**Templates Needed:**
- `wellbeing-alert-staff.html`
- `wellbeing-critical.html`
- `wellbeing-checkin.html`

---

## 🏆 Achievements & Gamification

### 13. **Achievement Notifications**
**Endpoints:**
- Achievement unlock triggers
- XP/Level up events

**Email Requirements:**
- 📧 **Achievement Unlocked** - Congratulations message
- 📧 **Level Up** - Milestone celebration
- 📧 **Leaderboard Position** - Weekly/monthly rankings

**Templates Needed:**
- `achievement-unlocked.html`
- `level-up.html`
- `leaderboard-update.html`

---

## 👥 Community & Social

### 14. **Study Groups & Peer Tutoring**
**Endpoints:**
- Study group endpoints
- Peer tutoring matching

**Email Requirements:**
- 📧 **Study Group Invitation**
- 📧 **Tutoring Match** - Paired with tutor/tutee
- 📧 **Session Reminder**

**Templates Needed:**
- `study-group-invite.html`
- `tutoring-matched.html`
- `session-reminder.html`

---

## 📱 System & Admin

### 15. **System Notifications**
**Email Requirements:**
- 📧 **Security Alert** - Unusual login activity
- 📧 **Account Locked** - Too many failed attempts
- 📧 **Profile Updated** - Important changes confirmation
- 📧 **Data Export Ready** - GDPR compliance
- 📧 **Subscription Expiring** - School subscription renewal

**Templates Needed:**
- `security-alert.html`
- `account-locked.html`
- `profile-updated.html`
- `data-export-ready.html`
- `subscription-expiring.html`

---

### 16. **Super Admin Operations**
**Endpoints:**
- `/api/superpanel/schools/[id]/controls`

**Email Requirements:**
- 📧 **School Activated** - Welcome new school
- 📧 **School Suspended** - Account suspension notice
- 📧 **Plan Upgraded** - Subscription change
- 📧 **Bulk User Import** - Completion notification

**Templates Needed:**
- `school-activated.html`
- `school-suspended.html`
- `plan-upgraded.html`
- `bulk-import-complete.html`

---

## 📊 Parent Portal

### 17. **Parent Notifications**
**Endpoints:**
- `/api/v1/parents/settings` (notification preferences)
- `/api/v1/parents/dashboard`

**Email Requirements:**
- 📧 **Weekly Summary** - Child's weekly progress
- 📧 **Daily Digest** - Configurable daily updates
- 📧 **Achievement Notification** - Child's achievements

**Templates Needed:**
- `parent-weekly-summary.html`
- `parent-daily-digest.html`
- `parent-achievement.html`

---

## 🔄 Scheduled/Automated Emails

### 18. **Recurring Communications**
**Cron Jobs/Background Tasks:**

**Email Requirements:**
- 📧 **Daily Summary** - End of day recap
- 📧 **Weekly Report** - Weekend summary
- 📧 **Monthly Analytics** - Performance insights
- 📧 **Inactive User** - Re-engagement campaign
- 📧 **Birthday Wishes** - Student birthdays

**Templates Needed:**
- `daily-summary.html`
- `weekly-report.html`
- `monthly-analytics.html`
- `reengagement.html`
- `birthday-wishes.html`

---

## 📋 Implementation Priority

### **Priority 1 - Critical (Implement First)**
1. ✅ Email Verification (Supabase)
2. ✅ Password Reset (Supabase)
3. 📧 Parent Link Notifications
4. 📧 Absence Alerts (same-day)
5. 📧 Low Grade Alerts
6. 📧 Wallet Transactions

### **Priority 2 - Important**
7. 📧 Welcome Emails (all roles)
8. 📧 Assignment Reminders
9. 📧 Exam Notifications
10. 📧 Shout-Outs
11. 📧 Event Registrations

### **Priority 3 - Nice to Have**
12. 📧 Weekly Summaries
13. 📧 Achievement Notifications
14. 📧 Study Group Invites
15. 📧 Birthday Wishes

---

## 🛠️ Technical Implementation

### **Current Setup**
- Supabase Auth handles:
  - ✅ Email verification
  - ✅ Password reset
  - ✅ Magic link login

**Templates exist:**
- ✅ `password-reset-template.html`
- ✅ `confirm-signup.html`
- ✅ `supabase-confirm-signup.html`
- ✅ `PRODUCTION-READY-supabase-email.html`

### **What's Missing**
- Custom email service integration (Resend, SendGrid, etc.)
- Template engine for dynamic content
- Email queue system for bulk sends
- Delivery tracking and analytics
- Unsubscribe management
- Email preference center

### **Recommended Stack**
```typescript
// Email Service: Resend (modern, developer-friendly)
import { Resend } from 'resend'

// Template Engine: React Email
import { render } from '@react-email/render'

// Queue: Supabase Edge Functions + pg_cron
// or Vercel Cron Jobs
```

---

## 📧 Email Sending Endpoints to Create

### New API Endpoints Needed:
```
/api/email/send-welcome
/api/email/send-notification
/api/email/send-alert
/api/email/send-digest
/api/email/send-reminder
```

### Background Jobs Needed:
```
- Daily digest aggregator
- Weekly report generator
- Event reminder scheduler
- Assignment due reminder
- Attendance alert processor
```

---

## 🎯 Next Steps

1. **Choose Email Service** (Resend recommended)
2. **Set up React Email** for templates
3. **Create email service utility** (`/lib/email/sender.ts`)
4. **Build template library** (`/emails/*`)
5. **Implement Priority 1** endpoints
6. **Add email queue system**
7. **Set up monitoring & analytics**
8. **Configure user preferences**
9. **Test delivery & spam scores**
10. **Deploy & monitor**

---

## 📝 Notes

- All emails should be **mobile-responsive**
- Include **unsubscribe link** (legal requirement)
- Support **dark mode** in email clients
- Track **open rates** and **click rates**
- Implement **rate limiting** to prevent abuse
- Add **email verification** for new addresses
- Support **multiple languages** (i18n)
- Include **brand assets** (logo, colors)
- Ensure **GDPR compliance**
- Test across **major email clients**

---

**Total Email Types Identified: 65+**
**Templates to Create: ~60**
**API Endpoints to Update: ~25**
**Background Jobs: ~8**
