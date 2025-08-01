// Script de test pour l'importation de licenciés
const testData = [
  {
    firstName: "Test",
    lastName: "Utilisateur", 
    dateOfBirth: "2008-05-14",
    email: "test.user@mail.com",
    externalId: "TEST001",
    groups: ["J2"]
  },
  {
    firstName: "Test2",
    lastName: "Utilisateur2",
    dateOfBirth: "2012-09-22", 
    email: "test2.user@mail.com",
    externalId: "TEST002",
    groups: ["J3"]
  }
];

console.log("Données de test pour l'importation:");
console.log(JSON.stringify({ licensees: testData }, null, 2));