// Genera src/environments/environment.ts desde variables de entorno o .env (Angular no lee .env en build).
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';

if (existsSync('.env')) process.loadEnvFile('.env');

const apiUrl = process.env.API_URL;
if (!apiUrl) {
  console.error('Falta API_URL (defínela en .env o como variable de entorno del build).');
  process.exit(1);
}

mkdirSync('src/environments', { recursive: true });
writeFileSync(
  'src/environments/environment.ts',
  `export const environment = {\n  apiUrl: ${JSON.stringify(apiUrl.replace(/\/+$/, ''))},\n};\n`,
);
