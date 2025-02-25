import extract from 'extract-zip';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

export const getUserFromLinkedinZip = async (zipPath) => {
  try {
    const targetPath = path.resolve('db/linkedin');
    await extract(zipPath, { dir: targetPath });
    const documents = ['Profile', 'Positions', 'Skills'];
    const data = [];
    for (const document of documents) {
      const filePath = path.resolve(targetPath, `${document}.csv`);
      if (!fs.existsSync(filePath)) continue;

      const fileContent = fs.readFileSync(filePath, 'utf8');
      const parsedCsv = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
      });

      data[document] = parsedCsv.data;
    }
    return data;
  } catch (error) {
    console.log('Error getting user from LinkedIn zip', error);
    return null;
  }
};
