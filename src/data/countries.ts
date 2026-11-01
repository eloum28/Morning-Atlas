import { CountryInfo, Region } from '../types';

export const COUNTRIES: CountryInfo[] = [
  // AFRICA
  { code: 'SN', code3: 'SEN', nameEn: 'Senegal', nameFr: 'Sénégal', region: 'Africa', continent: 'Africa', capital: 'Dakar', languages: ['French', 'Wolof'], flag: '🇸🇳', lat: 14.4974, lng: -14.4524 },
  { code: 'MA', code3: 'MAR', nameEn: 'Morocco', nameFr: 'Maroc', region: 'Africa', continent: 'Africa', capital: 'Rabat', languages: ['Arabic', 'French'], flag: '🇲🇦', lat: 31.7917, lng: -7.0926 },
  { code: 'EH', code3: 'ESH', nameEn: 'Western Sahara', nameFr: 'Sahara occidental', region: 'Africa', continent: 'Africa', capital: 'Laayoune', languages: ['Arabic', 'Spanish', 'Hassaniya'], flag: '🇪🇭', lat: 24.2155, lng: -12.8858 },
  { code: 'NG', code3: 'NGA', nameEn: 'Nigeria', nameFr: 'Nigéria', region: 'Africa', continent: 'Africa', capital: 'Abuja', languages: ['English'], flag: '🇳🇬', lat: 9.082, lng: 8.6753 },
  { code: 'GH', code3: 'GHA', nameEn: 'Ghana', nameFr: 'Ghana', region: 'Africa', continent: 'Africa', capital: 'Accra', languages: ['English'], flag: '🇬🇭', lat: 7.9465, lng: -1.0232 },
  { code: 'ZA', code3: 'ZAF', nameEn: 'South Africa', nameFr: 'Afrique du Sud', region: 'Africa', continent: 'Africa', capital: 'Pretoria', languages: ['English', 'Afrikaans', 'Zulu'], flag: '🇿🇦', lat: -30.5595, lng: 22.9375 },
  { code: 'KE', code3: 'KEN', nameEn: 'Kenya', nameFr: 'Kenya', region: 'Africa', continent: 'Africa', capital: 'Nairobi', languages: ['English', 'Swahili'], flag: '🇰🇪', lat: -0.0236, lng: 37.9062 },
  { code: 'EG', code3: 'EGY', nameEn: 'Egypt', nameFr: 'Égypte', region: 'Middle East', continent: 'Africa', capital: 'Cairo', languages: ['Arabic'], flag: '🇪🇬', lat: 26.8206, lng: 30.8025 },
  { code: 'DZ', code3: 'DZA', nameEn: 'Algeria', nameFr: 'Algérie', region: 'Africa', continent: 'Africa', capital: 'Algiers', languages: ['Arabic', 'French'], flag: '🇩🇿', lat: 28.0339, lng: 1.6596 },
  { code: 'TN', code3: 'TUN', nameEn: 'Tunisia', nameFr: 'Tunisie', region: 'Africa', continent: 'Africa', capital: 'Tunis', languages: ['Arabic', 'French'], flag: '🇹🇳', lat: 33.8869, lng: 9.5375 },
  { code: 'CI', code3: 'CIV', nameEn: "Côte d'Ivoire", nameFr: "Côte d'Ivoire", region: 'Africa', continent: 'Africa', capital: 'Yamoussoukro', languages: ['French'], flag: '🇨🇮', lat: 7.54, lng: -5.5471 },
  { code: 'ET', code3: 'ETH', nameEn: 'Ethiopia', nameFr: 'Éthiopie', region: 'Africa', continent: 'Africa', capital: 'Addis Ababa', languages: ['Amharic'], flag: '🇪🇹', lat: 9.145, lng: 40.4897 },
  { code: 'RW', code3: 'RWA', nameEn: 'Rwanda', nameFr: 'Rwanda', region: 'Africa', continent: 'Africa', capital: 'Kigali', languages: ['Kinyarwanda', 'French', 'English'], flag: '🇷🇼', lat: -1.9403, lng: 29.8739 },
  { code: 'CD', code3: 'COD', nameEn: 'DR Congo', nameFr: 'RD Congo', region: 'Africa', continent: 'Africa', capital: 'Kinshasa', languages: ['French', 'Lingala'], flag: '🇨🇩', lat: -4.0383, lng: 21.7587 },
  { code: 'CM', code3: 'CMR', nameEn: 'Cameroon', nameFr: 'Cameroun', region: 'Africa', continent: 'Africa', capital: 'Yaoundé', languages: ['French', 'English'], flag: '🇨🇲', lat: 7.3697, lng: 12.3547 },
  { code: 'TZ', code3: 'TZA', nameEn: 'Tanzania', nameFr: 'Tanzanie', region: 'Africa', continent: 'Africa', capital: 'Dodoma', languages: ['Swahili', 'English'], flag: '🇹🇿', lat: -6.369, lng: 34.8888 },
  { code: 'UG', code3: 'UGA', nameEn: 'Uganda', nameFr: 'Ouganda', region: 'Africa', continent: 'Africa', capital: 'Kampala', languages: ['English', 'Swahili'], flag: '🇺🇬', lat: 1.3733, lng: 32.2903 },
  { code: 'AO', code3: 'AGO', nameEn: 'Angola', nameFr: 'Angola', region: 'Africa', continent: 'Africa', capital: 'Luanda', languages: ['Portuguese'], flag: '🇦🇴', lat: -11.2027, lng: 17.8739 },
  { code: 'ML', code3: 'MLI', nameEn: 'Mali', nameFr: 'Mali', region: 'Africa', continent: 'Africa', capital: 'Bamako', languages: ['French', 'Bambara'], flag: '🇲🇱', lat: 17.5707, lng: -3.9962 },
  { code: 'BF', code3: 'BFA', nameEn: 'Burkina Faso', nameFr: 'Burkina Faso', region: 'Africa', continent: 'Africa', capital: 'Ouagadougou', languages: ['French'], flag: '🇧🇫', lat: 12.2383, lng: -1.5616 },
  { code: 'NE', code3: 'NER', nameEn: 'Niger', nameFr: 'Niger', region: 'Africa', continent: 'Africa', capital: 'Niamey', languages: ['French'], flag: '🇳🇪', lat: 17.6078, lng: 8.0817 },
  { code: 'GN', code3: 'GIN', nameEn: 'Guinea', nameFr: 'Guinée', region: 'Africa', continent: 'Africa', capital: 'Conakry', languages: ['French'], flag: '🇬🇳', lat: 9.9456, lng: -9.6966 },
  { code: 'MG', code3: 'MDG', nameEn: 'Madagascar', nameFr: 'Madagascar', region: 'Africa', continent: 'Africa', capital: 'Antananarivo', languages: ['Malagasy', 'French'], flag: '🇲🇬', lat: -18.7669, lng: 46.8691 },
  { code: 'MZ', code3: 'MOZ', nameEn: 'Mozambique', nameFr: 'Mozambique', region: 'Africa', continent: 'Africa', capital: 'Maputo', languages: ['Portuguese'], flag: '🇲🇿', lat: -18.6657, lng: 35.5296 },
  { code: 'ZW', code3: 'ZWE', nameEn: 'Zimbabwe', nameFr: 'Zimbabwe', region: 'Africa', continent: 'Africa', capital: 'Harare', languages: ['English', 'Shona'], flag: '🇿🇼', lat: -19.0154, lng: 29.1549 },
  { code: 'ZM', code3: 'ZMB', nameEn: 'Zambia', nameFr: 'Zambie', region: 'Africa', continent: 'Africa', capital: 'Lusaka', languages: ['English'], flag: '🇿🇲', lat: -13.1339, lng: 27.8493 },
  { code: 'SD', code3: 'SDN', nameEn: 'Sudan', nameFr: 'Soudan', region: 'Africa', continent: 'Africa', capital: 'Khartoum', languages: ['Arabic', 'English'], flag: '🇸🇩', lat: 12.8628, lng: 30.2176 },
  { code: 'LY', code3: 'LBY', nameEn: 'Libya', nameFr: 'Libye', region: 'Africa', continent: 'Africa', capital: 'Tripoli', languages: ['Arabic'], flag: '🇱🇾', lat: 26.3351, lng: 17.2283 },
  { code: 'SO', code3: 'SOM', nameEn: 'Somalia', nameFr: 'Somalie', region: 'Africa', continent: 'Africa', capital: 'Mogadishu', languages: ['Somali', 'Arabic'], flag: '🇸🇴', lat: 5.1521, lng: 46.1996 },
  { code: 'CG', code3: 'COG', nameEn: 'Republic of the Congo', nameFr: 'Congo-Brazzaville', region: 'Africa', continent: 'Africa', capital: 'Brazzaville', languages: ['French'], flag: '🇨🇬', lat: -0.228, lng: 15.8277 },
  { code: 'GA', code3: 'GAB', nameEn: 'Gabon', nameFr: 'Gabon', region: 'Africa', continent: 'Africa', capital: 'Libreville', languages: ['French'], flag: '🇬🇦', lat: -0.8037, lng: 11.6094 },
  { code: 'BJ', code3: 'BEN', nameEn: 'Benin', nameFr: 'Bénin', region: 'Africa', continent: 'Africa', capital: 'Porto-Novo', languages: ['French'], flag: '🇧🇯', lat: 9.3077, lng: 2.3158 },
  { code: 'TG', code3: 'TGO', nameEn: 'Togo', nameFr: 'Togo', region: 'Africa', continent: 'Africa', capital: 'Lomé', languages: ['French'], flag: '🇹🇬', lat: 8.6195, lng: 0.8248 },
  { code: 'MR', code3: 'MRT', nameEn: 'Mauritania', nameFr: 'Mauritanie', region: 'Africa', continent: 'Africa', capital: 'Nouakchott', languages: ['Arabic', 'French'], flag: '🇲🇷', lat: 21.0079, lng: -10.9408 },

  // EUROPE
  { code: 'FR', code3: 'FRA', nameEn: 'France', nameFr: 'France', region: 'Europe', continent: 'Europe', capital: 'Paris', languages: ['French'], flag: '🇫🇷', lat: 46.2276, lng: 2.2137 },
  { code: 'GB', code3: 'GBR', nameEn: 'United Kingdom', nameFr: 'Royaume-Uni', region: 'Europe', continent: 'Europe', capital: 'London', languages: ['English'], flag: '🇬🇧', lat: 55.3781, lng: -3.436 },
  { code: 'DE', code3: 'DEU', nameEn: 'Germany', nameFr: 'Allemagne', region: 'Europe', continent: 'Europe', capital: 'Berlin', languages: ['German'], flag: '🇩🇪', lat: 51.1657, lng: 10.4515 },
  { code: 'ES', code3: 'ESP', nameEn: 'Spain', nameFr: 'Espagne', region: 'Europe', continent: 'Europe', capital: 'Madrid', languages: ['Spanish', 'Catalan'], flag: '🇪🇸', lat: 40.4637, lng: -3.7492 },
  { code: 'IT', code3: 'ITA', nameEn: 'Italy', nameFr: 'Italie', region: 'Europe', continent: 'Europe', capital: 'Rome', languages: ['Italian'], flag: '🇮🇹', lat: 41.8719, lng: 12.5674 },
  { code: 'PT', code3: 'PRT', nameEn: 'Portugal', nameFr: 'Portugal', region: 'Europe', continent: 'Europe', capital: 'Lisbon', languages: ['Portuguese'], flag: '🇵🇹', lat: 39.3999, lng: -8.2245 },
  { code: 'UA', code3: 'UKR', nameEn: 'Ukraine', nameFr: 'Ukraine', region: 'Europe', continent: 'Europe', capital: 'Kyiv', languages: ['Ukrainian'], flag: '🇺🇦', lat: 48.3794, lng: 31.1656 },
  { code: 'RU', code3: 'RUS', nameEn: 'Russia', nameFr: 'Russie', region: 'Europe', continent: 'Europe', capital: 'Moscow', languages: ['Russian'], flag: '🇷🇺', lat: 61.524, lng: 105.3188 },
  { code: 'PL', code3: 'POL', nameEn: 'Poland', nameFr: 'Pologne', region: 'Europe', continent: 'Europe', capital: 'Warsaw', languages: ['Polish'], flag: '🇵🇱', lat: 51.9194, lng: 19.1451 },
  { code: 'NL', code3: 'NLD', nameEn: 'Netherlands', nameFr: 'Pays-Bas', region: 'Europe', continent: 'Europe', capital: 'Amsterdam', languages: ['Dutch'], flag: '🇳🇱', lat: 52.1326, lng: 5.2913 },
  { code: 'BE', code3: 'BEL', nameEn: 'Belgium', nameFr: 'Belgique', region: 'Europe', continent: 'Europe', capital: 'Brussels', languages: ['French', 'Dutch', 'German'], flag: '🇧🇪', lat: 50.5039, lng: 4.4699 },
  { code: 'CH', code3: 'CHE', nameEn: 'Switzerland', nameFr: 'Suisse', region: 'Europe', continent: 'Europe', capital: 'Bern', languages: ['German', 'French', 'Italian'], flag: '🇨🇭', lat: 46.8182, lng: 8.2275 },
  { code: 'SE', code3: 'SWE', nameEn: 'Sweden', nameFr: 'Suède', region: 'Europe', continent: 'Europe', capital: 'Stockholm', languages: ['Swedish'], flag: '🇸🇪', lat: 60.1282, lng: 18.6435 },
  { code: 'NO', code3: 'NOR', nameEn: 'Norway', nameFr: 'Norvège', region: 'Europe', continent: 'Europe', capital: 'Oslo', languages: ['Norwegian'], flag: '🇳🇴', lat: 60.472, lng: 8.4689 },
  { code: 'DK', code3: 'DNK', nameEn: 'Denmark', nameFr: 'Danemark', region: 'Europe', continent: 'Europe', capital: 'Copenhagen', languages: ['Danish'], flag: '🇩🇰', lat: 56.2639, lng: 9.5018 },
  { code: 'FI', code3: 'FIN', nameEn: 'Finland', nameFr: 'Finlande', region: 'Europe', continent: 'Europe', capital: 'Helsinki', languages: ['Finnish', 'Swedish'], flag: '🇫🇮', lat: 61.9241, lng: 25.7482 },
  { code: 'IE', code3: 'IRL', nameEn: 'Ireland', nameFr: 'Irlande', region: 'Europe', continent: 'Europe', capital: 'Dublin', languages: ['English', 'Irish'], flag: '🇮🇪', lat: 53.1424, lng: -7.6921 },
  { code: 'AT', code3: 'AUT', nameEn: 'Austria', nameFr: 'Autriche', region: 'Europe', continent: 'Europe', capital: 'Vienna', languages: ['German'], flag: '🇦🇹', lat: 47.5162, lng: 14.5501 },
  { code: 'GR', code3: 'GRC', nameEn: 'Greece', nameFr: 'Grèce', region: 'Europe', continent: 'Europe', capital: 'Athens', languages: ['Greek'], flag: '🇬🇷', lat: 39.0742, lng: 21.8243 },
  { code: 'CZ', code3: 'CZE', nameEn: 'Czech Republic', nameFr: 'Tchéquie', region: 'Europe', continent: 'Europe', capital: 'Prague', languages: ['Czech'], flag: '🇨🇿', lat: 49.8175, lng: 15.473 },
  { code: 'RO', code3: 'ROU', nameEn: 'Romania', nameFr: 'Roumanie', region: 'Europe', continent: 'Europe', capital: 'Bucharest', languages: ['Romanian'], flag: '🇷🇴', lat: 45.9432, lng: 24.9668 },
  { code: 'HU', code3: 'HUN', nameEn: 'Hungary', nameFr: 'Hongrie', region: 'Europe', continent: 'Europe', capital: 'Budapest', languages: ['Hungarian'], flag: '🇭🇺', lat: 47.1625, lng: 19.5033 },
  { code: 'VA', code3: 'VAT', nameEn: 'Vatican City', nameFr: 'Vatican', region: 'Europe', continent: 'Europe', capital: 'Vatican City', languages: ['Italian', 'Latin'], flag: '🇻🇦', lat: 41.9029, lng: 12.4534 },

  // ASIA
  { code: 'KR', code3: 'KOR', nameEn: 'South Korea', nameFr: 'Corée du Sud', region: 'Asia', continent: 'Asia', capital: 'Seoul', languages: ['Korean'], flag: '🇰🇷', lat: 35.9078, lng: 127.7669 },
  { code: 'KP', code3: 'PRK', nameEn: 'North Korea', nameFr: 'Corée du Nord', region: 'Asia', continent: 'Asia', capital: 'Pyongyang', languages: ['Korean'], flag: '🇰🇵', lat: 40.3399, lng: 127.5101 },
  { code: 'JP', code3: 'JPN', nameEn: 'Japan', nameFr: 'Japon', region: 'Asia', continent: 'Asia', capital: 'Tokyo', languages: ['Japanese'], flag: '🇯🇵', lat: 36.2048, lng: 138.2529 },
  { code: 'CN', code3: 'CHN', nameEn: 'China', nameFr: 'Chine', region: 'Asia', continent: 'Asia', capital: 'Beijing', languages: ['Chinese'], flag: '🇨🇳', lat: 35.8617, lng: 104.1954 },
  { code: 'IN', code3: 'IND', nameEn: 'India', nameFr: 'Inde', region: 'Asia', continent: 'Asia', capital: 'New Delhi', languages: ['Hindi', 'English'], flag: '🇮🇳', lat: 20.5937, lng: 78.9629 },
  { code: 'PK', code3: 'PAK', nameEn: 'Pakistan', nameFr: 'Pakistan', region: 'Asia', continent: 'Asia', capital: 'Islamabad', languages: ['Urdu', 'English'], flag: '🇵🇰', lat: 30.3753, lng: 69.3451 },
  { code: 'ID', code3: 'IDN', nameEn: 'Indonesia', nameFr: 'Indonésie', region: 'Asia', continent: 'Asia', capital: 'Jakarta', languages: ['Indonesian'], flag: '🇮🇩', lat: -0.7893, lng: 113.9213 },
  { code: 'SG', code3: 'SGP', nameEn: 'Singapore', nameFr: 'Singapour', region: 'Asia', continent: 'Asia', capital: 'Singapore', languages: ['English', 'Malay', 'Mandarin'], flag: '🇸🇬', lat: 1.3521, lng: 103.8198 },
  { code: 'VN', code3: 'VNM', nameEn: 'Vietnam', nameFr: 'Vietnam', region: 'Asia', continent: 'Asia', capital: 'Hanoi', languages: ['Vietnamese'], flag: '🇻🇳', lat: 14.0583, lng: 108.2772 },
  { code: 'TH', code3: 'THA', nameEn: 'Thailand', nameFr: 'Thaïlande', region: 'Asia', continent: 'Asia', capital: 'Bangkok', languages: ['Thai'], flag: '🇹🇭', lat: 15.87, lng: 100.9925 },
  { code: 'MY', code3: 'MYS', nameEn: 'Malaysia', nameFr: 'Malaisie', region: 'Asia', continent: 'Asia', capital: 'Kuala Lumpur', languages: ['Malay'], flag: '🇲🇾', lat: 4.2105, lng: 101.9758 },
  { code: 'PH', code3: 'PHL', nameEn: 'Philippines', nameFr: 'Philippines', region: 'Asia', continent: 'Asia', capital: 'Manila', languages: ['Filipino', 'English'], flag: '🇵🇭', lat: 12.8797, lng: 121.774 },
  { code: 'BD', code3: 'BGD', nameEn: 'Bangladesh', nameFr: 'Bangladesh', region: 'Asia', continent: 'Asia', capital: 'Dhaka', languages: ['Bengali'], flag: '🇧🇩', lat: 23.685, lng: 90.3563 },
  { code: 'TW', code3: 'TWN', nameEn: 'Taiwan', nameFr: 'Taïwan', region: 'Asia', continent: 'Asia', capital: 'Taipei', languages: ['Mandarin'], flag: '🇹🇼', lat: 23.6978, lng: 120.9605 },
  { code: 'KZ', code3: 'KAZ', nameEn: 'Kazakhstan', nameFr: 'Kazakhstan', region: 'Asia', continent: 'Asia', capital: 'Astana', languages: ['Kazakh', 'Russian'], flag: '🇰🇿', lat: 48.0196, lng: 66.9237 },

  // MIDDLE EAST
  { code: 'TR', code3: 'TUR', nameEn: 'Türkiye', nameFr: 'Turquie', region: 'Middle East', continent: 'Asia', capital: 'Ankara', languages: ['Turkish'], flag: '🇹🇷', lat: 38.9637, lng: 35.2433 },
  { code: 'SA', code3: 'SAU', nameEn: 'Saudi Arabia', nameFr: 'Arabie saoudite', region: 'Middle East', continent: 'Asia', capital: 'Riyadh', languages: ['Arabic'], flag: '🇸🇦', lat: 23.8859, lng: 45.0792 },
  { code: 'AE', code3: 'ARE', nameEn: 'United Arab Emirates', nameFr: 'Émirats arabes unis', region: 'Middle East', continent: 'Asia', capital: 'Abu Dhabi', languages: ['Arabic'], flag: '🇦🇪', lat: 23.4241, lng: 53.8478 },
  { code: 'IL', code3: 'ISR', nameEn: 'Israel', nameFr: 'Israël', region: 'Middle East', continent: 'Asia', capital: 'Jerusalem', languages: ['Hebrew', 'Arabic'], flag: '🇮🇱', lat: 31.0461, lng: 34.8516 },
  { code: 'PS', code3: 'PSE', nameEn: 'Palestine', nameFr: 'Palestine', region: 'Middle East', continent: 'Asia', capital: 'Ramallah', languages: ['Arabic'], flag: '🇵🇸', lat: 31.9522, lng: 35.2332 },
  { code: 'QA', code3: 'QAT', nameEn: 'Qatar', nameFr: 'Qatar', region: 'Middle East', continent: 'Asia', capital: 'Doha', languages: ['Arabic'], flag: '🇶🇦', lat: 25.3548, lng: 51.1839 },
  { code: 'IR', code3: 'IRN', nameEn: 'Iran', nameFr: 'Iran', region: 'Middle East', continent: 'Asia', capital: 'Tehran', languages: ['Persian'], flag: '🇮🇷', lat: 32.4279, lng: 53.688 },
  { code: 'IQ', code3: 'IRQ', nameEn: 'Iraq', nameFr: 'Irak', region: 'Middle East', continent: 'Asia', capital: 'Baghdad', languages: ['Arabic', 'Kurdish'], flag: '🇮🇶', lat: 33.2232, lng: 43.6793 },
  { code: 'LB', code3: 'LBN', nameEn: 'Lebanon', nameFr: 'Liban', region: 'Middle East', continent: 'Asia', capital: 'Beirut', languages: ['Arabic', 'French'], flag: '🇱🇧', lat: 33.8547, lng: 35.8623 },
  { code: 'JO', code3: 'JOR', nameEn: 'Jordan', nameFr: 'Jordanie', region: 'Middle East', continent: 'Asia', capital: 'Amman', languages: ['Arabic'], flag: '🇯🇴', lat: 30.5852, lng: 36.2384 },
  { code: 'KW', code3: 'KWT', nameEn: 'Kuwait', nameFr: 'Koweït', region: 'Middle East', continent: 'Asia', capital: 'Kuwait City', languages: ['Arabic'], flag: '🇰🇼', lat: 29.3117, lng: 47.4818 },
  { code: 'OM', code3: 'OMN', nameEn: 'Oman', nameFr: 'Oman', region: 'Middle East', continent: 'Asia', capital: 'Muscat', languages: ['Arabic'], flag: '🇴🇲', lat: 21.4735, lng: 55.9754 },

  // NORTH AMERICA
  { code: 'US', code3: 'USA', nameEn: 'United States', nameFr: 'États-Unis', region: 'North America', continent: 'North America', capital: 'Washington, D.C.', languages: ['English'], flag: '🇺🇸', lat: 37.0902, lng: -95.7129 },
  { code: 'CA', code3: 'CAN', nameEn: 'Canada', nameFr: 'Canada', region: 'North America', continent: 'North America', capital: 'Ottawa', languages: ['English', 'French'], flag: '🇨🇦', lat: 56.1304, lng: -106.3468 },
  { code: 'MX', code3: 'MEX', nameEn: 'Mexico', nameFr: 'Mexique', region: 'Latin America and the Caribbean', continent: 'North America', capital: 'Mexico City', languages: ['Spanish'], flag: '🇲🇽', lat: 23.6345, lng: -102.5528 },

  // LATIN AMERICA AND THE CARIBBEAN
  { code: 'BR', code3: 'BRA', nameEn: 'Brazil', nameFr: 'Brésil', region: 'Latin America and the Caribbean', continent: 'South America', capital: 'Brasília', languages: ['Portuguese'], flag: '🇧🇷', lat: -14.235, lng: -51.9253 },
  { code: 'AR', code3: 'ARG', nameEn: 'Argentina', nameFr: 'Argentine', region: 'Latin America and the Caribbean', continent: 'South America', capital: 'Buenos Aires', languages: ['Spanish'], flag: '🇦🇷', lat: -38.4161, lng: -63.6167 },
  { code: 'CO', code3: 'COL', nameEn: 'Colombia', nameFr: 'Colombie', region: 'Latin America and the Caribbean', continent: 'South America', capital: 'Bogotá', languages: ['Spanish'], flag: '🇨🇴', lat: 4.5709, lng: -74.2973 },
  { code: 'CL', code3: 'CHL', nameEn: 'Chile', nameFr: 'Chili', region: 'Latin America and the Caribbean', continent: 'South America', capital: 'Santiago', languages: ['Spanish'], flag: '🇨🇱', lat: -35.6751, lng: -71.543 },
  { code: 'PE', code3: 'PER', nameEn: 'Peru', nameFr: 'Pérou', region: 'Latin America and the Caribbean', continent: 'South America', capital: 'Lima', languages: ['Spanish'], flag: '🇵🇪', lat: -9.19, lng: -75.0152 },
  { code: 'VE', code3: 'VEN', nameEn: 'Venezuela', nameFr: 'Venezuela', region: 'Latin America and the Caribbean', continent: 'South America', capital: 'Caracas', languages: ['Spanish'], flag: '🇻🇪', lat: 6.4238, lng: -66.5897 },
  { code: 'CU', code3: 'CUB', nameEn: 'Cuba', nameFr: 'Cuba', region: 'Latin America and the Caribbean', continent: 'North America', capital: 'Havana', languages: ['Spanish'], flag: '🇨🇺', lat: 21.5218, lng: -77.7812 },
  { code: 'HT', code3: 'HTI', nameEn: 'Haiti', nameFr: 'Haïti', region: 'Latin America and the Caribbean', continent: 'North America', capital: 'Port-au-Prince', languages: ['French', 'Creole'], flag: '🇭🇹', lat: 18.9712, lng: -72.2852 },
  { code: 'DO', code3: 'DOM', nameEn: 'Dominican Republic', nameFr: 'République dominicaine', region: 'Latin America and the Caribbean', continent: 'North America', capital: 'Santo Domingo', languages: ['Spanish'], flag: '🇩🇴', lat: 18.7357, lng: -70.1627 },
  { code: 'JM', code3: 'JAM', nameEn: 'Jamaica', nameFr: 'Jamaïque', region: 'Latin America and the Caribbean', continent: 'North America', capital: 'Kingston', languages: ['English'], flag: '🇯🇲', lat: 18.1096, lng: -77.2975 },
  { code: 'EC', code3: 'ECU', nameEn: 'Ecuador', nameFr: 'Équateur', region: 'Latin America and the Caribbean', continent: 'South America', capital: 'Quito', languages: ['Spanish'], flag: '🇪🇨', lat: -1.8312, lng: -78.1834 },
  { code: 'PA', code3: 'PAN', nameEn: 'Panama', nameFr: 'Panama', region: 'Latin America and the Caribbean', continent: 'North America', capital: 'Panama City', languages: ['Spanish'], flag: '🇵🇦', lat: 8.5379, lng: -80.7821 },

  // OCEANIA
  { code: 'AU', code3: 'AUS', nameEn: 'Australia', nameFr: 'Australie', region: 'Oceania', continent: 'Oceania', capital: 'Canberra', languages: ['English'], flag: '🇦🇺', lat: -25.2744, lng: 133.7751 },
  { code: 'NZ', code3: 'NZL', nameEn: 'New Zealand', nameFr: 'Nouvelle-Zélande', region: 'Oceania', continent: 'Oceania', capital: 'Wellington', languages: ['English', 'Māori'], flag: '🇳🇿', lat: -40.9006, lng: 174.886 },
  { code: 'FJ', code3: 'FJI', nameEn: 'Fiji', nameFr: 'Fidji', region: 'Oceania', continent: 'Oceania', capital: 'Suva', languages: ['English', 'Fijian'], flag: '🇫🇯', lat: -17.7134, lng: 178.065 },
  { code: 'PG', code3: 'PNG', nameEn: 'Papua New Guinea', nameFr: 'Papouasie-Nouvelle-Guinée', region: 'Oceania', continent: 'Oceania', capital: 'Port Moresby', languages: ['English', 'Tok Pisin'], flag: '🇵🇬', lat: -6.315, lng: 143.9555 },
];

export const REGIONS_LIST: Region[] = [
  'Africa',
  'Europe',
  'Asia',
  'Middle East',
  'North America',
  'Latin America and the Caribbean',
  'Oceania',
];

export function getCountryByCode(code: string): CountryInfo | undefined {
  return COUNTRIES.find((c) => c.code.toUpperCase() === code.toUpperCase() || c.code3.toUpperCase() === code.toUpperCase());
}

export function searchCountries(query: string, lang: 'en' | 'fr' = 'en'): CountryInfo[] {
  const q = query.toLowerCase().trim();
  if (!q) return COUNTRIES;
  return COUNTRIES.filter((c) => {
    return (
      c.nameEn.toLowerCase().includes(q) ||
      c.nameFr.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.capital.toLowerCase().includes(q) ||
      c.region.toLowerCase().includes(q)
    );
  });
}
