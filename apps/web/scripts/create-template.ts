import ExcelJS from 'exceljs';
import * as path from 'path';
import * as fs from 'fs';

async function createTemplate() {
  try {
    const inputPath = process.argv[2];
    const outputPath = process.argv[3];
    
    console.log(`Reading from: ${inputPath}`);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(inputPath);
    
    // Check if sheet already exists
    let sheet = wb.getWorksheet('membres_infos');
    if (!sheet) {
      sheet = wb.addWorksheet('membres_infos', { properties: { tabColor: { argb: 'FF00FF00' } } });
      console.log('Added worksheet "membres_infos"');
      
      // Add Headers
      sheet.columns = [
        { header: 'Nom Complet', key: 'nom', width: 30 },
        { header: 'Téléphone', key: 'telephone', width: 20 },
        { header: 'Quartier', key: 'quartier', width: 25 },
      ];
      
      // Style headers
      sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      sheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F46E5' } // Indigo color
      };
      
      // Extract existing members to pre-fill the names (from ep+int)
      const epInt = wb.getWorksheet('ep+int');
      if (epInt) {
        let names = new Set<string>();
        epInt.eachRow({ includeEmpty: false }, (row: any, rowNumber: number) => {
          if (rowNumber > 1) {
            let nameVal = row.getCell(1).value;
            // Name is in col 1 or 2 depending on file, let's check col 2 if col 1 is n°
            let strName = String(nameVal || '').trim();
            if (strName === '' || strName.match(/^\d+$/)) {
              nameVal = row.getCell(2).value;
              strName = String(nameVal || '').trim();
            }
            if (strName && strName.length > 2 && !strName.match(/^(n°?|noms?|total|sous-total|recap|colonne)/i)) {
              names.add(strName);
            }
          }
        });
        
        // Add names to new sheet
        Array.from(names).forEach((name, index) => {
          sheet!.addRow({
            nom: name,
            telephone: '', // They need to fill this
            quartier: ''
          });
        });
        console.log(`Pre-filled ${names.size} members from ep+int.`);
      }
    }
    
    // Ensure output directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    console.log(`Saving template to: ${outputPath}`);
    await wb.xlsx.writeFile(outputPath);
    console.log('Done successfully!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createTemplate();
