/**
 * NOT imported by the app — keeps premium starter names out of the Metro bundle.
 * Use for seeds / migration tooling only.
 * IDs start at 351 to match the former in-file id() sequence.
 */
import type { BabyName } from '../src/types';

let _legacyId = 351;
const id = () => String(_legacyId++).padStart(8, '0');

export const PREMIUM_BUNDLED_LEGACY_NAMES: BabyName[] = [
  // Netherlands boost
  { id: id(), name: 'Sanne', meaning: 'Lily; grace', origin: 'Dutch', gender: 'girl', country: 'Netherlands', region: 'EU', is_worldwide: false },
  { id: id(), name: 'Daan', meaning: 'God is my judge', origin: 'Dutch / Hebrew', gender: 'boy', country: 'Netherlands', region: 'EU', is_worldwide: false },
  { id: id(), name: 'Bram', meaning: 'Father of multitudes', origin: 'Dutch / Hebrew', gender: 'boy', country: 'Netherlands', region: 'EU', is_worldwide: false },
  { id: id(), name: 'Jasmijn', meaning: 'Jasmine flower', origin: 'Dutch', gender: 'girl', country: 'Netherlands', region: 'EU', is_worldwide: false },
  { id: id(), name: 'Lotte', meaning: 'Free woman; strong', origin: 'Dutch / Germanic', gender: 'girl', country: 'Netherlands', region: 'EU', is_worldwide: false },
  { id: id(), name: 'Milan', meaning: 'Gracious; dear', origin: 'Dutch / Slavic', gender: 'boy', country: 'Netherlands', region: 'EU', is_worldwide: false },
  { id: id(), name: 'Noud', meaning: 'Powerful ruler', origin: 'Dutch', gender: 'boy', country: 'Netherlands', region: 'EU', is_worldwide: false },
  { id: id(), name: 'Femke', meaning: 'Peaceful', origin: 'Frisian / Dutch', gender: 'girl', country: 'Netherlands', region: 'EU', is_worldwide: false },
  { id: id(), name: 'Sem', meaning: 'Name; renown', origin: 'Dutch / Hebrew', gender: 'boy', country: 'Netherlands', region: 'EU', is_worldwide: false },
  { id: id(), name: 'Evi', meaning: 'Life; living one', origin: 'Dutch', gender: 'girl', country: 'Netherlands', region: 'EU', is_worldwide: false },

  // EU coverage
  { id: id(), name: 'Émile', meaning: 'Rival; eager', origin: 'French', gender: 'boy', country: 'France', region: 'EU', is_worldwide: false },
  { id: id(), name: 'Manon', meaning: 'Beloved', origin: 'French', gender: 'girl', country: 'France', region: 'EU', is_worldwide: false },
  { id: id(), name: 'Arthur', meaning: 'Bear; noble', origin: 'British', gender: 'boy', country: 'United Kingdom', region: 'EU', is_worldwide: false },
  { id: id(), name: 'Poppy', meaning: 'Poppy flower', origin: 'British', gender: 'girl', country: 'United Kingdom', region: 'EU', is_worldwide: false },
  { id: id(), name: 'Álvaro', meaning: 'Elf warrior; guardian', origin: 'Spanish', gender: 'boy', country: 'Spain', region: 'EU', is_worldwide: false },
  { id: id(), name: 'Marina', meaning: 'Of the sea', origin: 'Spanish', gender: 'girl', country: 'Spain', region: 'EU', is_worldwide: false },
  { id: id(), name: 'Jan', meaning: 'God is gracious', origin: 'Polish', gender: 'boy', country: 'Poland', region: 'EU', is_worldwide: false },
  { id: id(), name: 'Zuzanna', meaning: 'Lily flower', origin: 'Polish', gender: 'girl', country: 'Poland', region: 'EU', is_worldwide: false },
  { id: id(), name: 'Alva', meaning: 'Elf friend', origin: 'Swedish', gender: 'girl', country: 'Sweden', region: 'EU', is_worldwide: false },
  { id: id(), name: 'Nils', meaning: 'Victory of the people', origin: 'Swedish', gender: 'boy', country: 'Sweden', region: 'EU', is_worldwide: false },
  { id: id(), name: 'Leif', meaning: 'Heir; descendant', origin: 'Norwegian', gender: 'boy', country: 'Norway', region: 'EU', is_worldwide: false },
  { id: id(), name: 'Inga', meaning: 'Protected by Ing', origin: 'Norwegian', gender: 'girl', country: 'Norway', region: 'EU', is_worldwide: false },
  { id: id(), name: 'Emil', meaning: 'Rival; eager', origin: 'Danish', gender: 'boy', country: 'Denmark', region: 'EU', is_worldwide: false },
  { id: id(), name: 'Freja', meaning: 'Norse goddess', origin: 'Danish', gender: 'girl', country: 'Denmark', region: 'EU', is_worldwide: false },
  { id: id(), name: 'Noor', meaning: 'Light', origin: 'Belgian / Dutch', gender: 'girl', country: 'Belgium', region: 'EU', is_worldwide: false },
  { id: id(), name: 'Jules', meaning: 'Youthful', origin: 'Belgian / French', gender: 'boy', country: 'Belgium', region: 'EU', is_worldwide: false },
  { id: id(), name: 'Tiago', meaning: 'Supplanter', origin: 'Portuguese', gender: 'boy', country: 'Portugal', region: 'EU', is_worldwide: false },
  { id: id(), name: 'Inês', meaning: 'Pure; chaste', origin: 'Portuguese', gender: 'girl', country: 'Portugal', region: 'EU', is_worldwide: false },
  { id: id(), name: 'Aino', meaning: 'The only one', origin: 'Finnish', gender: 'girl', country: 'Finland', region: 'EU', is_worldwide: false },
  { id: id(), name: 'Eero', meaning: 'Ever ruler', origin: 'Finnish', gender: 'boy', country: 'Finland', region: 'EU', is_worldwide: false },
  { id: id(), name: 'Johann', meaning: 'God is gracious', origin: 'Austrian / German', gender: 'boy', country: 'Austria', region: 'EU', is_worldwide: false },
  { id: id(), name: 'Leni', meaning: 'Shining light', origin: 'Austrian / German', gender: 'girl', country: 'Austria', region: 'EU', is_worldwide: false },
  { id: id(), name: 'Nico', meaning: 'Victory of the people', origin: 'Swiss', gender: 'boy', country: 'Switzerland', region: 'EU', is_worldwide: false },
  { id: id(), name: 'Mila', meaning: 'Gracious; dear', origin: 'Swiss / European', gender: 'girl', country: 'Switzerland', region: 'EU', is_worldwide: false },
  { id: id(), name: 'Seán', meaning: 'God is gracious', origin: 'Irish', gender: 'boy', country: 'Ireland', region: 'EU', is_worldwide: false },
  { id: id(), name: 'Niamh', meaning: 'Bright; radiant', origin: 'Irish', gender: 'girl', country: 'Ireland', region: 'EU', is_worldwide: false },
  { id: id(), name: 'Jakub', meaning: 'Supplanter', origin: 'Czech', gender: 'boy', country: 'Czech Republic', region: 'EU', is_worldwide: false },
  { id: id(), name: 'Tereza', meaning: 'Harvester', origin: 'Czech', gender: 'girl', country: 'Czech Republic', region: 'EU', is_worldwide: false },
  { id: id(), name: 'Máté', meaning: 'Gift of God', origin: 'Hungarian', gender: 'boy', country: 'Hungary', region: 'EU', is_worldwide: false },
  { id: id(), name: 'Eszter', meaning: 'Star', origin: 'Hungarian', gender: 'girl', country: 'Hungary', region: 'EU', is_worldwide: false },
  { id: id(), name: 'Mihai', meaning: 'Who is like God', origin: 'Romanian', gender: 'boy', country: 'Romania', region: 'EU', is_worldwide: false },
  { id: id(), name: 'Ana', meaning: 'Grace', origin: 'Romanian', gender: 'girl', country: 'Romania', region: 'EU', is_worldwide: false },
  { id: id(), name: 'Yannis', meaning: 'God is gracious', origin: 'Greek', gender: 'boy', country: 'Greece', region: 'EU', is_worldwide: false },
  { id: id(), name: 'Eleni', meaning: 'Bright torch', origin: 'Greek', gender: 'girl', country: 'Greece', region: 'EU', is_worldwide: false },
  { id: id(), name: 'Aleksei', meaning: 'Defender', origin: 'Russian', gender: 'boy', country: 'Russia', region: 'EU', is_worldwide: false },
  { id: id(), name: 'Anastasia', meaning: 'Resurrection', origin: 'Russian', gender: 'girl', country: 'Russia', region: 'EU', is_worldwide: false },
  { id: id(), name: 'Hamish', meaning: 'Supplanter', origin: 'Scottish', gender: 'boy', country: 'Scotland', region: 'EU', is_worldwide: false },
  { id: id(), name: 'Eilidh', meaning: 'Radiant; shining one', origin: 'Scottish Gaelic', gender: 'girl', country: 'Scotland', region: 'EU', is_worldwide: false },

  // US region coverage
  { id: id(), name: 'Lachlan', meaning: 'From the fjord land', origin: 'Australian', gender: 'boy', country: 'Australia', region: 'US', is_worldwide: false },
  { id: id(), name: 'Matilda', meaning: 'Mighty in battle', origin: 'Australian / Germanic', gender: 'girl', country: 'Australia', region: 'US', is_worldwide: false },
  { id: id(), name: 'Bennett', meaning: 'Blessed one', origin: 'Canadian / English', gender: 'boy', country: 'Canada', region: 'US', is_worldwide: false },
  { id: id(), name: 'Maeve', meaning: 'She who intoxicates', origin: 'Canadian / Irish', gender: 'girl', country: 'Canada', region: 'US', is_worldwide: false },
  { id: id(), name: 'Arlo', meaning: 'Fortified hill', origin: 'New Zealand', gender: 'boy', country: 'New Zealand', region: 'US', is_worldwide: false },
  { id: id(), name: 'Kiri', meaning: 'Tree bark; skin of fruit', origin: 'Maori', gender: 'girl', country: 'New Zealand', region: 'US', is_worldwide: false },

  // Asia coverage
  { id: id(), name: 'Jiho', meaning: 'Wisdom and greatness', origin: 'Korean', gender: 'boy', country: 'South Korea', region: 'ASIA', is_worldwide: false },
  { id: id(), name: 'Sujin', meaning: 'Excellent and precious', origin: 'Korean', gender: 'girl', country: 'South Korea', region: 'ASIA', is_worldwide: false },
  { id: id(), name: 'Ayu', meaning: 'Beautiful', origin: 'Indonesian', gender: 'girl', country: 'Indonesia', region: 'ASIA', is_worldwide: false },
  { id: id(), name: 'Raka', meaning: 'Moon; noble', origin: 'Indonesian', gender: 'boy', country: 'Indonesia', region: 'ASIA', is_worldwide: false },
  { id: id(), name: 'Mayumi', meaning: 'Gentle beauty', origin: 'Filipino', gender: 'girl', country: 'Philippines', region: 'ASIA', is_worldwide: false },
  { id: id(), name: 'Enzo', meaning: 'Ruler of the house', origin: 'Filipino', gender: 'boy', country: 'Philippines', region: 'ASIA', is_worldwide: false },
  { id: id(), name: 'Anh', meaning: 'Peace; brightness', origin: 'Vietnamese', gender: 'neutral', country: 'Vietnam', region: 'ASIA', is_worldwide: false },
  { id: id(), name: 'Khanh', meaning: 'Joy; celebration', origin: 'Vietnamese', gender: 'neutral', country: 'Vietnam', region: 'ASIA', is_worldwide: false },
  { id: id(), name: 'Anan', meaning: 'Prosperity', origin: 'Thai', gender: 'boy', country: 'Thailand', region: 'ASIA', is_worldwide: false },
  { id: id(), name: 'Lalita', meaning: 'Graceful; charming', origin: 'Thai / Sanskrit', gender: 'girl', country: 'Thailand', region: 'ASIA', is_worldwide: false },
  { id: id(), name: 'Aiman', meaning: 'Blessed; fortunate', origin: 'Malaysian', gender: 'boy', country: 'Malaysia', region: 'ASIA', is_worldwide: false },
  { id: id(), name: 'Nurul', meaning: 'Light', origin: 'Malaysian / Arabic', gender: 'girl', country: 'Malaysia', region: 'ASIA', is_worldwide: false },
  { id: id(), name: 'Kai', meaning: 'Victory; ocean', origin: 'Singaporean', gender: 'boy', country: 'Singapore', region: 'ASIA', is_worldwide: false },
  { id: id(), name: 'Mei', meaning: 'Beautiful', origin: 'Singaporean / Chinese', gender: 'girl', country: 'Singapore', region: 'ASIA', is_worldwide: false },
  { id: id(), name: 'Hamza', meaning: 'Steadfast; strong', origin: 'Pakistani', gender: 'boy', country: 'Pakistan', region: 'ASIA', is_worldwide: false },
  { id: id(), name: 'Ayesha', meaning: 'Alive; well-living', origin: 'Pakistani / Arabic', gender: 'girl', country: 'Pakistan', region: 'ASIA', is_worldwide: false },
  { id: id(), name: 'Rafi', meaning: 'Exalted', origin: 'Bangladeshi', gender: 'boy', country: 'Bangladesh', region: 'ASIA', is_worldwide: false },
  { id: id(), name: 'Nusrat', meaning: 'Help; victory', origin: 'Bangladeshi', gender: 'girl', country: 'Bangladesh', region: 'ASIA', is_worldwide: false },

  // MENA and Arabia coverage
  { id: id(), name: 'Youssef', meaning: 'God increases', origin: 'Algerian / Arabic', gender: 'boy', country: 'Algeria', region: 'MENA', is_worldwide: false },
  { id: id(), name: 'Lina', meaning: 'Tender; delicate', origin: 'Algerian / Arabic', gender: 'girl', country: 'Algeria', region: 'MENA', is_worldwide: false },
  { id: id(), name: 'Sami', meaning: 'Elevated; sublime', origin: 'Tunisian / Arabic', gender: 'boy', country: 'Tunisia', region: 'MENA', is_worldwide: false },
  { id: id(), name: 'Meriem', meaning: 'Beloved', origin: 'Tunisian / Arabic', gender: 'girl', country: 'Tunisia', region: 'MENA', is_worldwide: false },
  { id: id(), name: 'Noam', meaning: 'Pleasantness', origin: 'Hebrew', gender: 'boy', country: 'Israel', region: 'MENA', is_worldwide: false },
  { id: id(), name: 'Yael', meaning: 'Mountain goat; strength', origin: 'Hebrew', gender: 'girl', country: 'Israel', region: 'MENA', is_worldwide: false },
  { id: id(), name: 'Rami', meaning: 'Archer', origin: 'Jordanian / Arabic', gender: 'boy', country: 'Jordan', region: 'MENA', is_worldwide: false },
  { id: id(), name: 'Dana', meaning: 'Wise; pearl', origin: 'Jordanian / Arabic', gender: 'girl', country: 'Jordan', region: 'MENA', is_worldwide: false },
  { id: id(), name: 'Zayed', meaning: 'Growth; abundance', origin: 'Emirati / Arabic', gender: 'boy', country: 'UAE', region: 'ARABIA', is_worldwide: false },
  { id: id(), name: 'Maha', meaning: 'Wild cow; moon-like eyes', origin: 'Emirati / Arabic', gender: 'girl', country: 'UAE', region: 'ARABIA', is_worldwide: false },
  { id: id(), name: 'Fahad', meaning: 'Leopard', origin: 'Kuwaiti / Arabic', gender: 'boy', country: 'Kuwait', region: 'ARABIA', is_worldwide: false },
  { id: id(), name: 'Reem', meaning: 'Gazelle', origin: 'Kuwaiti / Arabic', gender: 'girl', country: 'Kuwait', region: 'ARABIA', is_worldwide: false },
  { id: id(), name: 'Tamim', meaning: 'Complete; strong', origin: 'Qatari / Arabic', gender: 'boy', country: 'Qatar', region: 'ARABIA', is_worldwide: false },
  { id: id(), name: 'Noora', meaning: 'Light', origin: 'Qatari / Arabic', gender: 'girl', country: 'Qatar', region: 'ARABIA', is_worldwide: false },
  { id: id(), name: 'Salman', meaning: 'Safe; secure', origin: 'Bahraini / Arabic', gender: 'boy', country: 'Bahrain', region: 'ARABIA', is_worldwide: false },
  { id: id(), name: 'Lulwa', meaning: 'Pearl', origin: 'Bahraini / Arabic', gender: 'girl', country: 'Bahrain', region: 'ARABIA', is_worldwide: false },
  { id: id(), name: 'Said', meaning: 'Happy; fortunate', origin: 'Omani / Arabic', gender: 'boy', country: 'Oman', region: 'ARABIA', is_worldwide: false },
  { id: id(), name: 'Mazoon', meaning: 'Rain clouds', origin: 'Omani / Arabic', gender: 'girl', country: 'Oman', region: 'ARABIA', is_worldwide: false },

  // LATAM coverage
  { id: id(), name: 'Inti', meaning: 'Sun', origin: 'Peruvian / Quechua', gender: 'boy', country: 'Peru', region: 'LATIN_AMERICA', is_worldwide: false },
  { id: id(), name: 'Nayra', meaning: 'Eyes; vision', origin: 'Peruvian / Aymara', gender: 'girl', country: 'Peru', region: 'LATIN_AMERICA', is_worldwide: false },
  { id: id(), name: 'Benjamín', meaning: 'Son of the right hand', origin: 'Chilean / Spanish', gender: 'boy', country: 'Chile', region: 'LATIN_AMERICA', is_worldwide: false },
  { id: id(), name: 'Josefa', meaning: 'God will add', origin: 'Chilean / Spanish', gender: 'girl', country: 'Chile', region: 'LATIN_AMERICA', is_worldwide: false },
  { id: id(), name: 'Sofía', meaning: 'Wisdom', origin: 'Venezuelan / Spanish', gender: 'girl', country: 'Venezuela', region: 'LATIN_AMERICA', is_worldwide: false },
  { id: id(), name: 'Miguel', meaning: 'Who is like God', origin: 'Venezuelan / Spanish', gender: 'boy', country: 'Venezuela', region: 'LATIN_AMERICA', is_worldwide: false },

  // WORLDWIDE region countries
  { id: id(), name: 'Ayo', meaning: 'Joy', origin: 'Nigerian', gender: 'boy', country: 'Nigeria', region: 'WORLDWIDE', is_worldwide: false },
  { id: id(), name: 'Amara', meaning: 'Grace; eternal', origin: 'Nigerian / Igbo', gender: 'girl', country: 'Nigeria', region: 'WORLDWIDE', is_worldwide: false },
  { id: id(), name: 'Kiptoo', meaning: 'Born at night', origin: 'Kenyan', gender: 'boy', country: 'Kenya', region: 'WORLDWIDE', is_worldwide: false },
  { id: id(), name: 'Wanjiru', meaning: 'Of the dark moon', origin: 'Kenyan', gender: 'girl', country: 'Kenya', region: 'WORLDWIDE', is_worldwide: false },
  { id: id(), name: 'Thabo', meaning: 'Joy', origin: 'South African', gender: 'boy', country: 'South Africa', region: 'WORLDWIDE', is_worldwide: false },
  { id: id(), name: 'Naledi', meaning: 'Star', origin: 'South African', gender: 'girl', country: 'South Africa', region: 'WORLDWIDE', is_worldwide: false },
];
