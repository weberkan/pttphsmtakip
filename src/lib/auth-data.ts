
// ---
// !!! SECURITY WARNING & INSTRUCTIONS !!!
// ---
// This file maps your application's internal registry numbers to Firebase Authentication emails.
// It does NOT and should NOT contain passwords.
// 
// For this system to work:
// 1. You MUST have an active Firebase project with Firebase Authentication enabled.
// 2. You MUST manually add each user listed here to the Firebase Authentication "Users" tab.
//    - Use the 'email' from this file as the user's email in Firebase.
//    - Set a password for them directly in the Firebase Console.
// 
// The passwords you set in the Firebase Console are the ONLY passwords that will work for logging in.
// This file simply provides the bridge between the "Sicil Numarası" entered on the login screen
// and the email address used for the actual authentication process with Firebase.

export const USERS = [
  { registryNumber: '240637', firstName: 'Erkan', lastName: 'İçil', email: 'erkan.icil@example.com' },
  { registryNumber: '239089', firstName: 'Ekrem', lastName: 'Acar', email: 'ekrem.acar@example.com' },
  { registryNumber: '213964', firstName: 'Murat', lastName: 'Yıldırım', email: 'murat.yildirim@example.com' },
  { registryNumber: '248143', firstName: 'Salih', lastName: 'Çakmak', email: 'salih.cakmak@example.com' },
  { registryNumber: '215812', firstName: 'Ali', lastName: 'Yılmaz', email: 'ali.yilmaz@example.com' },
  { registryNumber: '239628', firstName: 'İsrafil', lastName: 'Kayhan', email: 'israfil.kayhan@example.com' },
  { registryNumber: '242202', firstName: 'Recep', lastName: 'Cin', email: 'recep.cin@example.com' },
  { registryNumber: '251469', firstName: 'Sema Betül', lastName: 'Doğanyiğit', email: 'sema.doganyigit@example.com' },
  { registryNumber: '258311', firstName: 'Mustafa Dursun', lastName: 'Canseven', email: 'mustafa.canseven@example.com' },
  { registryNumber: '255197', firstName: 'Sercan Emre', lastName: 'Yalçınkaya', email: 'sercan.yalcinkaya@example.com' },
  { registryNumber: '254841', firstName: 'Özge', lastName: 'Parmaksız', email: 'ozge.parmaksiz@example.com' },
];
