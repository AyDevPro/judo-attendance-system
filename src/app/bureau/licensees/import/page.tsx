"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { withAuth } from "@/components/withAuth";
import { useToast } from "@/components/ToastProvider";
import Papa from "papaparse";

interface CSVLicensee {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'M' | 'F' | 'N' | 'MALE' | 'FEMALE' | 'NEUTRAL';
  email?: string;
  beltColor?: string;
  externalId?: string;
  groups: string[];
}

interface ParsedData {
  licensees: CSVLicensee[];
  errors: string[];
}

interface ImportResult {
  created: number;
  duplicates: number;
  errors: string[];
  summary: {
    licensees_created: CSVLicensee[];
    duplicates_ignored: CSVLicensee[];
    errors_details: Array<{ row: number; licensee: CSVLicensee; error: string }>;
  };
}

function LicenseesImportPage() {
  const { showSuccess, showError, showWarning } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
      parseCSVFile(selectedFile);
    } else {
      showWarning("Fichier invalide", "Veuillez sélectionner un fichier CSV valide.");
    }
  };

  const parseCSVFile = (file: File) => {
    setIsParsingFile(true);
    setParsedData(null);
    setImportResult(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: "UTF-8",
      complete: (results) => {
        const licensees: CSVLicensee[] = [];
        const errors: string[] = [];

        results.data.forEach((row: any, index: number) => {
          try {
            // Mapper les colonnes CSV aux champs attendus
            const firstName = row["Prénom"]?.trim();
            const lastName = row["Nom"]?.trim();
            const dateOfBirth = row["Date de naissance"]?.trim();
            const gender = row["Sexe"]?.trim();
            const email = row["Email"]?.trim() || undefined;
            const beltColor = row["Couleur de ceinture"]?.trim() || undefined;
            const externalId = row["Numéro de licence"]?.trim() || undefined;
            const groupsStr = row["Groupe(s)"]?.trim() || "";

            // Validation des champs obligatoires
            if (!firstName || !lastName || !dateOfBirth || !gender) {
              errors.push(`Ligne ${index + 2}: Prénom, nom, date de naissance et sexe sont obligatoires`);
              return;
            }

            // Normaliser et valider la date
            let normalizedDate = dateOfBirth;
            
            // Gérer les formats DD/MM/YYYY ou DD-MM-YYYY
            if (dateOfBirth.match(/^\d{2}[\/\-]\d{2}[\/\-]\d{4}$/)) {
              const parts = dateOfBirth.split(/[\/\-]/);
              normalizedDate = `${parts[2]}-${parts[1]}-${parts[0]}`; // Convertir en YYYY-MM-DD
            }
            
            // Validation de la date
            if (isNaN(Date.parse(normalizedDate))) {
              errors.push(`Ligne ${index + 2}: Date de naissance invalide (${dateOfBirth}). Utilisez le format DD/MM/YYYY ou YYYY-MM-DD`);
              return;
            }

            // Parser les groupes (séparés par virgule ou point-virgule)
            const groups = groupsStr
              .split(/[,;]/)
              .map((g: string) => g.trim())
              .filter((g: string) => g.length > 0);

            licensees.push({
              firstName,
              lastName,
              dateOfBirth: normalizedDate,
              gender,
              email,
              beltColor,
              externalId,
              groups
            });

          } catch (error: any) {
            errors.push(`Ligne ${index + 2}: ${error.message}`);
          }
        });

        setParsedData({ licensees, errors });
        setIsParsingFile(false);
      },
      error: (error) => {
        console.error("Erreur de parsing CSV:", error);
        showError("Erreur de lecture", "Erreur lors de la lecture du fichier CSV.");
        setIsParsingFile(false);
      }
    });
  };

  const handleImport = async () => {
    if (!parsedData || parsedData.licensees.length === 0) {
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      const response = await fetch("/api/licensees/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ licensees: parsedData.licensees }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de l'import");
      }

      const result: ImportResult = await response.json();
      setImportResult(result);

    } catch (error: any) {
      showError("Erreur d'import", error.message);
    } finally {
      setIsImporting(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setParsedData(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const downloadTemplate = () => {
    const template = `Prénom,Nom,Date de naissance,Sexe,Email,Couleur de ceinture,Numéro de licence,Groupe(s)
Jean,Dupont,2008-05-14,M,jean.dupont@mail.com,Verte,123456,J3
Marie,Leroy,2012-09-22,F,marie.leroy@mail.com,3e Dan,234567,J2
Paul,Martin,2015-01-03,N,,Blanche,345678,PRIMA`;

    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "template_licensees.csv";
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="w-full max-w-none mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => router.back()}
                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2 transition-colors duration-200"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Retour
              </button>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Import CSV des licenciés
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Importez des licenciés en masse depuis un fichier CSV
              </p>
            </div>
            <button
              onClick={downloadTemplate}
              className="inline-flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Télécharger le modèle
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Format du fichier CSV
          </h2>
          <div className="space-y-3 text-sm text-gray-700">
            <p><strong>Colonnes requises :</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><strong>Prénom</strong> (obligatoire)</li>
              <li><strong>Nom</strong> (obligatoire)</li>
              <li><strong>Date de naissance</strong> (obligatoire, format DD/MM/YYYY ou YYYY-MM-DD)</li>
              <li><strong>Sexe</strong> (obligatoire, M/F/N ou MALE/FEMALE/NEUTRAL)</li>
              <li><strong>Email</strong> (optionnel)</li>
              <li><strong>Couleur de ceinture</strong> (optionnel, ex: Blanche, Jaune, 1er Dan, 2e Dan...)</li>
              <li><strong>Numéro de licence</strong> (optionnel)</li>
              <li><strong>Groupe(s)</strong> (optionnel, séparer par virgule si plusieurs)</li>
            </ul>
            <p className="text-blue-600"><strong>Astuce :</strong> Téléchargez le modèle ci-dessus pour avoir le bon format.</p>
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sélectionner le fichier CSV</h2>
          
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors duration-200">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Choisir un fichier CSV
            </button>
            
            {file && (
              <p className="mt-2 text-sm text-gray-600">
                Fichier sélectionné: <span className="font-medium">{file.name}</span>
              </p>
            )}
          </div>

          {isParsingFile && (
            <div className="mt-4 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
              <span className="text-sm text-gray-600">Analyse du fichier en cours...</span>
            </div>
          )}
        </div>

        {/* Preview Section */}
        {parsedData && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Aperçu des données ({parsedData.licensees.length} licenciés détectés)
              </h2>
            </div>

            {/* Erreurs de parsing */}
            {parsedData.errors.length > 0 && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 m-4 rounded">
                <h3 className="text-sm font-medium text-red-800 mb-2">Erreurs détectées :</h3>
                <ul className="text-sm text-red-700 space-y-1">
                  {parsedData.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Table de prévisualisation */}
            {parsedData.licensees.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Prénom
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nom
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date de naissance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sexe
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ceinture
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Licence
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Groupes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {parsedData.licensees.slice(0, 10).map((licensee, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {licensee.firstName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {licensee.lastName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(licensee.dateOfBirth).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {licensee.gender === 'M' || licensee.gender === 'MALE' ? 'Masculin' : 
                           licensee.gender === 'F' || licensee.gender === 'FEMALE' ? 'Féminin' : 'Neutre'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {licensee.email || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {licensee.beltColor || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {licensee.externalId || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {licensee.groups.length > 0 ? licensee.groups.join(', ') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {parsedData.licensees.length > 10 && (
                  <div className="px-6 py-3 bg-gray-50 text-sm text-gray-600">
                    ... et {parsedData.licensees.length - 10} autres licenciés
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            {parsedData.licensees.length > 0 && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                <button
                  onClick={resetForm}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Annuler
                </button>
                <button
                  onClick={handleImport}
                  disabled={isImporting}
                  className="inline-flex items-center px-6 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isImporting && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  )}
                  {isImporting ? "Import en cours..." : `Importer ${parsedData.licensees.length} licenciés`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Results Section */}
        {importResult && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Résultats de l'import
            </h2>

            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">{importResult.created}</div>
                <div className="text-sm text-green-700">Licenciés créés</div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="text-2xl font-bold text-yellow-600">{importResult.duplicates}</div>
                <div className="text-sm text-yellow-700">Doublons ignorés</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-600">{importResult.errors.length}</div>
                <div className="text-sm text-red-700">Erreurs</div>
              </div>
            </div>

            {/* Detailed errors */}
            {importResult.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <h3 className="text-sm font-medium text-red-800 mb-2">Détail des erreurs :</h3>
                <ul className="text-sm text-red-700 space-y-1 max-h-40 overflow-y-auto">
                  {importResult.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={resetForm}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Nouvel import
              </button>
              <button
                onClick={() => router.push('/bureau/licensees')}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Voir les licenciés
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default withAuth(LicenseesImportPage, { requiredRoles: ["ADMIN", "BUREAU"] });