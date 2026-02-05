import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Using a simple regex
 for demonstration. A real-world solution might need a more robust HTML parser.const linkRegex = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"/g;
// List of HTML files
 to check (you can dynamically generate this list)const htmlFiles = [    'api-documentation.html',    'appstore.html',    'blog.html',    'contact.html',    'copyrights.html',    'cursor-demo.html',    'gallery.html',    'geological-studies.html',    'index.html',    'legal.html',    'lexicon-pro.html',    'livestream.html',    'neural-engine.html',    'privacy.html',    'projects.html',    'referrals.html',    'rush-percussion.html',    'store.html',    'strata-design-system.html',    'studio3000.html',    'terms.html',    'the3000-gallery.html',    'the3000.html',    'voice-to-json.html',    'admin/analytics.html',    'admin/app-store-manager.html',    'admin/index.html',    'admin/live-stream.html',    'admin/store-manager.html',    'admin/voice-commands.html',    'app Store apps to Sell/audioboost-pro-ai/index.html'];htmlFiles.forEach(file => {    const filePath = path.join(__dirname, file);    if (!fs.existsSync(filePath)) {        console.error(`File not found: ${file}`);        return;    }    const content = fs.readFileSync(filePath, 'utf8');    let match;    while ((match = linkRegex.exec(content)) !== null) {        const link = match[1];
// Ignore external links
, mailto links, anchor links, and template placeholders        if (link.startsWith('http') || link.startsWith('mailto:') || link.startsWith('#') || link.includes('${')) {            continue;        }
// Resolve the link
        let resolvedPath;        if (link.startsWith('/')) {            resolvedPath = path.resolve(__dirname, link.substring(1));        } else {            resolvedPath = path.resolve(path.dirname(filePath), link);        }        if (!fs.existsSync(resolvedPath)) {            console.log(`Broken link in ${file}: ${link} -> ${resolvedPath}`);        }    }});
