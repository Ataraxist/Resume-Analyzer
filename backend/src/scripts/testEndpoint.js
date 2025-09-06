import fetch from 'node-fetch';

async function testEndpoint() {
    try {
        const response = await fetch('http://localhost:3000/api/resume/my-resumes', {
            method: 'GET',
            headers: {
                'Cookie': 'resume.sid=s%3A0goA23DvA7DtU3NpqM5pT9YzUyTu_Nh7.VK0THcJc6HT6Vc3aKnD2y1P6ynLYp%2BnCvUq%2BWCOShZg'
            }
        });
        
        const data = await response.text();
        console.log('Status:', response.status);
        console.log('Response:', data);
        
        // Try parsing as JSON
        try {
            const json = JSON.parse(data);
            console.log('Parsed JSON:', JSON.stringify(json, null, 2));
        } catch (e) {
            // Not JSON
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

testEndpoint();