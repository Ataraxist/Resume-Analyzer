import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const ONET_API_KEY = process.env.ONET_API_KEY;
const BASE_URL = 'https://api-v2.onetcenter.org/';

async function testOnetRawResponse() {
    const occupationCode = '15-1252.00'; // Software Developers - should have tools & education
    
    if (!ONET_API_KEY) {
        console.error('ERROR: ONET_API_KEY not found in environment');
        return;
    }
    
    const authHeader = `Basic ${Buffer.from(ONET_API_KEY + ':').toString('base64')}`;
    
    console.log('Testing O*NET API Raw Responses');
    console.log('================================\n');
    
    // Test TOOLS endpoint
    console.log('1. TOOLS_USED Endpoint');
    console.log('----------------------');
    const toolsUrl = `${BASE_URL}online/occupations/${occupationCode}/details/tools_used`;
    console.log('URL:', toolsUrl);
    
    try {
        const response = await fetch(toolsUrl, {
            headers: { 'Authorization': authHeader }
        });
        
        console.log('Status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('\nRAW RESPONSE STRUCTURE:');
            console.log(JSON.stringify(data, null, 2).substring(0, 1000));
            
            // Analyze structure
            console.log('\n\nANALYSIS:');
            console.log('Top-level keys:', Object.keys(data));
            
            if (data.category) {
                console.log('Has "category" field with', data.category.length, 'items');
                if (data.category[0]) {
                    console.log('\nFirst category structure:');
                    console.log('  Keys:', Object.keys(data.category[0]));
                    console.log('  Title:', data.category[0].title);
                    console.log('  Has examples?:', !!data.category[0].example);
                    
                    if (data.category[0].example && data.category[0].example[0]) {
                        console.log('\nFirst example structure:');
                        console.log('  Keys:', Object.keys(data.category[0].example[0]));
                        console.log('  Sample:', data.category[0].example[0]);
                    }
                }
            }
        } else {
            console.log('Error response:', await response.text());
        }
    } catch (error) {
        console.log('Fetch error:', error.message);
    }
    
    // Test EDUCATION endpoint
    console.log('\n\n2. EDUCATION Endpoint');
    console.log('---------------------');
    const eduUrl = `${BASE_URL}online/occupations/${occupationCode}/details/education`;
    console.log('URL:', eduUrl);
    
    try {
        const response = await fetch(eduUrl, {
            headers: { 'Authorization': authHeader }
        });
        
        console.log('Status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('\nRAW RESPONSE STRUCTURE:');
            console.log(JSON.stringify(data, null, 2).substring(0, 1000));
            
            // Analyze structure
            console.log('\n\nANALYSIS:');
            console.log('Top-level keys:', Object.keys(data));
            
            if (data.education) {
                console.log('Has "education" field with keys:', Object.keys(data.education));
                
                if (data.education.most_common) {
                    console.log('Has "most_common" with', data.education.most_common.length, 'items');
                    if (data.education.most_common[0]) {
                        console.log('\nFirst education entry:');
                        console.log('  Keys:', Object.keys(data.education.most_common[0]));
                        console.log('  Sample:', data.education.most_common[0]);
                    }
                }
            }
        } else {
            console.log('Error response:', await response.text());
        }
    } catch (error) {
        console.log('Fetch error:', error.message);
    }
    
    // For comparison, test a working endpoint (SKILLS)
    console.log('\n\n3. SKILLS Endpoint (for comparison - we know this works)');
    console.log('--------------------------------------------------------');
    const skillsUrl = `${BASE_URL}online/occupations/${occupationCode}/details/skills`;
    console.log('URL:', skillsUrl);
    
    try {
        const response = await fetch(skillsUrl, {
            headers: { 'Authorization': authHeader }
        });
        
        console.log('Status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('Top-level keys:', Object.keys(data));
            
            if (data.element) {
                console.log('Has "element" field with', data.element.length, 'items');
                if (data.element[0]) {
                    console.log('First skill keys:', Object.keys(data.element[0]));
                }
            }
        }
    } catch (error) {
        console.log('Fetch error:', error.message);
    }
}

testOnetRawResponse().catch(console.error);