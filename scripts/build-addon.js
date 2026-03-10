import { build } from 'esbuild';
import fs from 'fs';

async function run() {
    console.log('Building components...');
    try {
        await build({
            entryPoints: ['src/components/index.jsx'],
            bundle: true,
            outfile: 'dist/assets/attendance-addon.js',
            format: 'iife',
            globalName: 'AttendanceAddon',
            jsx: 'automatic',
            external: ['react', 'react-dom', 'react-router-dom', 'react/jsx-runtime'],
            define: {
                'process.env.NODE_ENV': '"production"'
            }
        });

        console.log('Successfully compiled to dist/assets/attendance-addon.js');

        let code = fs.readFileSync('dist/assets/attendance-addon.js', 'utf8');

        // Inject the mock require function linking to the minified globals!
        // In index-BosXJrON.js: `a` = React, `e` = jsx-runtime, `Q` = useNavigate (from react-router-dom)
        const mockRequire = `
window.require = function(n) {
  if (n === 'react') return a;
  if (n === 'react/jsx-runtime') return e;
  if (n === 'react-router-dom') return { useNavigate: Q };
  throw new Error('Module not found: ' + n);
};
`;
        fs.writeFileSync('dist/assets/attendance-addon.js', mockRequire + '\n' + code);
        console.log('Injected minifier polyfills.');

    } catch (err) {
        console.error('Esbuild error:', err);
    }
}

run();
