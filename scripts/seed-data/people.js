// Demo accounts. Addresses use example.com (reserved by IANA), so no real inbox
// receives the approval / reset emails the app sends to them.
export const EMAIL_DOMAIN = 'testly.example.com';

export const admin = { username: 'admin', email: `admin@${EMAIL_DOMAIN}` };

export const teachers = [
    { key: 'omar', name: 'Omar Hassan', phone: '01012345678', address: 'Nasr City, Cairo', nationalId: '29001011234567' },
    { key: 'mona', name: 'Mona Adel', phone: '01123456789', address: 'Smouha, Alexandria', nationalId: '28805152345678' },
    { key: 'youssef', name: 'Youssef Ibrahim', phone: '01234567890', address: 'Dokki, Giza', nationalId: '29107203456789' }
];

export const students = [
    'nour.ahmed', 'karim.mostafa', 'salma.khaled', 'ali.mahmoud', 'farida.samir', 'hassan.tarek'
];
