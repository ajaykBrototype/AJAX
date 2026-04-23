import fs from 'fs';
import path from 'path';

const viewsDir = 'c:\\Users\\hp\\OneDrive\\Desktop\\BrototypeProjects\\AJAX First Project\\views\\admin';

const files = [
  { name: 'addProduct.ejs', path: '/admin/products' },
  { name: 'addVariant.ejs', path: '/admin/variants' },
  { name: 'categories.ejs', path: '/admin/categories' },
  { name: 'editProduct.ejs', path: '/admin/products' },
  { name: 'editVariant.ejs', path: '/admin/variants' },
  { name: 'productDetails.ejs', path: '/admin/products' },
  { name: 'products.ejs', path: '/admin/products' },
  { name: 'subcategories.ejs', path: '/admin/subcategories' },
  { name: 'variants.ejs', path: '/admin/variants' },
  { name: 'dashboard.ejs', path: '/admin/dashboard' }
];

files.forEach(f => {
  const filePath = path.join(viewsDir, f.name);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${f.name}`);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  
  let startMarker = '<!-- ── SIDEBAR ── -->';
  let startIndex = content.indexOf(startMarker);
  
  if (startIndex === -1) {
      startIndex = content.indexOf('<aside id="sidebar"');
  }

  if (startIndex !== -1) {
    const endTag = '</aside>';
    const endIndex = content.indexOf(endTag, startIndex);
    if (endIndex !== -1) {
      const blockToReplace = content.substring(startIndex, endIndex + endTag.length);
      const replacement = `<!-- ── SIDEBAR (PARTIAL) ── -->\n  <%- include('partials/sidebar', { currentPath: '${f.path}' }) %>`;
      content = content.replace(blockToReplace, replacement);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Replaced sidebar in ${f.name}`);
    } else {
      console.log(`End tag not found in ${f.name}`);
    }
  } else {
    console.log(`Sidebar start not found in ${f.name}`);
  }
});
