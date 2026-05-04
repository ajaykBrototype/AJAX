const fs = require('fs');
const partials = [
    'views/partials/navbar-hero-styles.ejs',
    'views/partials/footer-styles.ejs',
    'views/partials/navbar-hero.ejs',
    'views/partials/footer.ejs'
];

partials.forEach(file => {
    console.log('Checking ' + file);
    const content = fs.readFileSync(file, 'utf8');
    let openPos = content.indexOf('<%');
    let count = 0;
    while (openPos !== -1) {
        count++;
        let closePos = content.indexOf('%>', openPos);
        if (closePos === -1) {
            console.log('Unclosed tag in ' + file + ' at position ' + openPos);
            console.log('Context: ' + content.substring(openPos, openPos + 50));
            process.exit(1);
        }
        openPos = content.indexOf('<%', closePos);
    }
    console.log('Found ' + count + ' balanced tags in ' + file);
});
