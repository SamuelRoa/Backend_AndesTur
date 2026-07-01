import fs from 'fs';
import path from 'path';

const routesDir = 'c:/Proyectos/AndesTur/Backend_AndesTur-master/src/routes';
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));

files.forEach(file => {
  const filePath = path.join(routesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  if (content.includes('authorizeRead') || content.includes('authorizeWrite')) {
    content = content.replace(/authorizeRead,?/, 'requirePermission,');
    content = content.replace(/authorizeWrite,?/, '');
    
    content = content.replace(/,\s*,/g, ',');
    content = content.replace(/{\s*,/g, '{ ');

    const moduleName = file.split('.')[0].replace('_', '-'); 
    let targetModule = moduleName;
    if (file === 'staff.routes.js') targetModule = 'staff';
    if (file === 'customers.routes.js') targetModule = 'customers';
    if (file === 'destinations.routes.js') targetModule = 'destinations';
    if (file === 'packages.routes.js') targetModule = 'packages';
    if (file === 'reservations.routes.js') targetModule = 'reservations';
    if (file === 'vehicles.routes.js') targetModule = 'vehicles';

    content = content.replace(/authorizeWrite\(['"]([^'"]+)['"]\)/g, 'requirePermission("$1:write")');
    content = content.replace(/authorizeRead\(\)/g, `requirePermission("${targetModule}:read")`);

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
