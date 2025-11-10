# Enhanced Wellbeing Analytics System

## Overview
A comprehensive, fine-tuned student wellbeing analytics system with 100+ tracking metrics, advanced scoring algorithms, and predictive insights.

---

## 📁 File Structure

### **1. `01_enhanced_table_structure.sql`**
Creates the enhanced analytics table with detailed tracking columns:
- **100+ columns** for granular data tracking
- **Emotional metrics**: mood volatility, consistency, patterns
- **Academic metrics**: subject-level performance, trends, consistency
- **Engagement metrics**: time-based patterns, quality scores
- **Social metrics**: interaction quality, SEL indicators
- **Behavioral metrics**: pattern detection, intervention tracking
- **Risk assessment**: multi-dimensional risk scoring
- **Predictive analytics**: trend predictions, pattern recognition

### **2. `02_advanced_scoring_algorithms.sql`**
Sophisticated calculation functions:
- `calculate_mood_volatility()` - Emotional stability tracking
- `calculate_academic_consistency()` - Performance reliability
- `calculate_engagement_quality()` - Depth of interaction
- `calculate_risk_score()` - Multi-factor risk assessment
- `calculate_resilience_score()` - Protective factors analysis
- `identify_warning_flags()` - Early intervention detection
- `generate_recommended_actions()` - Automated action plans

### **3. `03_enhanced_etl_processor.sql`**
Main ETL processing engine:
- `process_student_enhanced_analytics()` - Individual student processing
- `run_enhanced_wellbeing_etl()` - Batch processing for all students
- Detailed data extraction from all source tables
- Real-time performance tracking (processing duration)
- Comprehensive error handling

### **4. `04_analytics_queries.sql`**
Pre-built reporting queries and views:
- `v_student_risk_dashboard` - Real-time risk monitoring
- `get_school_wellbeing_summary()` - School-wide metrics
- `v_grade_level_wellbeing` - Grade comparison analysis
- `get_student_trend_analysis()` - Individual trend tracking
- `v_students_needing_attention` - Intervention priority list
- `v_wellbeing_improvements` - Progress tracking
- `get_detailed_student_profile()` - Complete student view

---

## 🚀 Installation

Run the SQL files in order:

```sql
-- 1. Create enhanced table structure
\i 01_enhanced_table_structure.sql

-- 2. Install scoring algorithms
\i 02_advanced_scoring_algorithms.sql

-- 3. Set up ETL processor
\i 03_enhanced_etl_processor.sql

-- 4. Create analytics queries
\i 04_analytics_queries.sql
```

---

## 📊 Key Features

### **Multi-Dimensional Scoring**
- **Emotional Wellbeing (40%)**: Mood patterns, volatility, consistency
- **Academic Wellbeing (25%)**: GPA, test scores, improvement rates
- **Engagement Wellbeing (20%)**: Attendance, quests, activity quality
- **Social Wellbeing (10%)**: Interactions, gratitude, kindness
- **Behavioral Wellbeing (5%)**: Incidents, help requests, patterns

### **Advanced Risk Assessment**
- **5-Level Risk Classification**: Thriving → Low → Medium → High → Critical
- **Risk Score (0-10)**: Quantitative risk measurement
- **Early Warning Flags**: Automated detection of concerning patterns
- **Intervention Priority**: Immediate → Urgent → Moderate → Low
- **Recommended Actions**: AI-generated intervention suggestions

### **Granular Tracking**
- **Mood Metrics**: Average, min, max, std deviation, volatility
- **Academic Details**: Subject-level, test types, improvement rates
- **Engagement Patterns**: Time-based, quality scores, consistency
- **Social Indicators**: Peer interaction, empathy, collaboration
- **Behavioral Patterns**: Incident trends, help-seeking behavior

### **Predictive Analytics**
- **Trend Predictions**: Next period score forecasting
- **Pattern Recognition**: Behavioral pattern classification
- **Confidence Levels**: Prediction reliability scoring
- **Seasonal Patterns**: Time-based trend detection

---

## 💻 Usage Examples

### **Run Daily ETL**
```sql
SELECT run_enhanced_wellbeing_etl();
```

### **View High-Risk Students**
```sql
SELECT * FROM v_students_needing_attention;
```

### **Get School Summary**
```sql
SELECT get_school_wellbeing_summary('school-uuid-here');
```

### **Track Student Progress**
```sql
SELECT get_student_trend_analysis('student-uuid-here', 30);
```

### **View Grade Comparison**
```sql
SELECT * FROM v_grade_level_wellbeing;
```

### **Get Detailed Student Profile**
```sql
SELECT get_detailed_student_profile('student-uuid-here');
```

### **Monitor Improvements**
```sql
SELECT * FROM v_wellbeing_improvements
WHERE trend = 'Improving'
ORDER BY percent_change DESC;
```

---

## 📈 Scoring Breakdown

