// ============================================================
// NameMatch – Name Enrichment Service
// ============================================================

interface EnrichmentData {
  popularity_rank: number;
  trend: 'rising' | 'stable' | 'classic';
  pronunciation: string;
  similar_names: string[];
}

const ENRICHMENT_MAP: Record<string, EnrichmentData> = {
  Aria:      { popularity_rank: 18, trend: 'rising',  pronunciation: 'AR-ee-ah',    similar_names: ['Ariela', 'Ariana', 'Lyra', 'Mia'] },
  Leo:       { popularity_rank: 4,  trend: 'rising',  pronunciation: 'LEE-oh',       similar_names: ['Leon', 'Levi', 'Lucas', 'Theo'] },
  Mia:       { popularity_rank: 8,  trend: 'stable',  pronunciation: 'MEE-ah',       similar_names: ['Mila', 'Maya', 'Nia', 'Aria'] },
  Luca:      { popularity_rank: 11, trend: 'rising',  pronunciation: 'LOO-kah',      similar_names: ['Lucas', 'Luke', 'Marco', 'Leo'] },
  Emma:      { popularity_rank: 2,  trend: 'classic', pronunciation: 'EM-ah',        similar_names: ['Emily', 'Ella', 'Eva', 'Ema'] },
  Noah:      { popularity_rank: 1,  trend: 'classic', pronunciation: 'NOH-ah',       similar_names: ['Noa', 'Jonas', 'Elijah', 'Liam'] },
  Sofia:     { popularity_rank: 6,  trend: 'stable',  pronunciation: 'so-FEE-ah',    similar_names: ['Sophie', 'Sophia', 'Sofía', 'Lydia'] },
  Oliver:    { popularity_rank: 3,  trend: 'rising',  pronunciation: 'OL-ih-ver',    similar_names: ['Ollie', 'Oscar', 'Owen', 'Elliot'] },
  Luna:      { popularity_rank: 14, trend: 'rising',  pronunciation: 'LOO-nah',      similar_names: ['Lena', 'Stella', 'Aurora', 'Nova'] },
  Elias:     { popularity_rank: 22, trend: 'rising',  pronunciation: 'eh-LY-as',     similar_names: ['Eli', 'Elijah', 'Elliot', 'Isaiah'] },
  Isla:      { popularity_rank: 19, trend: 'rising',  pronunciation: 'EYE-lah',      similar_names: ['Isadora', 'Iris', 'Ivy', 'Ella'] },
  Ethan:     { popularity_rank: 7,  trend: 'stable',  pronunciation: 'EE-than',      similar_names: ['Evan', 'Easton', 'Nathan', 'Liam'] },
  Zara:      { popularity_rank: 31, trend: 'rising',  pronunciation: 'ZAR-ah',       similar_names: ['Zahra', 'Sara', 'Nara', 'Lara'] },
  Julian:    { popularity_rank: 16, trend: 'stable',  pronunciation: 'JOO-lee-an',   similar_names: ['Julius', 'Julien', 'Jasper', 'Damian'] },
  Nora:      { popularity_rank: 24, trend: 'rising',  pronunciation: 'NOR-ah',       similar_names: ['Norah', 'Cora', 'Dora', 'Flora'] },
  'Amélie':  { popularity_rank: 45, trend: 'classic', pronunciation: 'ah-may-LEE',   similar_names: ['Amelie', 'Amelia', 'Emilie', 'Zélie'] },
  Antoine:   { popularity_rank: 38, trend: 'classic', pronunciation: 'an-TWAN',      similar_names: ['Anthony', 'Anton', 'Antonin', 'Mathieu'] },
  Lorenzo:   { popularity_rank: 29, trend: 'stable',  pronunciation: 'lo-REN-zo',    similar_names: ['Leonardo', 'Enzo', 'Marco', 'Matteo'] },
  Chiara:    { popularity_rank: 33, trend: 'stable',  pronunciation: 'kee-AR-ah',    similar_names: ['Clara', 'Giada', 'Lucia', 'Mia'] },
  'Björn':   { popularity_rank: 72, trend: 'classic', pronunciation: 'BYORN',        similar_names: ['Bjarne', 'Erik', 'Lars', 'Sven'] },
  Astrid:    { popularity_rank: 41, trend: 'rising',  pronunciation: 'AH-strid',     similar_names: ['Ingrid', 'Sigrid', 'Freya', 'Solveig'] },
  Alejandro: { popularity_rank: 25, trend: 'stable',  pronunciation: 'ah-leh-HAHN-dro', similar_names: ['Alex', 'Ander', 'Javier', 'Diego'] },
  'Lucía':   { popularity_rank: 12, trend: 'rising',  pronunciation: 'loo-SEE-ah',   similar_names: ['Lucia', 'Luz', 'Luisa', 'Valentina'] },
  Finn:      { popularity_rank: 27, trend: 'rising',  pronunciation: 'FIN',          similar_names: ['Fionn', 'Flynn', 'Cian', 'Ronan'] },
  Aoife:     { popularity_rank: 56, trend: 'classic', pronunciation: 'EE-fah',       similar_names: ['Saoirse', 'Caoimhe', 'Niamh', 'Sinéad'] },
  Liam:      { popularity_rank: 1,  trend: 'classic', pronunciation: 'LEE-am',       similar_names: ['Levi', 'Logan', 'Luke', 'Leo'] },
  Olivia:    { popularity_rank: 1,  trend: 'classic', pronunciation: 'oh-LIV-ee-ah', similar_names: ['Olive', 'Livia', 'Sophia', 'Ava'] },
  Mason:     { popularity_rank: 9,  trend: 'stable',  pronunciation: 'MAY-son',      similar_names: ['Jackson', 'Logan', 'Carter', 'Hudson'] },
  Charlotte: { popularity_rank: 3,  trend: 'classic', pronunciation: 'SHAR-lot',     similar_names: ['Charlie', 'Chloe', 'Clara', 'Claire'] },
  Aiden:     { popularity_rank: 13, trend: 'stable',  pronunciation: 'AY-den',       similar_names: ['Brayden', 'Jayden', 'Hayden', 'Caden'] },
  Harper:    { popularity_rank: 10, trend: 'rising',  pronunciation: 'HAR-per',      similar_names: ['Piper', 'Parker', 'Hadley', 'Sloane'] },
  Maverick:  { popularity_rank: 37, trend: 'rising',  pronunciation: 'MAV-er-ik',    similar_names: ['Maddox', 'Sawyer', 'Phoenix', 'Axel'] },
  Aurora:    { popularity_rank: 20, trend: 'rising',  pronunciation: 'aw-ROR-ah',    similar_names: ['Aurelia', 'Dawn', 'Seraphina', 'Luna'] },
  Asher:     { popularity_rank: 15, trend: 'rising',  pronunciation: 'ASH-er',       similar_names: ['Archer', 'August', 'Atticus', 'Ryder'] },
  Hazel:     { popularity_rank: 23, trend: 'rising',  pronunciation: 'HAY-zel',      similar_names: ['Violet', 'Willow', 'Ivy', 'Olive'] },
  Mohammed:  { popularity_rank: 1,  trend: 'classic', pronunciation: 'moo-HAM-mad',  similar_names: ['Muhammad', 'Ahmad', 'Ahmed', 'Omar'] },
  Fatima:    { popularity_rank: 2,  trend: 'classic', pronunciation: 'FAH-tee-mah',  similar_names: ['Fatimah', 'Khadija', 'Aisha', 'Maryam'] },
  Ahmed:     { popularity_rank: 4,  trend: 'classic', pronunciation: 'AH-med',       similar_names: ['Ahmad', 'Mohammed', 'Omar', 'Hassan'] },
  Aisha:     { popularity_rank: 3,  trend: 'stable',  pronunciation: 'AY-shah',      similar_names: ['Aysha', 'Fatima', 'Noor', 'Layla'] },
  Omar:      { popularity_rank: 5,  trend: 'stable',  pronunciation: 'OH-mar',       similar_names: ['Umar', 'Omer', 'Ahmed', 'Hamza'] },
  Noor:      { popularity_rank: 8,  trend: 'rising',  pronunciation: 'NOOR',         similar_names: ['Nour', 'Nur', 'Layla', 'Yasmin'] },
  Yasmin:    { popularity_rank: 9,  trend: 'stable',  pronunciation: 'YAZ-min',      similar_names: ['Jasmine', 'Yasmeen', 'Noor', 'Layla'] },
  Hassan:    { popularity_rank: 6,  trend: 'classic', pronunciation: 'HAS-san',      similar_names: ['Hussain', 'Hasan', 'Ali', 'Omar'] },
  Layla:     { popularity_rank: 7,  trend: 'rising',  pronunciation: 'LAY-lah',      similar_names: ['Leila', 'Lila', 'Noor', 'Yasmin'] },
  Ibrahim:   { popularity_rank: 10, trend: 'classic', pronunciation: 'ib-rah-HEEM',  similar_names: ['Abraham', 'Brahim', 'Ismail', 'Yusuf'] },
  Kai:       { popularity_rank: 43, trend: 'rising',  pronunciation: 'KY',           similar_names: ['Kei', 'Kenji', 'Ren', 'Ryu'] },
  Sakura:    { popularity_rank: 28, trend: 'rising',  pronunciation: 'sah-KOO-rah',  similar_names: ['Hana', 'Yuki', 'Haru', 'Nozomi'] },
  Kenji:     { popularity_rank: 34, trend: 'classic', pronunciation: 'KEN-jee',      similar_names: ['Kaito', 'Ryota', 'Takumi', 'Yusei'] },
  Arjun:     { popularity_rank: 11, trend: 'rising',  pronunciation: 'AR-joon',      similar_names: ['Aarav', 'Advait', 'Rohan', 'Kiran'] },
  Priya:     { popularity_rank: 14, trend: 'stable',  pronunciation: 'PREE-yah',     similar_names: ['Divya', 'Deepa', 'Ananya', 'Kavya'] },
  Mei:       { popularity_rank: 17, trend: 'stable',  pronunciation: 'MAY',          similar_names: ['Lin', 'Xiu', 'Yue', 'Zhen'] },
  Santiago:  { popularity_rank: 5,  trend: 'rising',  pronunciation: 'san-tee-AH-go', similar_names: ['Santi', 'Mateo', 'Sebastián', 'Felipe'] },
  Valentina: { popularity_rank: 4,  trend: 'rising',  pronunciation: 'val-en-TEE-nah', similar_names: ['Valeria', 'Victoria', 'Isabella', 'Camila'] },
  'Sebastián':{ popularity_rank: 7, trend: 'stable',  pronunciation: 'seh-bas-TYAN', similar_names: ['Sebastian', 'Bastian', 'Alejandro', 'Matteo'] },
  Isabella:  { popularity_rank: 2,  trend: 'classic', pronunciation: 'iz-ah-BEL-ah', similar_names: ['Isabel', 'Isabela', 'Bella', 'Sophia'] },
  Mateo:     { popularity_rank: 3,  trend: 'rising',  pronunciation: 'mah-TEH-oh',   similar_names: ['Matteo', 'Marco', 'Pablo', 'Diego'] },
  Camila:    { popularity_rank: 6,  trend: 'rising',  pronunciation: 'kah-MEE-lah',  similar_names: ['Camilla', 'Camille', 'Valentina', 'Luciana'] },
  Diego:     { popularity_rank: 8,  trend: 'stable',  pronunciation: 'dee-EH-go',    similar_names: ['Rodrigo', 'Emilio', 'Miguel', 'Pablo'] },
  Leonardo:  { popularity_rank: 9,  trend: 'rising',  pronunciation: 'leh-oh-NAR-do', similar_names: ['Leo', 'Lorenzo', 'Luca', 'Marco'] },
  Cyrus:     { popularity_rank: 62, trend: 'rising',  pronunciation: 'SY-rus',        similar_names: ['Darius', 'Caspian', 'Sirius', 'Lyrus'] },
  Shireen:   { popularity_rank: 55, trend: 'classic', pronunciation: 'shee-REEN',    similar_names: ['Shirin', 'Shaheen', 'Leila', 'Nasrin'] },
  Emir:      { popularity_rank: 48, trend: 'rising',  pronunciation: 'eh-MEER',      similar_names: ['Emre', 'Enis', 'Ömer', 'Mert'] },
  Elif:      { popularity_rank: 3,  trend: 'classic', pronunciation: 'eh-LEEF',      similar_names: ['Esra', 'Ayse', 'Zeynep', 'Buse'] },
  Tarek:     { popularity_rank: 32, trend: 'stable',  pronunciation: 'TAH-rek',      similar_names: ['Tariq', 'Walid', 'Karim', 'Jamal'] },
  Nada:      { popularity_rank: 44, trend: 'stable',  pronunciation: 'NAH-dah',      similar_names: ['Nadia', 'Nora', 'Dina', 'Randa'] },
  Amir:      { popularity_rank: 18, trend: 'rising',  pronunciation: 'ah-MEER',      similar_names: ['Emir', 'Samir', 'Tamir', 'Zamir'] },
  Jana:      { popularity_rank: 26, trend: 'rising',  pronunciation: 'JAH-nah',      similar_names: ['Janna', 'Hana', 'Rana', 'Sana'] },
};

export function enrichName(name: string): Partial<EnrichmentData> {
  return ENRICHMENT_MAP[name] ?? {};
}

export function getTrendLabel(trend?: string): string {
  switch (trend) {
    case 'rising':  return '📈 Trending';
    case 'classic': return '👑 Classic';
    case 'stable':  return '✦ Popular';
    default:        return '';
  }
}

export function getTrendBg(trend?: string): string {
  switch (trend) {
    case 'rising':  return '#FFF8E1';
    case 'classic': return '#EAF2FF';
    case 'stable':  return '#E8F8F1';
    default:        return '#F5F5F5';
  }
}

export function getTrendFg(trend?: string): string {
  switch (trend) {
    case 'rising':  return '#C97D00';
    case 'classic': return '#2F6FE4';
    case 'stable':  return '#1A8A5A';
    default:        return '#888888';
  }
}

export function getNameLength(name: string): 'short' | 'medium' | 'long' {
  if (name.length <= 4) return 'short';
  if (name.length <= 7) return 'medium';
  return 'long';
}
