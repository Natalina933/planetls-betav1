// import mysql from 'mysql2/promise';

// export async function GET() {
//     const connection = await mysql.createConnection({ /* configs */ });

//     const [rows] = await connection.query(`
//     SELECT p.id, p.name, p.type, p.latitude, p.longitude, p.available, p.photo,
//         GROUP_CONCAT(ps.service) AS services
//     FROM profiles p
//     LEFT JOIN profile_services ps ON ps.profile_id = p.id
//     GROUP BY p.id
//   `);

//     const profiles = rows.map(r => ({
//         ...r,
//         services: r.services ? r.services.split(',') : []
//     }));

//     await connection.end();

//     return new Response(JSON.stringify(profiles), {
//         headers: { 'Content-Type': 'application/json' },
//     });
// }
