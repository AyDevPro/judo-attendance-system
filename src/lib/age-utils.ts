/**
 * Utilitaires pour le calcul de l'âge et des catégories judo
 */

export type JudoCategory = 
  | 'PRE_POUSSIN'
  | 'POUSSIN' 
  | 'BENJAMIN'
  | 'MINIME'
  | 'CADET'
  | 'JUNIOR'
  | 'SENIOR';

export type Gender = 'MALE' | 'FEMALE' | 'NEUTRAL';

export type BeltColor = 
  | 'BLANCHE'
  | 'JAUNE'
  | 'ORANGE'
  | 'VERTE'
  | 'BLEUE'
  | 'MARRON'
  | 'DAN_1'
  | 'DAN_2'
  | 'DAN_3'
  | 'DAN_4'
  | 'DAN_5'
  | 'DAN_6'
  | 'DAN_7'
  | 'DAN_8'
  | 'DAN_9'
  | 'DAN_10';

/**
 * Calcule l'âge en années à partir d'une date de naissance
 */
export function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Calcule l'âge à partir d'une date de naissance sous forme de string
 */
export function calculateAgeFromString(dateOfBirthString: string): number {
  return calculateAge(new Date(dateOfBirthString));
}

/**
 * Calcule la catégorie judo selon l'année de naissance
 * La saison sportive va de septembre à août de l'année suivante
 * Pour la saison 2025-2026 :
 */
export function calculateJudoCategory(dateOfBirth: Date): JudoCategory {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0 = janvier, 8 = septembre
  
  // Déterminer la saison sportive actuelle
  // La saison commence en septembre (mois 8)
  const sportSeason = currentMonth >= 8 ? currentYear : currentYear - 1;
  
  const birthYear = dateOfBirth.getFullYear();
  
  // Calcul basé sur la saison sportive 2025-2026
  if (birthYear >= 2018) {
    return 'PRE_POUSSIN'; // 6-7 ans (2018-2019)
  } else if (birthYear >= 2016) {
    return 'POUSSIN'; // 8-9 ans (2016-2017)
  } else if (birthYear >= 2014) {
    return 'BENJAMIN'; // 10-11 ans (2014-2015)
  } else if (birthYear >= 2012) {
    return 'MINIME'; // 12-13 ans (2012-2013)
  } else if (birthYear >= 2009) {
    return 'CADET'; // 14-16 ans (2009-2010-2011)
  } else if (birthYear >= 2006) {
    return 'JUNIOR'; // 17-19 ans (2006-2007-2008)
  } else {
    return 'SENIOR'; // 20+ ans (2005 et avant)
  }
}

/**
 * Calcule la catégorie judo à partir d'une date de naissance sous forme de string
 */
export function calculateJudoCategoryFromString(dateOfBirthString: string): JudoCategory {
  return calculateJudoCategory(new Date(dateOfBirthString));
}

/**
 * Retourne le nom français de la catégorie
 */
export function getJudoCategoryDisplayName(category: JudoCategory): string {
  const names: Record<JudoCategory, string> = {
    PRE_POUSSIN: 'Pré-Poussin',
    POUSSIN: 'Poussin',
    BENJAMIN: 'Benjamin',
    MINIME: 'Minime',
    CADET: 'Cadet',
    JUNIOR: 'Junior',
    SENIOR: 'Senior'
  };
  return names[category];
}

/**
 * Retourne le nom français du genre
 */
export function getGenderDisplayName(gender: Gender): string {
  switch (gender) {
    case 'MALE':
      return 'Masculin';
    case 'FEMALE':
      return 'Féminin';
    case 'NEUTRAL':
      return 'Neutre';
    default:
      return 'Non spécifié';
  }
}

/**
 * Retourne le nom français de la couleur de ceinture
 */
export function getBeltColorDisplayName(beltColor: BeltColor): string {
  const names: Record<BeltColor, string> = {
    BLANCHE: 'Blanche',
    JAUNE: 'Jaune',
    ORANGE: 'Orange',
    VERTE: 'Verte',
    BLEUE: 'Bleue',
    MARRON: 'Marron',
    DAN_1: '1er Dan',
    DAN_2: '2e Dan',
    DAN_3: '3e Dan',
    DAN_4: '4e Dan',
    DAN_5: '5e Dan',
    DAN_6: '6e Dan',
    DAN_7: '7e Dan',
    DAN_8: '8e Dan',
    DAN_9: '9e Dan',
    DAN_10: '10e Dan'
  };
  return names[beltColor];
}