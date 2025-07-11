// app/api/categories/route.js
// import mysql from 'mysql2/promise';

// export async function GET() {
//     const connection = await mysql.createConnection({ /* tes configs DB */ });
//     const [rows] = await connection.execute('SELECT * FROM categories');
//     await connection.end();

//     return new Response(JSON.stringify(rows), {
//         headers: { 'Content-Type': 'application/json' },
//     });
// }
