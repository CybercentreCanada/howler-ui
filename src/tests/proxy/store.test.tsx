import fs from 'fs';
import path from 'path';

const buildStore = (store = {}, dir = 'src/api', isDataDir = false) => {
  const res = fs.readdirSync(dir);
  const uri = /src\/api(\/.*)/.exec(dir);

  console.log(dir);

  res.forEach(file => {
    // console.log(file);
    const filePath = path.join(dir, file);
    const fileStat = fs.lstatSync(filePath);
    if (isDataDir) {
      const key = path.join(uri[1].replace('data', ''), file.replace('index', '').replace('.json', ''));
      store[key.endsWith('/') ? key : `${key}/`] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } else if (fileStat.isDirectory()) {
      buildStore(store, filePath, file === 'data');
    } else {
      console.log(file);
    }
  });
  return store;
};

test('build store', () => {
  const store = buildStore();
  console.log(store);
});

// buildStore();
