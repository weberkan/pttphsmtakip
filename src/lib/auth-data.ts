
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
// 
// IMPORTANT: You must enable "Email/Password" sign-in provider in your Firebase project's
// Authentication settings and manually add these users there with their respective emails and passwords.

export const USERS = [
  { registryNumber: '240637', password: 'ptt2025+', firstName: 'Erkan', lastName: 'İçil', email: 'erkan.icil@example.com' },
  { registryNumber: '239089', password: 'ptt2025+', firstName: 'Ekrem', lastName: 'Acar', email: 'ekrem.acar@example.com' },
  { registryNumber: '213964', password: 'ptt2025+', firstName: 'Murat', lastName: 'Yıldırım', email: 'murat.yildirim@example.com' },
  { registryNumber: '248143', password: 'ptt2025+', firstName: 'Salih', lastName: 'Çakmak', email: 'salih.cakmak@example.com' },
  { registryNumber: '215812', password: 'ptt2025+', firstName: 'Ali', lastName: 'Yılmaz', email: 'ali.yilmaz@example.com' },
  { registryNumber: '239628', password: 'ptt2025+', firstName: 'İsrafil', lastName: 'Kayhan', email: 'israfil.kayhan@example.com' },
  { registryNumber: '242202', password: 'ptt2025+', firstName: 'Recep', lastName: 'Cin', email: 'recep.cin@example.com' },
  { registryNumber: '251469', password: 'ptt2025+', firstName: 'Sema Betül', lastName: 'Doğanyiğit', email: 'sema.doganyigit@example.com' },
  { registryNumber: '258311', password: 'ptt2025+', firstName: 'Mustafa Dursun', lastName: 'Canseven', email: 'mustafa.canseven@example.com' },
  { registryNumber: '255197', password: 'ptt2025+', firstName: 'Sercan Emre', lastName: 'Yalçınkaya', email: 'sercan.yalcinkaya@example.com' },
  { registryNumber: '254841', password: 'ptt2025+', firstName: 'Özge', lastName: 'Parmaksız', email: 'ozge.parmaksiz@example.com' },
];
