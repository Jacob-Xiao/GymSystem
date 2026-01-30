require('dotenv').config();
const mysql = require('mysql2/promise');

async function testConnection() {
  console.log('正在测试数据库连接...\n');
  console.log('配置信息：');
  console.log('  DB_HOST:', process.env.DB_HOST || 'localhost (默认)');
  console.log('  DB_USER:', process.env.DB_USER || 'root (默认)');
  console.log('  DB_PASSWORD:', process.env.DB_PASSWORD ? '***已设置***' : '12345678 (默认)');
  console.log('  DB_NAME:', process.env.DB_NAME || 'gym_management_system (默认)');
  console.log('');
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '12345678',
      database: process.env.DB_NAME || 'gym_management_system'
    });
    
    console.log('✅ 数据库连接成功！\n');
    
    // 测试查询
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM admin');
    console.log(`✅ 数据库查询成功！admin表中有 ${rows[0].count} 条记录\n`);
    
    await connection.end();
    console.log('测试完成！');
  } catch (error) {
    console.error('❌ 数据库连接失败！\n');
    console.error('错误信息：', error.message);
    console.error('\n可能的解决方案：');
    console.error('1. 检查 .env 文件是否存在（在 backend 目录下）');
    console.error('2. 检查 .env 文件中的 DB_PASSWORD 是否正确');
    console.error('3. 确认 MySQL 服务是否正在运行');
    console.error('4. 确认数据库 gym_management_system 是否已创建');
    console.error('5. 尝试使用命令行登录: mysql -u root -p');
    process.exit(1);
  }
}

testConnection();
