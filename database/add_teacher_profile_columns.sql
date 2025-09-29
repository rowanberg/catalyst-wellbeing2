-- Add teacher-specific columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS subject_specialization TEXT,
ADD COLUMN IF NOT EXISTS education_level TEXT,
ADD COLUMN IF NOT EXISTS years_experience INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS hire_date DATE,
ADD COLUMN IF NOT EXISTS certifications TEXT[],
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Update existing profiles table to have better structure
COMMENT ON COLUMN profiles.email IS 'User email address';
COMMENT ON COLUMN profiles.department IS 'Teacher department (e.g., Mathematics, Science, English)';
COMMENT ON COLUMN profiles.subject_specialization IS 'Subject area of expertise';
COMMENT ON COLUMN profiles.education_level IS 'Highest education level (Bachelor, Master, Doctorate, etc.)';
COMMENT ON COLUMN profiles.years_experience IS 'Years of teaching experience';
COMMENT ON COLUMN profiles.bio IS 'Professional biography';
COMMENT ON COLUMN profiles.hire_date IS 'Date when teacher was hired';
COMMENT ON COLUMN profiles.certifications IS 'Array of professional certifications';
COMMENT ON COLUMN profiles.emergency_contact_name IS 'Emergency contact person name';
COMMENT ON COLUMN profiles.emergency_contact_phone IS 'Emergency contact phone number';
COMMENT ON COLUMN profiles.profile_picture_url IS 'URL to profile picture';
