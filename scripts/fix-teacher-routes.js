const fs = require('fs');
const path = require('path');

// List of teacher API routes that need updating
const routesToUpdate = [
  'src/app/api/teacher/simple-grades/route.ts',
  'src/app/api/teacher/school-info/route.ts',
  'src/app/api/teacher/recent-transactions/route.ts',
  'src/app/api/teacher/profile/route.ts',
  'src/app/api/teacher/issue-credits/route.ts',
  'src/app/api/teacher/credit-stats/route.ts',
  'src/app/api/teacher/attendance/students/route.ts',
  'src/app/api/teacher/attendance-grades/route.ts',
  'src/app/api/teacher/attendance/classes/route.ts',
  'src/app/api/teacher/attendance/grades/route.ts'
];

const projectRoot = path.join(__dirname, '..');

routesToUpdate.forEach(routePath => {
  const fullPath = path.join(projectRoot, routePath);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Replace the import
    content = content.replace(
      /import { createServerClient } from '@supabase\/ssr'\nimport { cookies } from 'next\/headers'/g,
      "import { createSupabaseServerClient } from '@/lib/supabase-server'"
    );
    
    // Remove the local createSupabaseServerClient function
    content = content.replace(
      /\/\/ Create Supabase client with cookie-based auth\nasync function createSupabaseServerClient\(\) \{[\s\S]*?\n\}\n/g,
      ''
    );
    
    // Replace direct createServerClient calls
    content = content.replace(
      /const cookieStore = await cookies\(\)[\s\S]*?const supabase = createServerClient\([\s\S]*?\}\s*\)/g,
      'const supabase = await createSupabaseServerClient()'
    );
    
    // Save the updated file
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Updated: ${routePath}`);
  } else {
    console.log(`⚠️ File not found: ${routePath}`);
  }
});

console.log('\n✨ All teacher routes updated to use centralized auth!');
