const fs = require('fs');
const content = fs.readFileSync('views/user/home.ejs', 'utf8');
let openPos = content.indexOf('<%');
let count = 0;
while (openPos !== -1) {
    count++;
    let closePos = content.indexOf('%>', openPos);
    if (closePos === -1) {
        console.log('Unclosed tag at position ' + openPos);
        console.log('Context: ' + content.substring(openPos, openPos + 50));
        process.exit(1);
    }
    openPos = content.indexOf('<%', closePos);
}
console.log('Found ' + count + ' balanced tags.');
