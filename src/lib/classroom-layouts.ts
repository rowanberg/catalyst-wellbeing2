export interface LayoutTemplate {
  id: string
  name: string
  country: string
  countryFlag: string
  rows: number
  cols: number
  description: string
  seatPattern: ('seat' | 'empty' | 'teacher')[]
}

// Global Classroom Layout Templates from 22 Different Countries
export const LAYOUT_TEMPLATES: LayoutTemplate[] = [
  {
    id: 'usa-traditional',
    name: 'USA Traditional Rows',
    country: 'United States',
    countryFlag: '🇺🇸',
    rows: 5,
    cols: 6,
    description: 'Classic American classroom with forward-facing rows',
    seatPattern: Array(30).fill('seat')
  },
  {
    id: 'uk-grouped',
    name: 'UK Grouped Tables',
    country: 'United Kingdom',
    countryFlag: '🇬🇧',
    rows: 4,
    cols: 6,
    description: 'British style with clusters of 4-6 students',
    seatPattern: ['seat', 'seat', 'empty', 'seat', 'seat', 'empty',
                  'seat', 'seat', 'empty', 'seat', 'seat', 'empty',
                  'empty', 'empty', 'empty', 'empty', 'empty', 'empty',
                  'seat', 'seat', 'empty', 'seat', 'seat', 'empty']
  },
  {
    id: 'finland-flexible',
    name: 'Finland Flexible Learning',
    country: 'Finland',
    countryFlag: '🇫🇮',
    rows: 4,
    cols: 5,
    description: 'Open arrangement promoting collaboration',
    seatPattern: ['seat', 'seat', 'empty', 'seat', 'seat',
                  'seat', 'empty', 'empty', 'empty', 'seat',
                  'empty', 'seat', 'seat', 'seat', 'empty',
                  'seat', 'seat', 'empty', 'seat', 'seat']
  },
  {
    id: 'japan-columns',
    name: 'Japan Orderly Columns',
    country: 'Japan',
    countryFlag: '🇯🇵',
    rows: 6,
    cols: 6,
    description: 'Structured columns with precise spacing',
    seatPattern: Array(36).fill('seat')
  },
  {
    id: 'singapore-ushape',
    name: 'Singapore U-Shape',
    country: 'Singapore',
    countryFlag: '🇸🇬',
    rows: 4,
    cols: 7,
    description: 'U-shaped arrangement for discussion',
    seatPattern: ['seat', 'seat', 'seat', 'empty', 'seat', 'seat', 'seat',
                  'seat', 'empty', 'empty', 'empty', 'empty', 'empty', 'seat',
                  'seat', 'empty', 'empty', 'empty', 'empty', 'empty', 'seat',
                  'seat', 'seat', 'seat', 'empty', 'seat', 'seat', 'seat']
  },
  {
    id: 'germany-pairs',
    name: 'Germany Partner Desks',
    country: 'Germany',
    countryFlag: '🇩🇪',
    rows: 5,
    cols: 4,
    description: 'Traditional paired seating',
    seatPattern: Array(20).fill('seat')
  },
  {
    id: 'netherlands-circle',
    name: 'Netherlands Discussion Circle',
    country: 'Netherlands',
    countryFlag: '🇳🇱',
    rows: 5,
    cols: 5,
    description: 'Circular arrangement for equality',
    seatPattern: ['empty', 'seat', 'seat', 'seat', 'empty',
                  'seat', 'empty', 'empty', 'empty', 'seat',
                  'seat', 'empty', 'empty', 'empty', 'seat',
                  'seat', 'empty', 'empty', 'empty', 'seat',
                  'empty', 'seat', 'seat', 'seat', 'empty']
  },
  {
    id: 'sweden-collaborative',
    name: 'Sweden Collaborative Pods',
    country: 'Sweden',
    countryFlag: '🇸🇪',
    rows: 4,
    cols: 6,
    description: 'Small group pods for teamwork',
    seatPattern: ['seat', 'seat', 'empty', 'seat', 'seat', 'empty',
                  'seat', 'seat', 'empty', 'seat', 'seat', 'empty',
                  'empty', 'empty', 'empty', 'empty', 'empty', 'empty',
                  'seat', 'seat', 'empty', 'seat', 'seat', 'empty']
  },
  {
    id: 'south-korea-focused',
    name: 'South Korea Focused Rows',
    country: 'South Korea',
    countryFlag: '🇰🇷',
    rows: 7,
    cols: 5,
    description: 'Dense arrangement for large classes',
    seatPattern: Array(35).fill('seat')
  },
  {
    id: 'australia-flexible',
    name: 'Australia Flexible Zones',
    country: 'Australia',
    countryFlag: '🇦🇺',
    rows: 4,
    cols: 6,
    description: 'Mixed zones for different activities',
    seatPattern: ['seat', 'seat', 'empty', 'empty', 'seat', 'seat',
                  'seat', 'seat', 'empty', 'empty', 'seat', 'seat',
                  'empty', 'empty', 'seat', 'seat', 'empty', 'empty',
                  'seat', 'seat', 'seat', 'seat', 'seat', 'seat']
  },
  {
    id: 'canada-inclusive',
    name: 'Canada Inclusive Circle',
    country: 'Canada',
    countryFlag: '🇨🇦',
    rows: 5,
    cols: 6,
    description: 'Open circle promoting inclusion',
    seatPattern: ['seat', 'seat', 'seat', 'seat', 'seat', 'seat',
                  'seat', 'empty', 'empty', 'empty', 'empty', 'seat',
                  'seat', 'empty', 'empty', 'empty', 'empty', 'seat',
                  'seat', 'empty', 'empty', 'empty', 'empty', 'seat',
                  'seat', 'seat', 'seat', 'seat', 'seat', 'seat']
  },
  {
    id: 'france-traditional',
    name: 'France Classic Arrangement',
    country: 'France',
    countryFlag: '🇫🇷',
    rows: 5,
    cols: 5,
    description: 'Traditional French classroom setup',
    seatPattern: Array(25).fill('seat')
  },
  {
    id: 'italy-grouped',
    name: 'Italy Social Groups',
    country: 'Italy',
    countryFlag: '🇮🇹',
    rows: 4,
    cols: 5,
    description: 'Groups of 4-5 for discussion',
    seatPattern: ['seat', 'seat', 'empty', 'seat', 'seat',
                  'seat', 'seat', 'empty', 'seat', 'seat',
                  'empty', 'empty', 'empty', 'empty', 'empty',
                  'seat', 'seat', 'empty', 'seat', 'seat']
  },
  {
    id: 'spain-horseshoe',
    name: 'Spain Horseshoe Setup',
    country: 'Spain',
    countryFlag: '🇪🇸',
    rows: 4,
    cols: 6,
    description: 'Horseshoe for teacher interaction',
    seatPattern: ['seat', 'seat', 'seat', 'seat', 'seat', 'seat',
                  'seat', 'empty', 'empty', 'empty', 'empty', 'seat',
                  'seat', 'empty', 'empty', 'empty', 'empty', 'seat',
                  'seat', 'seat', 'empty', 'empty', 'seat', 'seat']
  },
  {
    id: 'norway-outdoor',
    name: 'Norway Nature-Inspired',
    country: 'Norway',
    countryFlag: '🇳🇴',
    rows: 4,
    cols: 5,
    description: 'Flexible outdoor-indoor hybrid',
    seatPattern: ['seat', 'empty', 'seat', 'empty', 'seat',
                  'empty', 'seat', 'seat', 'seat', 'empty',
                  'seat', 'seat', 'empty', 'seat', 'seat',
                  'empty', 'seat', 'seat', 'seat', 'empty']
  },
  {
    id: 'denmark-democratic',
    name: 'Denmark Democratic Circle',
    country: 'Denmark',
    countryFlag: '🇩🇰',
    rows: 5,
    cols: 5,
    description: 'Equal participation circle',
    seatPattern: ['empty', 'seat', 'seat', 'seat', 'empty',
                  'seat', 'seat', 'empty', 'seat', 'seat',
                  'seat', 'empty', 'empty', 'empty', 'seat',
                  'seat', 'seat', 'empty', 'seat', 'seat',
                  'empty', 'seat', 'seat', 'seat', 'empty']
  },
  {
    id: 'new-zealand-mixed',
    name: 'New Zealand Mixed Learning',
    country: 'New Zealand',
    countryFlag: '🇳🇿',
    rows: 4,
    cols: 6,
    description: 'Mixed individual and group areas',
    seatPattern: ['seat', 'seat', 'empty', 'seat', 'seat', 'seat',
                  'seat', 'seat', 'empty', 'seat', 'seat', 'seat',
                  'empty', 'empty', 'empty', 'empty', 'empty', 'empty',
                  'seat', 'seat', 'seat', 'seat', 'seat', 'seat']
  },
  {
    id: 'switzerland-precision',
    name: 'Switzerland Precise Grid',
    country: 'Switzerland',
    countryFlag: '🇨🇭',
    rows: 5,
    cols: 5,
    description: 'Orderly Swiss precision',
    seatPattern: Array(25).fill('seat')
  },
  {
    id: 'china-large-class',
    name: 'China Large Classroom',
    country: 'China',
    countryFlag: '🇨🇳',
    rows: 8,
    cols: 6,
    description: 'High-capacity traditional rows',
    seatPattern: Array(48).fill('seat')
  },
  {
    id: 'india-flexible',
    name: 'India Flexible Groups',
    country: 'India',
    countryFlag: '🇮🇳',
    rows: 5,
    cols: 6,
    description: 'Adaptable group arrangements',
    seatPattern: ['seat', 'seat', 'empty', 'seat', 'seat', 'empty',
                  'seat', 'seat', 'empty', 'seat', 'seat', 'empty',
                  'empty', 'empty', 'empty', 'empty', 'empty', 'empty',
                  'seat', 'seat', 'seat', 'seat', 'seat', 'seat',
                  'seat', 'seat', 'seat', 'seat', 'seat', 'seat']
  },
  {
    id: 'brazil-community',
    name: 'Brazil Community Circle',
    country: 'Brazil',
    countryFlag: '🇧🇷',
    rows: 5,
    cols: 6,
    description: 'Community-focused circular setup',
    seatPattern: ['seat', 'seat', 'seat', 'seat', 'seat', 'seat',
                  'seat', 'empty', 'empty', 'empty', 'empty', 'seat',
                  'seat', 'empty', 'empty', 'empty', 'empty', 'seat',
                  'seat', 'empty', 'empty', 'empty', 'empty', 'seat',
                  'seat', 'seat', 'seat', 'seat', 'seat', 'seat']
  },
  {
    id: 'israel-discussion',
    name: 'Israel Discussion Format',
    country: 'Israel',
    countryFlag: '🇮🇱',
    rows: 4,
    cols: 5,
    description: 'Setup for Socratic discussion',
    seatPattern: ['seat', 'seat', 'empty', 'seat', 'seat',
                  'seat', 'empty', 'empty', 'empty', 'seat',
                  'seat', 'empty', 'empty', 'empty', 'seat',
                  'seat', 'seat', 'seat', 'seat', 'seat']
  },
  // Tamil Nadu, India - Specific Regional Layouts
  {
    id: 'tamilnadu-government',
    name: 'Tamil Nadu Government School',
    country: 'Tamil Nadu, India',
    countryFlag: '🇮🇳',
    rows: 6,
    cols: 5,
    description: 'Standard TN government school with rows for 30-40 students',
    seatPattern: Array(30).fill('seat')
  },
  {
    id: 'tamilnadu-cbse',
    name: 'Tamil Nadu CBSE Pattern',
    country: 'Tamil Nadu, India',
    countryFlag: '🇮🇳',
    rows: 5,
    cols: 6,
    description: 'CBSE curriculum classroom with grouped seating',
    seatPattern: ['seat', 'seat', 'empty', 'seat', 'seat', 'empty',
                  'seat', 'seat', 'empty', 'seat', 'seat', 'empty',
                  'seat', 'seat', 'empty', 'seat', 'seat', 'empty',
                  'empty', 'empty', 'empty', 'empty', 'empty', 'empty',
                  'seat', 'seat', 'seat', 'seat', 'seat', 'seat']
  },
  {
    id: 'tamilnadu-matriculation',
    name: 'Tamil Nadu Matriculation',
    country: 'Tamil Nadu, India',
    countryFlag: '🇮🇳',
    rows: 7,
    cols: 5,
    description: 'Matriculation school traditional bench seating',
    seatPattern: Array(35).fill('seat')
  },
  {
    id: 'tamilnadu-smart-class',
    name: 'Tamil Nadu Smart Classroom',
    country: 'Tamil Nadu, India',
    countryFlag: '🇮🇳',
    rows: 4,
    cols: 6,
    description: 'Modern smart classroom with U-shape for digital learning',
    seatPattern: ['seat', 'seat', 'seat', 'seat', 'seat', 'seat',
                  'seat', 'empty', 'empty', 'empty', 'empty', 'seat',
                  'seat', 'empty', 'empty', 'empty', 'empty', 'seat',
                  'seat', 'seat', 'seat', 'seat', 'seat', 'seat']
  },
  {
    id: 'tamilnadu-activity',
    name: 'Tamil Nadu Activity-Based',
    country: 'Tamil Nadu, India',
    countryFlag: '🇮🇳',
    rows: 5,
    cols: 5,
    description: 'Activity-based learning with flexible group zones',
    seatPattern: ['seat', 'seat', 'empty', 'seat', 'seat',
                  'seat', 'seat', 'empty', 'seat', 'seat',
                  'empty', 'empty', 'empty', 'empty', 'empty',
                  'seat', 'seat', 'seat', 'seat', 'seat',
                  'seat', 'seat', 'seat', 'seat', 'seat']
  },
  
  // Large Classroom Layouts (50-100 Students)
  {
    id: 'lecture-hall-50',
    name: 'Lecture Hall - 50 Seats',
    country: 'Global',
    countryFlag: '🌍',
    rows: 5,
    cols: 10,
    description: 'Standard lecture hall with center aisle for 50 students',
    seatPattern: [
      'seat', 'seat', 'seat', 'seat', 'empty', 'empty', 'seat', 'seat', 'seat', 'seat',
      'seat', 'seat', 'seat', 'seat', 'empty', 'empty', 'seat', 'seat', 'seat', 'seat',
      'seat', 'seat', 'seat', 'seat', 'empty', 'empty', 'seat', 'seat', 'seat', 'seat',
      'seat', 'seat', 'seat', 'seat', 'empty', 'empty', 'seat', 'seat', 'seat', 'seat',
      'seat', 'seat', 'seat', 'seat', 'seat', 'seat', 'seat', 'seat', 'seat', 'seat'
    ]
  },
  {
    id: 'auditorium-60',
    name: 'Auditorium - 60 Seats',
    country: 'Global',
    countryFlag: '🌍',
    rows: 6,
    cols: 10,
    description: 'Tiered auditorium seating with aisles',
    seatPattern: Array(60).fill('seat')
  },
  {
    id: 'large-traditional-70',
    name: 'Large Traditional - 70 Seats',
    country: 'Global',
    countryFlag: '🌍',
    rows: 7,
    cols: 10,
    description: 'Large classroom with traditional row arrangement',
    seatPattern: Array(70).fill('seat')
  },
  {
    id: 'university-lecture-80',
    name: 'University Lecture Hall - 80 Seats',
    country: 'Global',
    countryFlag: '🌍',
    rows: 8,
    cols: 10,
    description: 'University-style lecture hall with tiered seating',
    seatPattern: Array(80).fill('seat')
  },
  {
    id: 'mega-classroom-90',
    name: 'Mega Classroom - 90 Seats',
    country: 'Global',
    countryFlag: '🌍',
    rows: 9,
    cols: 10,
    description: 'High-capacity classroom for large groups',
    seatPattern: Array(90).fill('seat')
  },
  {
    id: 'assembly-hall-100',
    name: 'Assembly Hall - 100 Seats',
    country: 'Global',
    countryFlag: '🌍',
    rows: 10,
    cols: 10,
    description: 'Maximum capacity assembly hall or large lecture room',
    seatPattern: Array(100).fill('seat')
  },
  // Large Classes with Strategic Spacing
  {
    id: 'large-with-aisles-60',
    name: 'Large Class with Aisles - 60',
    country: 'Global',
    countryFlag: '🌍',
    rows: 8,
    cols: 10,
    description: 'Strategic aisle placement for 60 students',
    seatPattern: [
      'seat', 'seat', 'seat', 'empty', 'seat', 'seat', 'empty', 'seat', 'seat', 'seat',
      'seat', 'seat', 'seat', 'empty', 'seat', 'seat', 'empty', 'seat', 'seat', 'seat',
      'seat', 'seat', 'seat', 'empty', 'seat', 'seat', 'empty', 'seat', 'seat', 'seat',
      'seat', 'seat', 'seat', 'empty', 'seat', 'seat', 'empty', 'seat', 'seat', 'seat',
      'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty',
      'seat', 'seat', 'seat', 'empty', 'seat', 'seat', 'empty', 'seat', 'seat', 'seat',
      'seat', 'seat', 'seat', 'empty', 'seat', 'seat', 'empty', 'seat', 'seat', 'seat',
      'seat', 'seat', 'seat', 'empty', 'seat', 'seat', 'empty', 'seat', 'seat', 'seat'
    ]
  },
  {
    id: 'india-government-large',
    name: 'India Government Large - 80',
    country: 'India',
    countryFlag: '🇮🇳',
    rows: 10,
    cols: 8,
    description: 'Large Indian government school classroom',
    seatPattern: Array(80).fill('seat')
  },
  {
    id: 'china-mega-class',
    name: 'China Mega Class - 90',
    country: 'China',
    countryFlag: '🇨🇳',
    rows: 10,
    cols: 9,
    description: 'High-density Chinese classroom for large student groups',
    seatPattern: Array(90).fill('seat')
  },
  {
    id: 'brazil-community-large',
    name: 'Brazil Community Large - 75',
    country: 'Brazil',
    countryFlag: '🇧🇷',
    rows: 10,
    cols: 9,
    description: 'Large community classroom with flexible sections',
    seatPattern: [
      'seat', 'seat', 'seat', 'empty', 'seat', 'seat', 'seat', 'empty', 'seat',
      'seat', 'seat', 'seat', 'empty', 'seat', 'seat', 'seat', 'empty', 'seat',
      'seat', 'seat', 'seat', 'empty', 'seat', 'seat', 'seat', 'empty', 'seat',
      'seat', 'seat', 'seat', 'empty', 'seat', 'seat', 'seat', 'empty', 'seat',
      'seat', 'seat', 'seat', 'empty', 'seat', 'seat', 'seat', 'empty', 'seat',
      'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty',
      'seat', 'seat', 'seat', 'seat', 'seat', 'seat', 'seat', 'seat', 'seat',
      'seat', 'seat', 'seat', 'seat', 'seat', 'seat', 'seat', 'seat', 'seat',
      'seat', 'seat', 'seat', 'seat', 'seat', 'seat', 'seat', 'seat', 'seat',
      'seat', 'seat', 'seat', 'seat', 'seat', 'seat', 'seat', 'seat', 'seat'
    ]
  },
  {
    id: 'philippines-large-class',
    name: 'Philippines Large Class - 85',
    country: 'Philippines',
    countryFlag: '🇵🇭',
    rows: 10,
    cols: 10,
    description: 'High-capacity Philippine classroom',
    seatPattern: [
      'seat', 'seat', 'seat', 'seat', 'empty', 'empty', 'seat', 'seat', 'seat', 'seat',
      'seat', 'seat', 'seat', 'seat', 'empty', 'empty', 'seat', 'seat', 'seat', 'seat',
      'seat', 'seat', 'seat', 'seat', 'seat', 'seat', 'seat', 'seat', 'seat', 'seat',
      'seat', 'seat', 'seat', 'seat', 'seat', 'seat', 'seat', 'seat', 'seat', 'seat',
      'seat', 'seat', 'seat', 'seat', 'seat', 'seat', 'seat', 'seat', 'seat', 'seat',
      'seat', 'seat', 'seat', 'seat', 'seat', 'seat', 'seat', 'seat', 'seat', 'seat',
      'seat', 'seat', 'seat', 'seat', 'seat', 'seat', 'seat', 'seat', 'seat', 'seat',
      'seat', 'seat', 'seat', 'seat', 'seat', 'seat', 'seat', 'seat', 'seat', 'seat',
      'seat', 'seat', 'seat', 'seat', 'seat', 'seat', 'seat', 'seat', 'seat', 'seat',
      'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty'
    ]
  }
]
