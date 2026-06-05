const fs = require('fs');
const path = require('path');

const treasuresDir = path.join(__dirname, '..', 'treasures');
const outputFile = path.join(treasuresDir, 'treasures.json');

// 确保 treasures 目录存在
if (!fs.existsSync(treasuresDir)) {
  console.log('treasures 目录不存在，已创建');
  fs.mkdirSync(treasuresDir, { recursive: true });
  fs.writeFileSync(outputFile, '[]');
  process.exit(0);
}

const files = fs.readdirSync(treasuresDir);
const treasures = [];

// 用于去重
const seen = new Set();

for (const file of files) {
  // 跳过目录、隐藏文件、索引文件本身
  if (file.startsWith('.') || file === 'treasures.json' || file.endsWith('.txt')) continue;
  
  const ext = path.extname(file).toLowerCase();
  // 只处理有扩展名的文件（排除无后缀的文件）
  if (!ext) continue;

  const baseName = path.basename(file, ext);
  const txtFile = `${baseName}${ext}.txt`;
  const txtPath = path.join(treasuresDir, txtFile);

  // 读取简介
  let desc = '';
  if (fs.existsSync(txtPath)) {
    desc = fs.readFileSync(txtPath, 'utf-8').trim();
    // 如果简介为空，给个默认值
    if (!desc) desc = '暂无简介';
  } else {
    desc = '暂无简介';
  }

  // 读取文件大小
  const filePath = path.join(treasuresDir, file);
  const stats = fs.statSync(filePath);
  const sizeInBytes = stats.size;
  let sizeStr = '';
  if (sizeInBytes < 1024) {
    sizeStr = sizeInBytes + 'B';
  } else if (sizeInBytes < 1024 * 1024) {
    sizeStr = (sizeInBytes / 1024).toFixed(1) + 'KB';
  } else {
    sizeStr = (sizeInBytes / (1024 * 1024)).toFixed(1) + 'MB';
  }

  // 格式名（去掉点）
  const format = ext.replace('.', '').toUpperCase();

  // 唯一 ID（用文件名转英文+数字，简单处理）
  const id = baseName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);

  // 防止重复（同名不同扩展名？只取第一个，或者你可以根据情况调整）
  if (seen.has(id)) continue;
  seen.add(id);

  treasures.push({
    id,
    name: baseName,
    format,
    size: sizeStr,
    desc,
    url: `treasures/${encodeURIComponent(file)}`  // 相对路径，前端直接用
  });
}

// 写入 JSON
fs.writeFileSync(outputFile, JSON.stringify(treasures, null, 2), 'utf-8');
console.log(`生成 treasures.json 完成，共 ${treasures.length} 个资源`);