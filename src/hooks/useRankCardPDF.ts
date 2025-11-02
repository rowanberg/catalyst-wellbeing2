import { useCallback } from 'react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import type { RankData } from '@/components/student/RankCard'

interface RankCardData extends RankData {
  school_name?: string
  school_logo?: string
  academic_year?: string
}

export const useRankCardPDF = () => {
  const generatePDF = useCallback(async (rankData: RankCardData) => {
    try {
      // Fetch assessments data with school name
      const assessmentsResponse = await fetch(`/api/student/assessments?student_id=${rankData.student_id}`)
      const assessmentsData = await assessmentsResponse.json()
      
      console.log('🎓 PDF Generation - Assessments received:', assessmentsData.assessments?.length || 0)
      console.log('📄 PDF Generation - Sample:', assessmentsData.assessments?.[0])
      
      // Add school name to rank data
      if (assessmentsData.schoolName) {
        rankData.school_name = assessmentsData.schoolName
      }

      // Load Google Fonts dynamically for professional typography
      await loadGoogleFonts()

      // Create a temporary container for the rank card
      const container = document.createElement('div')
      container.style.position = 'absolute'
      container.style.left = '-9999px'
      container.style.width = '210mm' // A4 width
      container.style.background = 'white'
      document.body.appendChild(container)

      // Generate the rank card HTML with assessments
      container.innerHTML = generateRankCardHTML(rankData, assessmentsData.assessments || [])

      // Wait for fonts and images to load (increased time for font loading)
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Get both page containers
      const page1 = container.querySelector('.pdf-page-1') as HTMLElement
      const page2 = container.querySelector('.pdf-page-2') as HTMLElement

      console.log('📄 Page 1 found:', !!page1)
      console.log('📄 Page 2 found:', !!page2)
      console.log('📊 Page 2 content length:', page2?.innerHTML?.length || 0)

      if (!page1 || !page2) {
        throw new Error('PDF pages not found')
      }

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      })

      // Capture Page 1
      const canvas1 = await html2canvas(page1, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794,
        windowHeight: 1123
      })

      const imgData1 = canvas1.toDataURL('image/png', 1.0)
      const imgWidth = 210 // A4 width in mm
      const imgHeight1 = (canvas1.height * imgWidth) / canvas1.width

      pdf.addImage(imgData1, 'PNG', 0, 0, imgWidth, imgHeight1, undefined, 'FAST')

      // Add new page and capture Page 2
      pdf.addPage()
      
      const canvas2 = await html2canvas(page2, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794,
        windowHeight: 1123
      })

      const imgData2 = canvas2.toDataURL('image/png', 1.0)
      const imgHeight2 = (canvas2.height * imgWidth) / canvas2.width

      pdf.addImage(imgData2, 'PNG', 0, 0, imgWidth, imgHeight2, undefined, 'FAST')

      // Remove temporary container
      document.body.removeChild(container)

      // Generate filename
      const fileName = `Academic_Performance_Certificate_${rankData.first_name}_${rankData.last_name}_${rankData.academic_year || new Date().getFullYear()}.pdf`

      // Download
      pdf.save(fileName)

      return { success: true, fileName }
    } catch (error) {
      console.error('Error generating PDF:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }, [])

  return { generatePDF }
}

// Load Google Fonts for professional typography
const loadGoogleFonts = async (): Promise<void> => {
  return new Promise((resolve) => {
    // Check if fonts are already loaded
    if (document.getElementById('pdf-google-fonts')) {
      resolve()
      return
    }

    // Create link element for Google Fonts
    const link = document.createElement('link')
    link.id = 'pdf-google-fonts'
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800;900&family=Inter:wght@400;500;600;700;800;900&family=Merriweather:wght@400;700;900&display=swap'
    
    link.onload = () => {
      // Give fonts time to fully load
      setTimeout(resolve, 300)
    }
    
    link.onerror = () => {
      console.warn('Failed to load Google Fonts, using fallback fonts')
      resolve()
    }
    
    document.head.appendChild(link)
  })
}

// HTML template for the rank card
const generateRankCardHTML = (data: RankCardData, assessments: any[]): string => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const academicYear = data.academic_year || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`

  // Calculate statistics
  const totalAssessments = assessments.length
  console.log('📊 Total assessments:', totalAssessments)
  console.log('📋 Assessments data:', assessments)
  
  const subjectBreakdown = assessments.reduce((acc: any, a: any) => {
    if (!acc[a.subject]) {
      acc[a.subject] = { total: 0, count: 0, scores: [] }
    }
    const percentage = parseFloat(a.percentage) || 0
    acc[a.subject].total += percentage
    acc[a.subject].count += 1
    // Ensure we're capturing all the data including title
    acc[a.subject].scores.push({ 
      title: a.title || `Assessment ${acc[a.subject].scores.length + 1}`, 
      score: a.score, 
      maxScore: a.maxScore, 
      percentage: percentage 
    })
    return acc
  }, {})
  
  console.log('📦 Subject breakdown:', subjectBreakdown)

  const subjectAverages = Object.keys(subjectBreakdown).map(subject => ({
    subject,
    average: (subjectBreakdown[subject].total / subjectBreakdown[subject].count).toFixed(1),
    count: subjectBreakdown[subject].count,
    scores: subjectBreakdown[subject].scores
  }))

  return `
    <div class="pdf-page-1" style="width: 210mm; min-height: 297mm; padding: 15mm 20mm; font-family: 'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif; background: linear-gradient(to bottom, #ffffff 0%, #f8fafc 100%); box-sizing: border-box; position: relative;">
      
      <!-- Premium Multi-Layer Border -->
      <div style="position: absolute; top: 8mm; left: 12mm; right: 12mm; bottom: 8mm; border: 3px solid #0f172a; pointer-events: none;"></div>
      <div style="position: absolute; top: 9mm; left: 13mm; right: 13mm; bottom: 9mm; border: 1px solid #cbd5e1; pointer-events: none;"></div>
      <div style="position: absolute; top: 8mm; left: 12mm; width: 70mm; height: 4px; background: linear-gradient(to right, #d97706, #f59e0b, #fbbf24); pointer-events: none;"></div>
      <div style="position: absolute; top: 8mm; right: 12mm; width: 70mm; height: 4px; background: linear-gradient(to left, #d97706, #f59e0b, #fbbf24); pointer-events: none;"></div>
      <div style="position: absolute; bottom: 8mm; left: 12mm; width: 70mm; height: 4px; background: linear-gradient(to right, #d97706, #f59e0b, #fbbf24); pointer-events: none;"></div>
      <div style="position: absolute; bottom: 8mm; right: 12mm; width: 70mm; height: 4px; background: linear-gradient(to left, #d97706, #f59e0b, #fbbf24); pointer-events: none;"></div>
      
      <!-- Corner Decorations -->
      <div style="position: absolute; top: 8mm; left: 12mm; width: 15mm; height: 15mm; border-top: 3px solid #d97706; border-left: 3px solid #d97706; pointer-events: none;"></div>
      <div style="position: absolute; top: 8mm; right: 12mm; width: 15mm; height: 15mm; border-top: 3px solid #d97706; border-right: 3px solid #d97706; pointer-events: none;"></div>
      <div style="position: absolute; bottom: 8mm; left: 12mm; width: 15mm; height: 15mm; border-bottom: 3px solid #d97706; border-left: 3px solid #d97706; pointer-events: none;"></div>
      <div style="position: absolute; bottom: 8mm; right: 12mm; width: 15mm; height: 15mm; border-bottom: 3px solid #d97706; border-right: 3px solid #d97706; pointer-events: none;"></div>
      
      <!-- Watermark -->
      <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 120px; color: rgba(15, 23, 42, 0.02); font-weight: 900; font-family: 'Playfair Display', serif; letter-spacing: 10px; pointer-events: none; user-select: none;">OFFICIAL</div>

      <!-- Content Container -->
      <div style="position: relative; z-index: 1;">
        
        <!-- Premium Executive Header Section -->
        <div style="position: relative; margin-bottom: 25px;">
          <!-- Decorative Top Banner -->
          <div style="position: absolute; top: -5px; left: 0; right: 0; height: 8px; background: linear-gradient(to right, #d97706 0%, #f59e0b 50%, #d97706 100%); border-radius: 4px;"></div>
          
          <div style="text-align: center; padding: 35px 25px 30px 25px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%); border-radius: 10px; position: relative; overflow: hidden; border: 2px solid #d97706; box-shadow: 0 8px 30px rgba(15, 23, 42, 0.3);">
            <!-- Diagonal Pattern Background -->
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(217, 119, 6, 0.03) 35px, rgba(217, 119, 6, 0.03) 70px); pointer-events: none;"></div>
            
            <!-- Top Gold Bar -->
            <div style="position: absolute; top: 0; left: 0; right: 0; height: 5px; background: linear-gradient(to right, transparent 0%, #d97706 20%, #f59e0b 50%, #d97706 80%, transparent 100%);"></div>
            
            <!-- School Logo with Premium Styling -->
            ${data.school_logo ? `
              <div style="position: relative; display: inline-block; margin-bottom: 18px;">
                <div style="position: absolute; inset: -8px; background: linear-gradient(135deg, #d97706, #f59e0b); border-radius: 50%; filter: blur(15px); opacity: 0.5;"></div>
                <img src="${data.school_logo}" alt="School Logo" style="position: relative; width: 90px; height: 90px; border-radius: 50%; border: 5px solid #fbbf24; box-shadow: 0 8px 25px rgba(217, 119, 6, 0.5), inset 0 2px 10px rgba(255, 255, 255, 0.2);" />
              </div>
            ` : `
              <div style="position: relative; display: inline-block; margin-bottom: 18px;">
                <div style="position: absolute; inset: -8px; background: linear-gradient(135deg, #d97706, #f59e0b); border-radius: 50%; filter: blur(15px); opacity: 0.5;"></div>
                <div style="position: relative; width: 90px; height: 90px; margin-left: auto; margin-right: auto; border-radius: 50%; background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%); display: flex; align-items: center; justify-content: center; border: 5px solid #fbbf24; box-shadow: 0 8px 25px rgba(217, 119, 6, 0.5), inset 0 2px 10px rgba(255, 255, 255, 0.2);">
                  <span style="font-size: 42px; color: white; text-shadow: 0 2px 8px rgba(0,0,0,0.3);">🎓</span>
                </div>
              </div>
            `}
            
            <!-- School Name with Underline -->
            <div style="position: relative; display: inline-block; margin-bottom: 15px;">
              <h1 style="margin: 0; font-size: 38px; color: #ffffff; font-weight: 900; text-transform: uppercase; letter-spacing: 6px; font-family: 'Playfair Display', 'Georgia', serif; text-shadow: 0 4px 8px rgba(0,0,0,0.5), 0 0 30px rgba(251, 191, 36, 0.3); position: relative; z-index: 1;">
                ${data.school_name || 'School Name'}
              </h1>
              <div style="position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%); width: 80%; height: 3px; background: linear-gradient(to right, transparent, #fbbf24, transparent); border-radius: 2px;"></div>
            </div>
            
            <!-- Academic Year Badge -->
            <div style="display: inline-block; padding: 6px 25px; background: linear-gradient(135deg, rgba(217, 119, 6, 0.25) 0%, rgba(251, 191, 36, 0.25) 100%); border: 2px solid #d97706; border-radius: 25px; margin: 15px 0; backdrop-filter: blur(10px); box-shadow: 0 4px 15px rgba(217, 119, 6, 0.3);">
              <p style="margin: 0; font-size: 12px; color: #fbbf24; font-weight: 800; letter-spacing: 2px; font-family: 'Inter', sans-serif; text-transform: uppercase;">📅 Academic Year ${academicYear}</p>
            </div>
            
            <!-- Certificate Title with Premium Styling -->
            <div style="margin-top: 20px; position: relative; display: inline-block;">
              <div style="position: absolute; inset: -3px; background: linear-gradient(135deg, #d97706, #f59e0b, #fbbf24); border-radius: 8px; filter: blur(8px); opacity: 0.6;"></div>
              <div style="position: relative; padding: 16px 45px; background: linear-gradient(135deg, #d97706 0%, #f59e0b 50%, #d97706 100%); color: white; border-radius: 8px; font-size: 17px; font-weight: 900; letter-spacing: 5px; box-shadow: 0 6px 20px rgba(217, 119, 6, 0.5), inset 0 1px 3px rgba(255, 255, 255, 0.3); text-shadow: 0 2px 4px rgba(0,0,0,0.3); font-family: 'Merriweather', 'Georgia', serif; border: 2px solid #fbbf24;">
                <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                  <span style="font-size: 20px;">🏆</span>
                  <span>ACADEMIC PERFORMANCE CERTIFICATE</span>
                  <span style="font-size: 20px;">🏆</span>
                </div>
              </div>
            </div>
            
            <!-- Decorative Bottom Elements -->
            <div style="margin-top: 15px; display: flex; justify-content: center; gap: 8px;">
              <div style="width: 8px; height: 8px; background: #fbbf24; border-radius: 50%; box-shadow: 0 0 10px #fbbf24;"></div>
              <div style="width: 8px; height: 8px; background: #f59e0b; border-radius: 50%; box-shadow: 0 0 10px #f59e0b;"></div>
              <div style="width: 8px; height: 8px; background: #d97706; border-radius: 50%; box-shadow: 0 0 10px #d97706;"></div>
            </div>
            
            <!-- Bottom Gold Bar -->
            <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 5px; background: linear-gradient(to right, transparent 0%, #d97706 20%, #f59e0b 50%, #d97706 80%, transparent 100%);"></div>
          </div>
          
          <!-- Decorative Bottom Banner -->
          <div style="position: absolute; bottom: -5px; left: 0; right: 0; height: 8px; background: linear-gradient(to right, #d97706 0%, #f59e0b 50%, #d97706 100%); border-radius: 4px;"></div>
        </div>

        <!-- Executive Student Information Card -->
        <div style="margin: 25px 0; padding: 0; background: white; border: 2px solid #0f172a; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.1);">
          <div style="padding: 12px 20px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-bottom: 3px solid #d97706;">
            <p style="margin: 0; font-size: 11px; color: #fbbf24; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">Student Information</p>
          </div>
          <div style="padding: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 18px 35px;">
            <div style="border-left: 3px solid #d97706; padding-left: 12px;">
              <p style="margin: 0 0 6px 0; font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; font-family: 'Inter', sans-serif;">Student Name</p>
              <p style="margin: 0; font-size: 20px; font-weight: 900; color: #0f172a; font-family: 'Playfair Display', 'Georgia', serif; letter-spacing: 0.5px;">${data.first_name} ${data.last_name}</p>
            </div>
            <div style="border-left: 3px solid #d97706; padding-left: 12px;">
              <p style="margin: 0 0 6px 0; font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; font-family: 'Inter', sans-serif;">Student ID</p>
              <p style="margin: 0; font-size: 15px; font-weight: 700; color: #334155;">${data.student_id.substring(0, 8).toUpperCase()}</p>
            </div>
            <div style="border-left: 3px solid #d97706; padding-left: 12px;">
              <p style="margin: 0 0 6px 0; font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; font-family: 'Inter', sans-serif;">Class</p>
              <p style="margin: 0; font-size: 15px; font-weight: 700; color: #334155;">${data.class_name || 'N/A'}</p>
            </div>
            <div style="border-left: 3px solid #d97706; padding-left: 12px;">
              <p style="margin: 0 0 6px 0; font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; font-family: 'Inter', sans-serif;">Grade Level</p>
              <p style="margin: 0; font-size: 15px; font-weight: 700; color: #334155;">Grade ${data.grade_level}</p>
            </div>
          </div>
        </div>

        <!-- Executive Rankings Section -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin: 25px 0;">
          <!-- Class Rank Card -->
          <div style="padding: 0; background: white; border: 2px solid #0f172a; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.1);">
            <div style="padding: 10px 18px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); display: flex; align-items: center; justify-content: space-between;">
              <h3 style="margin: 0; font-size: 11px; font-weight: 700; color: #fbbf24; text-transform: uppercase; letter-spacing: 1.5px;">Class Rank</h3>
              ${data.class_rank && data.class_rank <= 3 ? `<span style="font-size: 22px;">${data.class_rank === 1 ? '🥇' : data.class_rank === 2 ? '🥈' : '🥉'}</span>` : ''}
            </div>
            <div style="padding: 18px; text-align: center;">
              <div style="display: flex; align-items: baseline; justify-content: center; margin-bottom: 10px;">
                <span style="font-size: 48px; font-weight: 900; color: #0f172a; line-height: 1;">${data.class_rank || 'N/A'}</span>
                <span style="font-size: 22px; color: #64748b; margin-left: 8px; font-weight: 700;">/ ${data.total_students_in_class || 0}</span>
              </div>
              <div style="padding: 6px 12px; background: rgba(217, 119, 6, 0.1); border-radius: 4px; display: inline-block;">
                <p style="margin: 0; font-size: 9px; color: #d97706; font-weight: 600; letter-spacing: 0.5px;">Out of ${data.total_students_in_class || 0} students in ${data.class_name || 'your class'}</p>
              </div>
            </div>
          </div>
          <!-- Grade Rank Card -->
          <div style="padding: 0; background: white; border: 2px solid #0f172a; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.1);">
            <div style="padding: 10px 18px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); display: flex; align-items: center; justify-content: space-between;">
              <h3 style="margin: 0; font-size: 11px; font-weight: 700; color: #fbbf24; text-transform: uppercase; letter-spacing: 1.5px;">Grade Rank</h3>
              ${data.grade_rank && data.grade_rank <= 3 ? `<span style="font-size: 22px;">${data.grade_rank === 1 ? '🥇' : data.grade_rank === 2 ? '🥈' : '🥉'}</span>` : ''}
            </div>
            <div style="padding: 18px; text-align: center;">
              <div style="display: flex; align-items: baseline; justify-content: center; margin-bottom: 10px;">
                <span style="font-size: 48px; font-weight: 900; color: #0f172a; line-height: 1;">${data.grade_rank || 'N/A'}</span>
                <span style="font-size: 22px; color: #64748b; margin-left: 8px; font-weight: 700;">/ ${data.total_students_in_grade || 0}</span>
              </div>
              <div style="padding: 6px 12px; background: rgba(217, 119, 6, 0.1); border-radius: 4px; display: inline-block;">
                <p style="margin: 0; font-size: 9px; color: #d97706; font-weight: 600; letter-spacing: 0.5px;">Out of ${data.total_students_in_grade || 0} students in Grade ${data.grade_level}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Achievement Text -->
        <div style="margin: 10px 0; text-align: center; font-style: italic; color: #4b5563; font-size: 12px; line-height: 1.5;">
          <p style="margin: 0;">has demonstrated outstanding academic performance with the following achievements:</p>
        </div>

        <!-- Executive Performance Metrics -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin: 25px 0;">
          <div style="padding: 18px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 8px; text-align: center; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.2); position: relative; overflow: hidden;">
            <div style="position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(to right, #d97706, #fbbf24);"></div>
            <p style="margin: 0 0 10px 0; font-size: 10px; text-transform: uppercase; color: #fbbf24; letter-spacing: 2px; font-weight: 800; font-family: 'Inter', sans-serif;">Average Score</p>
            <p style="margin: 0; font-size: 42px; font-weight: 900; color: #ffffff; font-family: 'Playfair Display', 'Georgia', serif; letter-spacing: 1px;">${data.average_score.toFixed(1)}%</p>
          </div>
          <div style="padding: 18px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 8px; text-align: center; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.2); position: relative; overflow: hidden;">
            <div style="position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(to right, #d97706, #fbbf24);"></div>
            <p style="margin: 0 0 10px 0; font-size: 10px; text-transform: uppercase; color: #fbbf24; letter-spacing: 1.5px; font-weight: 700;">Total Assessments</p>
            <p style="margin: 0; font-size: 38px; font-weight: 900; color: #ffffff;">${data.total_assessments}</p>
          </div>
          <div style="padding: 18px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 8px; text-align: center; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.2); position: relative; overflow: hidden;">
            <div style="position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(to right, #d97706, #fbbf24);"></div>
            <p style="margin: 0 0 10px 0; font-size: 10px; text-transform: uppercase; color: #fbbf24; letter-spacing: 1.5px; font-weight: 700;">Subjects</p>
            <p style="margin: 0; font-size: 38px; font-weight: 900; color: #ffffff;">${Object.keys(subjectBreakdown).length}</p>
          </div>
        </div>

        <!-- Subject-wise Performance Breakdown -->
        ${subjectAverages.length > 0 ? `
        <div style="margin: 12px 0;">
          <h2 style="margin: 0 0 8px 0; font-size: 14px; color: #1e3a8a; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #fbbf24; padding-bottom: 6px;">
            📊 Subject-wise Performance
          </h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 10px;">
            <thead>
              <tr style="background: linear-gradient(to right, #1e3a8a, #3b82f6); color: white;">
                <th style="padding: 8px; text-align: left; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Subject</th>
                <th style="padding: 8px; text-align: center; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Tests</th>
                <th style="padding: 8px; text-align: center; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Average</th>
                <th style="padding: 8px; text-align: center; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Grade</th>
              </tr>
            </thead>
            <tbody>
              ${subjectAverages.map((subj, idx) => `
                <tr style="background: ${idx % 2 === 0 ? '#f9fafb' : 'white'}; border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 8px; font-weight: 600; color: #1f2937;">${subj.subject}</td>
                  <td style="padding: 8px; text-align: center; color: #4b5563;">${subj.count}</td>
                  <td style="padding: 8px; text-align: center; font-weight: 700; font-size: 13px; color: ${parseFloat(subj.average) >= 90 ? '#059669' : parseFloat(subj.average) >= 75 ? '#3b82f6' : parseFloat(subj.average) >= 60 ? '#f59e0b' : '#dc2626'};">${subj.average}%</td>
                  <td style="padding: 8px; text-align: center;">
                    <span style="display: inline-block; padding: 4px 8px; border-radius: 12px; font-weight: 600; font-size: 9px; text-transform: uppercase; letter-spacing: 0.3px; ${parseFloat(subj.average) >= 90 ? 'background: #d1fae5; color: #065f46;' : parseFloat(subj.average) >= 75 ? 'background: #dbeafe; color: #1e40af;' : parseFloat(subj.average) >= 60 ? 'background: #fef3c7; color: #92400e;' : 'background: #fee2e2; color: #991b1b;'}">
                      ${parseFloat(subj.average) >= 90 ? 'Excellent' : parseFloat(subj.average) >= 75 ? 'Good' : parseFloat(subj.average) >= 60 ? 'Fair' : 'Poor'}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

          </div>
          
          <!-- Performance Trend Badge -->
          <div style="margin-top: 10px; padding: 10px; background: linear-gradient(to right, rgba(30, 58, 138, 0.08), rgba(59, 130, 246, 0.08)); border-radius: 8px; border-left: 3px solid ${data.performance_trend === 'improving' ? '#10b981' : data.performance_trend === 'declining' ? '#dc2626' : '#3b82f6'};">
            <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
              <span style="font-size: 20px;">${data.performance_trend === 'improving' ? '📈' : data.performance_trend === 'declining' ? '📉' : '📊'}</span>
              <div>
                <p style="margin: 0; font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Trend: <span style="font-weight: 700; color: ${data.performance_trend === 'improving' ? '#10b981' : data.performance_trend === 'declining' ? '#dc2626' : '#3b82f6'};">${data.performance_trend === 'improving' ? 'Improving' : data.performance_trend === 'declining' ? 'Needs Work' : 'Stable'}</span></p>
              </div>
            </div>
          </div>
        </div>

        <!-- Achievement Recognition -->
        <div style="margin: 15px 0; padding: 15px; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); border-radius: 10px; text-align: center; box-shadow: 0 3px 12px rgba(251, 191, 36, 0.3);">
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #78350f; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; font-family: 'Merriweather', 'Georgia', serif;">🌟 Certificate of Excellence 🌟</p>
          <p style="margin: 0; font-size: 11.5px; color: #92400e; font-style: italic; line-height: 1.7; font-family: 'Playfair Display', 'Georgia', serif;">
            This certifies that <strong style="font-weight: 700; font-family: 'Playfair Display', serif;">${data.first_name} ${data.last_name}</strong> has demonstrated exceptional commitment to academic excellence and is hereby recognized for outstanding performance during the academic year ${academicYear}.
          </p>
        </div>

        <!-- Professional Signature Section -->
        <div style="margin-top: 20px; padding-top: 15px; border-top: 2px solid #1e3a8a;">
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 25px; text-align: center;">
            <div>
              <div style="height: 40px; margin-bottom: 8px; border-bottom: 2px solid #1e3a8a;"></div>
              <p style="margin: 0; font-size: 10px; color: #1e3a8a; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; font-family: 'Inter', sans-serif;">Class Teacher</p>
            </div>
            <div>
              <div style="height: 40px; margin-bottom: 8px; border-bottom: 2px solid #1e3a8a;"></div>
              <p style="margin: 0; font-size: 10px; color: #1e3a8a; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; font-family: 'Inter', sans-serif;">Principal</p>
            </div>
            <div>
              <div style="height: 40px; margin-bottom: 8px; border-bottom: 2px solid #1e3a8a;"></div>
              <p style="margin: 0; font-size: 10px; color: #1e3a8a; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; font-family: 'Inter', sans-serif;">School Seal</p>
            </div>
          </div>
        </div>

        <!-- Executive Footer -->
        <div style="margin-top: 25px; padding: 15px 20px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 8px; border-top: 3px solid #d97706;">
          <div style="text-align: center; margin-bottom: 10px;">
            <p style="margin: 0 0 6px 0; font-size: 10px; color: #fbbf24; font-weight: 700; letter-spacing: 1px;">ISSUE DATE: ${currentDate}</p>
            <p style="margin: 0; font-size: 9px; color: #94a3b8; font-weight: 600;">DOCUMENT ID: ${data.student_id.substring(0, 8).toUpperCase()}-${new Date().getFullYear()}</p>
          </div>
          <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(217, 119, 6, 0.3); text-align: center;">
            <p style="margin: 0; font-size: 8px; color: #cbd5e1; line-height: 1.6;">
              This document is digitally generated and certified. Verification available through school administration.<br/>
              <span style="color: #94a3b8;">Powered by <strong style="color: #fbbf24;">Catalyst Wells</strong> - Educational Management Platform | © ${new Date().getFullYear()}</span>
            </p>
          </div>
        </div>

      </div>
    </div>

    <!-- PAGE 2: DETAILED MARKS SHEET -->
    <div class="pdf-page-2" style="width: 210mm; min-height: 297mm; padding: 15mm 20mm; font-family: 'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif; background: linear-gradient(to bottom, #ffffff 0%, #f8fafc 100%); box-sizing: border-box; position: relative; page-break-before: always;">
      
      <!-- Premium Multi-Layer Border -->
      <div style="position: absolute; top: 8mm; left: 12mm; right: 12mm; bottom: 8mm; border: 3px solid #0f172a; pointer-events: none;"></div>
      <div style="position: absolute; top: 9mm; left: 13mm; right: 13mm; bottom: 9mm; border: 1px solid #cbd5e1; pointer-events: none;"></div>
      <div style="position: absolute; top: 8mm; left: 12mm; width: 70mm; height: 4px; background: linear-gradient(to right, #d97706, #f59e0b, #fbbf24); pointer-events: none;"></div>
      <div style="position: absolute; top: 8mm; right: 12mm; width: 70mm; height: 4px; background: linear-gradient(to left, #d97706, #f59e0b, #fbbf24); pointer-events: none;"></div>
      <div style="position: absolute; bottom: 8mm; left: 12mm; width: 70mm; height: 4px; background: linear-gradient(to right, #d97706, #f59e0b, #fbbf24); pointer-events: none;"></div>
      <div style="position: absolute; bottom: 8mm; right: 12mm; width: 70mm; height: 4px; background: linear-gradient(to left, #d97706, #f59e0b, #fbbf24); pointer-events: none;"></div>
      
      <!-- Corner Decorations -->
      <div style="position: absolute; top: 8mm; left: 12mm; width: 15mm; height: 15mm; border-top: 3px solid #d97706; border-left: 3px solid #d97706; pointer-events: none;"></div>
      <div style="position: absolute; top: 8mm; right: 12mm; width: 15mm; height: 15mm; border-top: 3px solid #d97706; border-right: 3px solid #d97706; pointer-events: none;"></div>
      <div style="position: absolute; bottom: 8mm; left: 12mm; width: 15mm; height: 15mm; border-bottom: 3px solid #d97706; border-left: 3px solid #d97706; pointer-events: none;"></div>
      <div style="position: absolute; bottom: 8mm; right: 12mm; width: 15mm; height: 15mm; border-bottom: 3px solid #d97706; border-right: 3px solid #d97706; pointer-events: none;"></div>
      
      <!-- Watermark -->
      <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 120px; color: rgba(15, 23, 42, 0.02); font-weight: 900; font-family: 'Playfair Display', serif; letter-spacing: 10px; pointer-events: none; user-select: none;">OFFICIAL</div>

      <!-- Content Container -->
      <div style="position: relative; z-index: 1;">
        
        <!-- Premium Page 2 Header -->
        <div style="position: relative; margin-bottom: 20px;">
          <!-- Decorative Top Banner -->
          <div style="position: absolute; top: -5px; left: 0; right: 0; height: 6px; background: linear-gradient(to right, #d97706 0%, #f59e0b 50%, #d97706 100%); border-radius: 3px;"></div>
          
          <div style="text-align: center; padding: 20px 25px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%); border-radius: 8px; position: relative; overflow: hidden; border: 2px solid #d97706; box-shadow: 0 6px 20px rgba(15, 23, 42, 0.25);">
            <!-- Diagonal Pattern Background -->
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(217, 119, 6, 0.03) 35px, rgba(217, 119, 6, 0.03) 70px); pointer-events: none;"></div>
            
            <!-- Top Gold Bar -->
            <div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(to right, transparent 0%, #d97706 20%, #f59e0b 50%, #d97706 80%, transparent 100%);"></div>
            
            <div style="position: relative; z-index: 1; display: flex; align-items: center; justify-content: center; gap: 12px;">
              <div style="width: 45px; height: 45px; background: linear-gradient(135deg, #d97706, #f59e0b); border-radius: 8px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(217, 119, 6, 0.4); border: 2px solid #fbbf24;">
                <span style="font-size: 24px;">📊</span>
              </div>
              <h2 style="margin: 0; font-size: 19px; color: #fbbf24; font-weight: 900; text-transform: uppercase; letter-spacing: 3px; font-family: 'Merriweather', 'Georgia', serif; text-shadow: 0 2px 8px rgba(0,0,0,0.4);">
                Detailed Assessment Records
              </h2>
              <div style="display: inline-block; padding: 4px 12px; background: rgba(251, 191, 36, 0.2); border: 1px solid #fbbf24; border-radius: 12px;">
                <span style="font-size: 10px; color: #fbbf24; font-weight: 700; letter-spacing: 1px; font-family: 'Inter', sans-serif;">PAGE 2 OF 2</span>
              </div>
            </div>
            
            <!-- Bottom Gold Bar -->
            <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 4px; background: linear-gradient(to right, transparent 0%, #d97706 20%, #f59e0b 50%, #d97706 80%, transparent 100%);"></div>
          </div>
          
          <!-- Decorative Bottom Banner -->
          <div style="position: absolute; bottom: -5px; left: 0; right: 0; height: 6px; background: linear-gradient(to right, #d97706 0%, #f59e0b 50%, #d97706 100%); border-radius: 3px;"></div>
        </div>

        <!-- Subject-wise Detailed Marks -->
        ${Object.keys(subjectBreakdown).map((subject, subjectIdx) => `
          <div style="margin-bottom: 18px;">
            <h3 style="margin: 0 0 12px 0; padding: 10px 15px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #fbbf24; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; border-radius: 6px; box-shadow: 0 2px 8px rgba(15, 23, 42, 0.15); display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 16px;">📚</span> ${subject}
            </h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 10px; background: white; border: 2px solid #e2e8f0; border-radius: 6px; overflow: hidden;">
            <thead>
              <tr style="background: #f8fafc; border-bottom: 2px solid #cbd5e1;">
                <th style="padding: 8px 10px; text-align: left; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; border-right: 1px solid #e2e8f0;">Assessment Title</th>
                <th style="padding: 8px 10px; text-align: center; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; border-right: 1px solid #e2e8f0;">Score</th>
                <th style="padding: 8px 10px; text-align: center; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; border-right: 1px solid #e2e8f0;">Max</th>
                <th style="padding: 8px 10px; text-align: center; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; border-right: 1px solid #e2e8f0;">Percentage</th>
                <th style="padding: 8px 10px; text-align: center; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #475569;">Grade</th>
              </tr>
            </thead>
            <tbody>
              ${subjectBreakdown[subject].scores.map((scoreData: any, idx: number) => `
                  <tr style="background: ${idx % 2 === 0 ? 'white' : '#f8fafc'}; border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 8px 10px; font-weight: 600; color: #334155; border-right: 1px solid #e2e8f0;">${scoreData.title || 'Assessment ' + (idx + 1)}</td>
                    <td style="padding: 8px 10px; text-align: center; font-weight: 700; color: #1e40af; border-right: 1px solid #e2e8f0;">${scoreData.score !== null && scoreData.score !== undefined ? scoreData.score : 'N/A'}</td>
                    <td style="padding: 8px 10px; text-align: center; color: #64748b; border-right: 1px solid #e2e8f0; font-weight: 600;">${scoreData.maxScore || 100}</td>
                    <td style="padding: 8px 10px; text-align: center; font-weight: 700; font-size: 10px; color: ${scoreData.percentage >= 90 ? '#16a34a' : scoreData.percentage >= 75 ? '#2563eb' : scoreData.percentage >= 60 ? '#ea580c' : '#dc2626'}; border-right: 1px solid #e2e8f0;">${scoreData.percentage.toFixed(1)}%</td>
                    <td style="padding: 8px 10px; text-align: center;">
                      <span style="display: inline-block; padding: 4px 10px; border-radius: 4px; font-weight: 700; font-size: 9px; text-transform: uppercase; ${scoreData.percentage >= 90 ? 'background: #d1fae5; color: #15803d;' : scoreData.percentage >= 75 ? 'background: #dbeafe; color: #1e40af;' : scoreData.percentage >= 60 ? 'background: #fef3c7; color: #92400e;' : 'background: #fee2e2; color: #991b1b;'}">
                        ${scoreData.percentage >= 90 ? 'A+' : scoreData.percentage >= 85 ? 'A' : scoreData.percentage >= 75 ? 'B+' : scoreData.percentage >= 70 ? 'B' : scoreData.percentage >= 60 ? 'C' : scoreData.percentage >= 50 ? 'D' : 'F'}
                      </span>
                    </td>
                  </tr>
              `).join('')}
              <tr style="background: linear-gradient(to right, rgba(30, 58, 138, 0.08), rgba(59, 130, 246, 0.08)); border-top: 2px solid #1e3a8a;">
                <td style="padding: 8px; font-weight: 700; color: #1e3a8a; text-transform: uppercase; font-size: 10px;" colspan="3">Subject Average</td>
                <td style="padding: 8px; text-align: center; font-weight: 800; font-size: 11px; color: #1e3a8a; border-right: 1px solid #e5e7eb;">${(subjectBreakdown[subject].total / subjectBreakdown[subject].count).toFixed(1)}%</td>
                <td style="padding: 8px; text-align: center;">
                  <span style="display: inline-block; padding: 4px 10px; border-radius: 10px; font-weight: 700; font-size: 9px; text-transform: uppercase; ${(subjectBreakdown[subject].total / subjectBreakdown[subject].count) >= 90 ? 'background: #d1fae5; color: #065f46;' : (subjectBreakdown[subject].total / subjectBreakdown[subject].count) >= 75 ? 'background: #dbeafe; color: #1e40af;' : (subjectBreakdown[subject].total / subjectBreakdown[subject].count) >= 60 ? 'background: #fef3c7; color: #92400e;' : 'background: #fee2e2; color: #991b1b;'}">
                    ${(subjectBreakdown[subject].total / subjectBreakdown[subject].count) >= 90 ? 'Excellent' : (subjectBreakdown[subject].total / subjectBreakdown[subject].count) >= 75 ? 'Good' : (subjectBreakdown[subject].total / subjectBreakdown[subject].count) >= 60 ? 'Fair' : 'Poor'}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        `).join('')}

        <!-- Grading Scale Reference -->
        <div style="margin: 15px 0; padding: 10px 12px; background: rgba(30, 58, 138, 0.03); border: 1px solid #e5e7eb; border-radius: 6px;">
          <h4 style="margin: 0 0 8px 0; font-size: 11px; color: #1e3a8a; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Grading Scale</h4>
          <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; font-size: 8px;">
            <div style="text-align: center; padding: 6px; background: #d1fae5; border-radius: 4px;">
              <p style="margin: 0; font-weight: 800; color: #065f46;">A+ (90-100)</p>
              <p style="margin: 2px 0 0 0; color: #047857;">Excellent</p>
            </div>
            <div style="text-align: center; padding: 6px; background: #dbeafe; border-radius: 4px;">
              <p style="margin: 0; font-weight: 800; color: #1e40af;">A (85-89)</p>
              <p style="margin: 2px 0 0 0; color: #1e3a8a;">Outstanding</p>
            </div>
            <div style="text-align: center; padding: 6px; background: #dbeafe; border-radius: 4px;">
              <p style="margin: 0; font-weight: 800; color: #1e40af;">B+ (75-84)</p>
              <p style="margin: 2px 0 0 0; color: #1e3a8a;">Very Good</p>
            </div>
            <div style="text-align: center; padding: 6px; background: #e0e7ff; border-radius: 4px;">
              <p style="margin: 0; font-weight: 800; color: #4338ca;">B (70-74)</p>
              <p style="margin: 2px 0 0 0; color: #4f46e5;">Good</p>
            </div>
            <div style="text-align: center; padding: 6px; background: #fef3c7; border-radius: 4px;">
              <p style="margin: 0; font-weight: 800; color: #92400e;">C (60-69)</p>
              <p style="margin: 2px 0 0 0; color: #b45309;">Fair</p>
            </div>
            <div style="text-align: center; padding: 6px; background: #fed7aa; border-radius: 4px;">
              <p style="margin: 0; font-weight: 800; color: #9a3412;">D (50-59)</p>
              <p style="margin: 2px 0 0 0; color: #c2410c;">Pass</p>
            </div>
            <div style="text-align: center; padding: 6px; background: #fee2e2; border-radius: 4px;">
              <p style="margin: 0; font-weight: 800; color: #991b1b;">F (<50)</p>
              <p style="margin: 2px 0 0 0; color: #b91c1c;">Fail</p>
            </div>
          </div>
        </div>

        <!-- Executive Footer -->
        <div style="margin-top: 20px; padding: 15px 20px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 8px; border-top: 3px solid #d97706; text-align: center;">
          <p style="margin: 0 0 8px 0; font-size: 9px; color: #fbbf24; font-weight: 700; letter-spacing: 1px;">PAGE 2 OF 2 - DETAILED MARKS SHEET</p>
          <div style="padding-top: 8px; border-top: 1px solid rgba(217, 119, 6, 0.3);">
            <p style="margin: 0; font-size: 8px; color: #cbd5e1;">Powered by <strong style="color: #fbbf24;">Catalyst Wells</strong> - Educational Management Platform | © ${new Date().getFullYear()}</p>
          </div>
        </div>

      </div>
    </div>
  `
}
