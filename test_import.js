// Simple test script to verify the CSV import functionality
const fs = require('fs');

// Test data based on our CSV
const testLicensees = [
  {
    firstName: "Jean",
    lastName: "Dupont", 
    dateOfBirth: "2008-05-14",
    email: "jean.dupont@mail.com",
    externalId: "123456",
    groups: ["J3"]
  },
  {
    firstName: "Marie",
    lastName: "Leroy",
    dateOfBirth: "2012-09-22", 
    email: "marie.leroy@mail.com",
    externalId: "234567",
    groups: ["J2"]
  },
  {
    firstName: "Paul",
    lastName: "Martin",
    dateOfBirth: "2015-01-03",
    email: undefined,
    externalId: "345678", 
    groups: ["Prima"]
  }
];

console.log("Test data prepared:");
console.log(JSON.stringify(testLicensees, null, 2));

console.log("\nCSV data:");
console.log(fs.readFileSync('./test_licensees.csv', 'utf8'));

console.log("\n✅ Test data ready for import!");
console.log("📝 Use this data to test the CSV import via the web interface at http://localhost:3000");
console.log("🔑 Login with admin@email.com (password: password123)");