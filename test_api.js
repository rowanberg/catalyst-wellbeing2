// Test script to check what the assigned-classes API returns
const fetch = require('node-fetch');

async function testAPI() {
  try {
    const teacherId = '641bb749-58ed-444e-b39c-984e59a93dd7';
    const response = await fetch(`http://localhost:3000/api/teacher/assigned-classes?teacher_id=${teacherId}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('API Response:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('API Error:', response.status, errorText);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPI();
