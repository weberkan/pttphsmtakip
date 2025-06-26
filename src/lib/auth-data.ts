
// ---
// !!! SECURITY WARNING !!!
// ---
// This file contains hardcoded user credentials for demonstration and prototyping purposes ONLY.
// In a real-world, production application, you should NEVER store plain-text passwords in your source code.
// 
// For a production environment, you must:
// 1. Use a secure database to store user information.
// 2. Use a strong hashing algorithm (like bcrypt or Argon2) to hash passwords before storing them.
// 3. Implement a proper authentication service (like Firebase Authentication, Auth0, or your own).
//
// Storing credentials this way is highly insecure and makes your application vulnerable.
// Anyone with access to the source code can see all user passwords.

export const USERS = [
  { registryNumber: '1001', password: 'password1', firstName: 'Ahmet', lastName: 'Yılmaz' },
  { registryNumber: '1002', password: 'password2', firstName: 'Ayşe', lastName: 'Kaya' },
  { registryNumber: '1003', password: 'password3', firstName: 'Mehmet', lastName: 'Demir' },
  { registryNumber: '1004', password: 'password4', firstName: 'Fatma', lastName: 'Çelik' },
  { registryNumber: '1005', password: 'password5', firstName: 'Mustafa', lastName: 'Şahin' },
  { registryNumber: '1006', password: 'password6', firstName: 'Emine', lastName: 'Yıldız' },
  { registryNumber: '1007', password: 'password7', firstName: 'Ali', lastName: 'Öztürk' },
  { registryNumber: '1008', password: 'password8', firstName: 'Zeynep', lastName: 'Aydın' },
  { registryNumber: '1009', password: 'password9', firstName: 'Hüseyin', lastName: 'Arslan' },
  { registryNumber: '1010', password: 'password10', firstName: 'Hatice', lastName: 'Doğan' },
];
