/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  // Charge le fichier .env avant de lancer les tests, pour que
  // DATABASE_URL et JWT_SECRET soient disponibles (mêmes valeurs
  // qu'en développement local).
  setupFiles: ["dotenv/config"],
  testMatch: ["**/tests/**/*.test.ts"],
  // --runInBand (voir package.json) force les tests à s'exécuter les uns
  // après les autres plutôt qu'en parallèle : important ici car nos
  // tests partagent la même base de données de développement.
};
