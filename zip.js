import fs from 'fs';
import archiver from 'archiver';

const output = fs.createWriteStream('./extension-build.zip');
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', function() {
  console.log(archive.pointer() + ' total bytes zip created.');
  process.exit(0);
});

archive.on('error', function(err) {
  throw err;
});

archive.pipe(output);
archive.directory('extension-build/', false);
archive.finalize();

