const XLSX = require('xlsx');

const excelFile = 'C:\\Users\\jngz0\\Downloads\\Reportes_Riesgo.xlsx';
const wb = XLSX.readFile(excelFile);
const ws = wb.Sheets['Reportes de Riesgo'];
const data = XLSX.utils.sheet_to_json(ws);

console.log('\n=== CONTENIDO DEL EXCEL GENERADO ===\n');

if (data.length === 0) {
  console.log('No hay datos en el Excel');
} else {
  data.forEach((row, idx) => {
    console.log(`Registro ${idx + 1}:`);
    console.log(`  Fecha de evento: ${row['Fecha del evento']}`);
    console.log(`  Descripción: ${row['Descripción del evento']}`);
    console.log(`  Consecuencia: ${row['Consecuencia concreta']}`);
    console.log(`  Gestión: ${row['Gestión']}`);
    console.log(`  Gravedad: ${row['Nivel de gravedad']}`);
    console.log(`  Acción inmediata: ${row['Acción inmediata tomada']}`);
    console.log('');
  });
}
