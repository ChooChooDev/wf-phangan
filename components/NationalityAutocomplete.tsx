'use client';

import { useState, useRef, useEffect } from 'react';
import { COUNTRIES } from '@/lib/constants';

interface NationalityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  locale: string;
}

const COUNTRIES_TH: { [key: string]: string } = {
  'Afghanistan': 'อัฟกานิสถาน',
  'Albania': 'แอลเบเนีย',
  'Algeria': 'แอลจีเรีย',
  'Andorra': 'อันดอร์รา',
  'Angola': 'แองโกลา',
  'Argentina': 'อาร์เจนตินา',
  'Armenia': 'อาร์มีเนีย',
  'Australia': 'ออสเตรเลีย',
  'Austria': 'ออสเตรีย',
  'Azerbaijan': 'อาเซอร์ไบจาน',
  'Bahamas': 'บาฮามาส',
  'Bahrain': 'บาห์เรน',
  'Bangladesh': 'บังกลาเทศ',
  'Belarus': 'เบลารุส',
  'Belgium': 'เบลเยียม',
  'Bolivia': 'โบลิเวีย',
  'Bosnia and Herzegovina': 'บอสเนียและเฮอร์เซโกวีนา',
  'Brazil': 'บราซิล',
  'Brunei': 'บรูไน',
  'Bulgaria': 'บัลแกเรีย',
  'Cambodia': 'กัมพูชา',
  'Cameroon': 'แคเมอรูน',
  'Canada': 'แคนาดา',
  'Chile': 'ชิลี',
  'China': 'จีน',
  'Colombia': 'โคลอมเบีย',
  'Costa Rica': 'คอสตาริกา',
  'Croatia': 'โครเอเชีย',
  'Cuba': 'คิวบา',
  'Cyprus': 'ไซปรัส',
  'Czech Republic': 'สาธารณรัฐเช็ก',
  'Denmark': 'เดนมาร์ก',
  'Ecuador': 'เอกวาดอร์',
  'Egypt': 'อียิปต์',
  'Estonia': 'เอสโตเนีย',
  'Ethiopia': 'เอธิโอเปีย',
  'Finland': 'ฟินแลนด์',
  'France': 'ฝรั่งเศส',
  'Georgia': 'จอร์เจีย',
  'Germany': 'เยอรมนี',
  'Ghana': 'กานา',
  'Greece': 'กรีซ',
  'Hungary': 'ฮังการี',
  'Iceland': 'ไอซ์แลนด์',
  'India': 'อินเดีย',
  'Indonesia': 'อินโดนีเซีย',
  'Iran': 'อิหร่าน',
  'Iraq': 'อิรัก',
  'Ireland': 'ไอร์แลนด์',
  'Israel': 'อิสราเอล',
  'Italy': 'อิตาลี',
  'Jamaica': 'จาเมกา',
  'Japan': 'ญี่ปุ่น',
  'Jordan': 'จอร์แดน',
  'Kazakhstan': 'คาซัคสถาน',
  'Kenya': 'เคนยา',
  'Kuwait': 'คูเวต',
  'Kyrgyzstan': 'คีร์กีซสถาน',
  'Laos': 'ลาว',
  'Latvia': 'ลัตเวีย',
  'Lebanon': 'เลบานอน',
  'Libya': 'ลิเบีย',
  'Lithuania': 'ลิทัวเนีย',
  'Luxembourg': 'ลักเซมเบิร์ก',
  'Malaysia': 'มาเลเซีย',
  'Maldives': 'มัลดีฟส์',
  'Mexico': 'เม็กซิโก',
  'Moldova': 'มอลโดวา',
  'Monaco': 'โมนาโก',
  'Mongolia': 'มองโกเลีย',
  'Morocco': 'โมร็อกโก',
  'Myanmar': 'พม่า',
  'Nepal': 'เนปาล',
  'Netherlands': 'เนเธอร์แลนด์',
  'New Zealand': 'นิวซีแลนด์',
  'Nigeria': 'ไนจีเรีย',
  'North Korea': 'เกาหลีเหนือ',
  'Norway': 'นอร์เวย์',
  'Oman': 'โอมาน',
  'Pakistan': 'ปากีสถาน',
  'Palestine': 'ปาเลสไตน์',
  'Panama': 'ปานามา',
  'Peru': 'เปรู',
  'Philippines': 'ฟิลิปปินส์',
  'Poland': 'โปแลนด์',
  'Portugal': 'โปรตุเกส',
  'Qatar': 'กาตาร์',
  'Romania': 'โรมาเนีย',
  'Russia': 'รัสเซีย',
  'Saudi Arabia': 'ซาอุดีอาระเบีย',
  'Serbia': 'เซอร์เบีย',
  'Singapore': 'สิงคโปร์',
  'Slovakia': 'สโลวาเกีย',
  'Slovenia': 'สโลวีเนีย',
  'South Africa': 'แอฟริกาใต้',
  'South Korea': 'เกาหลีใต้',
  'Spain': 'สเปน',
  'Sri Lanka': 'ศรีลังกา',
  'Sudan': 'ซูดาน',
  'Sweden': 'สวีเดน',
  'Switzerland': 'สวิตเซอร์แลนด์',
  'Syria': 'ซีเรีย',
  'Taiwan': 'ไต้หวัน',
  'Tajikistan': 'ทาจิกิสถาน',
  'Tanzania': 'แทนซาเนีย',
  'Thailand': 'ไทย',
  'Turkey': 'ตุรกี',
  'Turkmenistan': 'เติร์กเมนิสถาน',
  'Uganda': 'ยูกันดา',
  'Ukraine': 'ยูเครน',
  'United Arab Emirates': 'สหรัฐอาหรับเอมิเรตส์',
  'United Kingdom': 'สหราชอาณาจักร',
  'United States': 'สหรัฐอเมริกา',
  'Uruguay': 'อุรุกวัย',
  'Uzbekistan': 'อุซเบกิสถาน',
  'Venezuela': 'เวเนซุเอลา',
  'Vietnam': 'เวียดนาม',
  'Yemen': 'เยเมน',
};

