import { CloudBaseConnector } from './lib/cloudbase/connector.js';

const connector = new CloudBaseConnector();
await connector.initialize();
const app = connector.getApp();

const fileId = 'cloud://cloudbase-5g1enabl3864f1c1.636c-cloudbase-5g1enabl3864f1c1-1381714604/ads/1769172085651-bi2v1q1nblc.jpg';

try {
  const result = await app.getTempFileURL({
    fileList: [fileId]
  });
  
  console.log('Result:', JSON.stringify(result, null, 2));
  
  if (result.fileList && result.fileList[0]) {
    const fileInfo = result.fileList[0];
    console.log('\nFileID:', fileInfo.fileID);
    console.log('Code:', fileInfo.code);
    console.log('Temp URL:', fileInfo.tempFileURL);
  }
} catch (error) {
  console.error('Error:', error);
}
