const fs = require('fs');
const pdf = require('pdf-parse');

async function extractText(pdfPath, txtPath) {
    if(!fs.existsSync(pdfPath)) {
        console.error(`File ${pdfPath} not found`);
        return;
    }
    const dataBuffer = fs.readFileSync(pdfPath);
    try {
        const data = await pdf(dataBuffer);
        fs.writeFileSync(txtPath, data.text);
        console.log(`Successfully extracted ${pdfPath} to ${txtPath} (Length: ${data.text.length} chars)`);
    } catch(err) {
        console.error(`Error parsing ${pdfPath}: ${err.message}`);
    }
}

async function main() {
    await extractText('ATS_Tailored_Resume (1).pdf', 'generated.txt');
    await extractText('Alekha_Mandalapu_Google.pdf', 'original.txt');
    await extractText('test_generated_resume.pdf', 'script_generated.txt');
}

main();
