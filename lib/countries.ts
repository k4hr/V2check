// lib/countries.ts
export type Country = { code: string; name: string; flag: string };

export const COUNTRIES: Country[] = [
  // СНГ и рядом
  { code: 'RU', name: 'Россия', flag: '🇷🇺' },
  { code: 'BY', name: 'Беларусь', flag: '🇧🇾' },
  { code: 'UA', name: 'Украина', flag: '🇺🇦' },
  { code: 'KZ', name: 'Казахстан', flag: '🇰🇿' },
  { code: 'UZ', name: 'Узбекистан', flag: '🇺🇿' },
  { code: 'KG', name: 'Киргизия', flag: '🇰🇬' },
  { code: 'AM', name: 'Армения', flag: '🇦🇲' },
  { code: 'AZ', name: 'Азербайджан', flag: '🇦🇿' },
  { code: 'GE', name: 'Грузия', flag: '🇬🇪' },
  { code: 'MD', name: 'Молдова', flag: '🇲🇩' },
  { code: 'TR', name: 'Турция', flag: '🇹🇷' },

  // Ближний Восток и Северная Африка
  { code: 'AE', name: 'ОАЭ', flag: '🇦🇪' },
  { code: 'SA', name: 'Саудовская Аравия', flag: '🇸🇦' },
  { code: 'QA', name: 'Катар', flag: '🇶🇦' },
  { code: 'KW', name: 'Кувейт', flag: '🇰🇼' },
  { code: 'BH', name: 'Бахрейн', flag: '🇧🇭' },
  { code: 'OM', name: 'Оман', flag: '🇴🇲' },
  { code: 'JO', name: 'Иордания', flag: '🇯🇴' },
  { code: 'IL', name: 'Израиль', flag: '🇮🇱' },
  { code: 'EG', name: 'Египет', flag: '🇪🇬' },

  // Южная и Юго-Восточная Азия
  { code: 'IN', name: 'Индия', flag: '🇮🇳' },
  { code: 'ID', name: 'Индонезия', flag: '🇮🇩' },
  { code: 'MY', name: 'Малайзия', flag: '🇲🇾' },
  { code: 'PH', name: 'Филиппины', flag: '🇵🇭' },
  { code: 'VN', name: 'Вьетнам', flag: '🇻🇳' },
  { code: 'TH', name: 'Таиланд', flag: '🇹🇭' },
  { code: 'SG', name: 'Сингапур', flag: '🇸🇬' },

  // Центральная и Восточная Европа
  { code: 'PL', name: 'Польша', flag: '🇵🇱' },
  { code: 'CZ', name: 'Чехия', flag: '🇨🇿' },
  { code: 'SK', name: 'Словакия', flag: '🇸🇰' },
  { code: 'HU', name: 'Венгрия', flag: '🇭🇺' },
  { code: 'RO', name: 'Румыния', flag: '🇷🇴' },
  { code: 'BG', name: 'Болгария', flag: '🇧🇬' },
  { code: 'RS', name: 'Сербия', flag: '🇷🇸' },

  // Северная Америка
  { code: 'US', name: 'США', flag: '🇺🇸' },
];