### **Overall Wellbeing Score (1-10)**
```
Overall = (Emotional × 0.40) + (Academic × 0.25) + (Engagement × 0.20) + (Social × 0.10) + (Behavioral × 0.05)
```

### **Risk Score (0-10)**
```
Risk = Mood Risk (0-3) + Negative Mood % (0-2) + Academic Risk (0-2) + 
       Attendance Risk (0-1.5) + Behavioral Risk (0-1.5) + Engagement Risk (0-1)
```

### **Resilience Score (0-10)**
```
Resilience = Consistency (0-2) + Achievement (0-1.5) + Emotional Stability (0-2) + 
             Academic Stability (0-1.5) + Attendance (0-1) + Positive Practices (0-1) + 
             Self-Advocacy (0-0.5)
```

---

## 🎯 Risk Levels

| Risk Level | Score Range | Intervention | Description |
|------------|-------------|--------------|-------------|
| **Thriving** | 0 - 1.4 | None | Excellent wellbeing, no concerns |
| **Low** | 1.5 - 3.4 | Monitor | Good wellbeing, minor areas to watch |
| **Medium** | 3.5 - 5.9 | Moderate | Some concerns, proactive support needed |
| **High** | 6.0 - 7.9 | Urgent | Significant concerns, immediate action |
| **Critical** | 8.0 - 10.0 | Immediate | Severe concerns, crisis intervention |

---

## 🔔 Early Warning Flags

The system automatically detects:
- Very low mood scores (<4)
- High negative mood frequency (>60%)
- Consecutive negative mood days (≥3)
- No mood tracking engagement
- Critical GPA levels (<2.0)
- Frequent late submissions (>5)
- Chronic absenteeism (<70%)
- Very low engagement (<30%)
- Multiple behavioral incidents (≥3)
- Multiple urgent help requests (≥2)

---

## 📋 Recommended Actions

Auto-generated based on risk level and warning flags:
- Schedule counselor meetings
- Notify parents/guardians
- Provide emotional support resources
- Arrange academic tutoring
- Investigate attendance barriers
- Develop improvement plans
- Explore student interests
- Adjust learning activities

---

## 🔄 Automation

### **Nightly ETL Schedule**
```sql
-- Run at 2:00 AM daily
SELECT run_enhanced_wellbeing_etl(CURRENT_DATE, 'daily');

-- Run weekly analysis (Sundays)
SELECT run_enhanced_wellbeing_etl(CURRENT_DATE, 'weekly');

-- Run monthly analysis (1st of month)
SELECT run_enhanced_wellbeing_etl(CURRENT_DATE, 'monthly');
```

### **Supabase Edge Function**
```typescript
// Schedule with cron: 0 2 * * *
Deno.cron("Enhanced Wellbeing ETL", "0 2 * * *", async () => {
  await supabase.rpc('run_enhanced_wellbeing_etl');
});
```

---

## 📊 Data Quality

The system tracks:
- **Data Completeness**: Percentage of fields populated
- **Data Quality Score**: 0-1 scale based on completeness
- **Missing Data Fields**: List of unpopulated columns
- **Data Sources Count**: Number of tables contributing data
- **Processing Duration**: ETL performance metrics

---

## 🔐 Security

- **Row Level Security (RLS)** enabled on all tables
- **Students**: View own analytics only
- **Teachers**: View school students
- **Admins**: Full school access
- **Secure functions**: SECURITY DEFINER for controlled access

---

## 📈 Performance

- **Optimized indexes** for fast queries
- **Materialized views** for complex aggregations
- **Batch processing** for efficiency
- **Processing time tracking** for monitoring
- **Typical ETL duration**: <5 seconds for 100 students

---

## 🎓 Best Practices

1. **Run ETL daily** for up-to-date insights
2. **Review high-risk students** every morning
3. **Track trends weekly** for pattern detection
4. **Monitor improvements** to validate interventions
5. **Use detailed profiles** for parent meetings
6. **Export reports** for documentation
7. **Set up alerts** for critical risk levels

---

## 🔧 Maintenance

### **Monitor ETL Performance**
```sql
SELECT * FROM etl_execution_logs 
ORDER BY created_at DESC LIMIT 10;
```

### **Check Data Quality**
```sql
SELECT 
  AVG(data_quality_score) as avg_quality,
  COUNT(*) FILTER (WHERE data_quality_score < 0.7) as low_quality_count
FROM student_wellbeing_analytics_enhanced
WHERE analysis_date = CURRENT_DATE;
```

### **Identify Processing Issues**
```sql
SELECT student_id, processing_duration_ms
FROM student_wellbeing_analytics_enhanced
WHERE processing_duration_ms > 1000
ORDER BY processing_duration_ms DESC;
```

---

## 📞 Support

For issues or questions:
1. Check ETL execution logs
2. Review data quality scores
3. Verify source table data
4. Test individual student processing
5. Check RLS policies

---

## 🎉 Success!

Your enhanced wellbeing analytics system is now ready to provide deep, actionable insights into student wellbeing with precision tracking and intelligent risk assessment.
