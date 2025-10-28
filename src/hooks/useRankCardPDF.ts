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

      // Create a temporary container for the rank card
      const container = document.createElement('div')
      container.style.position = 'absolute'
      container.style.left = '-9999px'
      container.style.width = '210mm' // A4 width
      container.style.background = 'white'
      document.body.appendChild(container)

      // Generate the rank card HTML with assessments
      container.innerHTML = generateRankCardHTML(rankData, assessmentsData.assessments || [])

      // Wait for fonts and images to load
      await new Promise(resolve => setTimeout(resolve, 800))

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
    <div class="pdf-page-1" style="width: 210mm; min-height: 297mm; padding: 15mm 20mm; font-family: 'Arial', 'Helvetica', sans-serif; background: linear-gradient(to bottom, #ffffff 0%, #f8fafc 100%); box-sizing: border-box; position: relative;">
      
      <!-- Premium Border -->
      <div style="position: absolute; top: 8mm; left: 12mm; right: 12mm; bottom: 8mm; border: 2px solid #0f172a; pointer-events: none;"></div>
      <div style="position: absolute; top: 8mm; left: 12mm; width: 60mm; height: 3px; background: linear-gradient(to right, #d97706, #f59e0b, #fbbf24); pointer-events: none;"></div>
      <div style="position: absolute; top: 8mm; right: 12mm; width: 60mm; height: 3px; background: linear-gradient(to left, #d97706, #f59e0b, #fbbf24); pointer-events: none;"></div>
      

      <!-- Content Container -->
      <div style="position: relative; z-index: 1;">
        
        <!-- Executive Header Section -->
        <div style="text-align: center; padding: 30px 20px 25px 20px; margin-bottom: 25px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 8px; position: relative; overflow: hidden;">
          <div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(to right, #d97706, #f59e0b, #fbbf24);"></div>
          ${data.school_logo ? `<div style="margin-bottom: 15px;"><img src="${data.school_logo}" alt="School Logo" style="width: 80px; height: 80px; border-radius: 50%; border: 4px solid #d97706; box-shadow: 0 6px 20px rgba(217, 119, 6, 0.4);" /></div>` : `<div style="margin-bottom: 15px; width: 80px; height: 80px; margin-left: auto; margin-right: auto; border-radius: 50%; background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%); display: flex; align-items: center; justify-content: center; border: 4px solid #fbbf24; box-shadow: 0 6px 20px rgba(217, 119, 6, 0.4);"><span style="font-size: 36px; color: white;">🎓</span></div>`}
          <h1 style="margin: 15px 0 8px 0; font-size: 32px; color: #ffffff; font-weight: 900; text-transform: uppercase; letter-spacing: 4px; font-family: 'Arial', sans-serif; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
            ${data.school_name || 'School Name'}
          </h1>
          <div style="display: inline-block; padding: 2px 20px; background: rgba(217, 119, 6, 0.2); border: 1px solid #d97706; border-radius: 20px; margin: 12px 0;">
            <p style="margin: 5px 0; font-size: 11px; color: #fbbf24; font-weight: 600; letter-spacing: 1px;">ACADEMIC YEAR ${academicYear}</p>
          </div>
          <div style="margin-top: 15px; padding: 12px 35px; background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%); color: white; display: inline-block; border-radius: 6px; font-size: 15px; font-weight: 800; letter-spacing: 3px; box-shadow: 0 4px 15px rgba(217, 119, 6, 0.4); text-shadow: 0 1px 2px rgba(0,0,0,0.2);">
            ACADEMIC PERFORMANCE CERTIFICATE
          </div>
        </div>

        <!-- Executive Student Information Card -->
        <div style="margin: 25px 0; padding: 0; background: white; border: 2px solid #0f172a; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.1);">
          <div style="padding: 12px 20px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-bottom: 3px solid #d97706;">
            <p style="margin: 0; font-size: 11px; color: #fbbf24; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">Student Information</p>
          </div>
          <div style="padding: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 18px 35px;">
            <div style="border-left: 3px solid #d97706; padding-left: 12px;">
              <p style="margin: 0 0 6px 0; font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Student Name</p>
              <p style="margin: 0; font-size: 19px; font-weight: 800; color: #0f172a;">${data.first_name} ${data.last_name}</p>
            </div>
            <div style="border-left: 3px solid #d97706; padding-left: 12px;">
              <p style="margin: 0 0 6px 0; font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Student ID</p>
              <p style="margin: 0; font-size: 15px; font-weight: 700; color: #334155;">${data.student_id.substring(0, 8).toUpperCase()}</p>
            </div>
            <div style="border-left: 3px solid #d97706; padding-left: 12px;">
              <p style="margin: 0 0 6px 0; font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Class</p>
              <p style="margin: 0; font-size: 15px; font-weight: 700; color: #334155;">${data.class_name || 'N/A'}</p>
            </div>
            <div style="border-left: 3px solid #d97706; padding-left: 12px;">
              <p style="margin: 0 0 6px 0; font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Grade Level</p>
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
            <p style="margin: 0 0 10px 0; font-size: 10px; text-transform: uppercase; color: #fbbf24; letter-spacing: 1.5px; font-weight: 700;">Average Score</p>
            <p style="margin: 0; font-size: 38px; font-weight: 900; color: #ffffff;">${data.average_score.toFixed(1)}%</p>
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
          <p style="margin: 0 0 8px 0; font-size: 13px; color: #78350f; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">🌟 Certificate of Excellence 🌟</p>
          <p style="margin: 0; font-size: 11px; color: #92400e; font-style: italic; line-height: 1.5;">
            This certifies that <strong>${data.first_name} ${data.last_name}</strong> has demonstrated exceptional commitment to academic excellence and is hereby recognized for outstanding performance during the academic year ${academicYear}.
          </p>
        </div>

        <!-- Professional Signature Section -->
        <div style="margin-top: 20px; padding-top: 15px; border-top: 2px solid #1e3a8a;">
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 25px; text-align: center;">
            <div>
              <div style="height: 40px; margin-bottom: 8px; border-bottom: 2px solid #1e3a8a;"></div>
              <p style="margin: 0; font-size: 10px; color: #1e3a8a; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Class Teacher</p>
            </div>
            <div>
              <div style="height: 40px; margin-bottom: 8px; border-bottom: 2px solid #1e3a8a;"></div>
              <p style="margin: 0; font-size: 10px; color: #1e3a8a; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Principal</p>
            </div>
            <div>
              <div style="height: 40px; margin-bottom: 8px; border-bottom: 2px solid #1e3a8a;"></div>
              <p style="margin: 0; font-size: 10px; color: #1e3a8a; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">School Seal</p>
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
    <div class="pdf-page-2" style="width: 210mm; min-height: 297mm; padding: 15mm 20mm; font-family: 'Arial', 'Helvetica', sans-serif; background: linear-gradient(to bottom, #ffffff 0%, #f8fafc 100%); box-sizing: border-box; position: relative; page-break-before: always;">
      
      <!-- Premium Border -->
      <div style="position: absolute; top: 8mm; left: 12mm; right: 12mm; bottom: 8mm; border: 2px solid #0f172a; pointer-events: none;"></div>
      <div style="position: absolute; top: 8mm; left: 12mm; width: 60mm; height: 3px; background: linear-gradient(to right, #d97706, #f59e0b, #fbbf24); pointer-events: none;"></div>
      <div style="position: absolute; top: 8mm; right: 12mm; width: 60mm; height: 3px; background: linear-gradient(to left, #d97706, #f59e0b, #fbbf24); pointer-events: none;"></div>

      <!-- Content Container -->
      <div style="position: relative; z-index: 1;">
        
        <!-- Page 2 Header -->
        <div style="text-align: center; padding: 12px 20px; margin-bottom: 20px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 8px; position: relative; overflow: hidden;">
          <div style="position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(to right, #d97706, #f59e0b, #fbbf24);"></div>
          <h2 style="margin: 0; font-size: 16px; color: #fbbf24; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; font-family: 'Arial', sans-serif;">
            📊 DETAILED ASSESSMENT RECORDS - PAGE 2
          </h2>
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