export default function NationalityAutocomplete({
  value,
  onChange,
  placeholder,
  error,
  locale,
}: NationalityAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredCountries, setFilteredCountries] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (val: string) => {
    setInputValue(val);
    onChange(val);

    if (val.trim()) {
      const filtered = COUNTRIES.filter((country) =>
        country.toLowerCase().includes(val.toLowerCase())
      );
      setFilteredCountries(filtered);
      setShowDropdown(true);
    } else {
      setFilteredCountries([]);
      setShowDropdown(false);
    }
  };

  const handleSelect = (country: string) => {
    setInputValue(country);
    onChange(country);
    setShowDropdown(false);
  };

  const handleFocus = () => {
    setFilteredCountries(COUNTRIES);
    setShowDropdown(true);
  };

  const getDisplayName = (country: string) => {
    if (locale === 'th' && COUNTRIES_TH[country]) {
      return COUNTRIES_TH[country];
    }
    return country;
  };

  return (
    <div ref={dropdownRef} className="relative">
      <input
        type="text"
        value={locale === 'th' && COUNTRIES_TH[inputValue] ? COUNTRIES_TH[inputValue] : inputValue}
        onChange={(e) => {
          const val = e.target.value;
          if (locale === 'th') {
            const englishCountry = Object.entries(COUNTRIES_TH).find(([_, thName]) => thName === val)?.[0];
            handleInputChange(englishCountry || val);
          } else {
            handleInputChange(val);
          }
        }}
        onFocus={handleFocus}
        placeholder={placeholder}
        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
      />

      {showDropdown && filteredCountries.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {filteredCountries.map((country) => (
            <div
              key={country}
              onClick={() => handleSelect(country)}
              className="px-4 py-2 hover:bg-blue-50 cursor-pointer transition"
            >
              {getDisplayName(country)}
            </div>
          ))}
        </div>
      )}

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
