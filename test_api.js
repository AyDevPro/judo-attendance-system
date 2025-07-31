// Test rapide de l'API d'import
const testData = {
  licensees: [
    {
      firstName: "Test",
      lastName: "User", 
      dateOfBirth: "2010-01-01",
      email: "test@test.com",
      externalId: "TEST123",
      groups: ["J3"]
    }
  ]
};

console.log("Données de test pour l'API:");
console.log(JSON.stringify(testData, null, 2));

console.log("\n📝 Pour tester manuellement:");
console.log("1. Aller sur http://localhost:3000/bureau/licensees/import");
console.log("2. Se connecter avec admin@email.com");
console.log("3. Uploader le fichier test_licensees.csv");
console.log("4. Vérifier l'aperçu et importer");