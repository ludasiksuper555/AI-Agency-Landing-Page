import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';

interface ExportMarket {
  countryCode: string;
  countryName: string;
  marketSize: number; // в мільйонах доларів
  growthRate: number; // річний відсоток зростання
  entryBarriers: 'low' | 'medium' | 'high';
  certificationRequired: string[];
  potentialProducts: string[];
  tradeAgreements: boolean;
  competitionLevel: 'low' | 'medium' | 'high';
  averageTariff: number; // відсоток
  localPartners: string[];
  coordinates: [number, number]; // [latitude, longitude]
}

interface ExportOpportunitiesMapProps {
  initialCountry?: string;
  showFilters?: boolean;
  height?: string;
  width?: string;
}

// Імітація API-запиту для отримання даних про експортні можливості
const fetchExportMarkets = async (): Promise<ExportMarket[]> => {
  // В реальному додатку тут буде запит до API
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Тестові дані
  return [
    {
      countryCode: 'PL',
      countryName: 'Польща',
      marketSize: 450,
      growthRate: 3.2,
      entryBarriers: 'low',
      certificationRequired: ['EU Organic', 'HACCP', 'ISO 22000'],
      potentialProducts: ['Ковбасні вироби', "Свіже м'ясо", 'Напівфабрикати'],
      tradeAgreements: true,
      competitionLevel: 'medium',
      averageTariff: 0,
      localPartners: ['Biedronka', 'Zabka', 'Carrefour Poland'],
      coordinates: [52.1276, 19.4292],
    },
    {
      countryCode: 'DE',
      countryName: 'Німеччина',
      marketSize: 820,
      growthRate: 2.1,
      entryBarriers: 'medium',
      certificationRequired: ['EU Organic', 'HACCP', 'ISO 22000', 'QS'],
      potentialProducts: ["Органічне м'ясо", 'Делікатеси', 'Традиційні ковбаси'],
      tradeAgreements: true,
      competitionLevel: 'high',
      averageTariff: 0,
      localPartners: ['EDEKA', 'REWE', 'Aldi'],
      coordinates: [51.1657, 10.4515],
    },
    {
      countryCode: 'UAE',
      countryName: 'ОАЕ',
      marketSize: 280,
      growthRate: 5.7,
      entryBarriers: 'medium',
      certificationRequired: ['Halal', 'HACCP', 'ISO 22000'],
      potentialProducts: ["Халяльне м'ясо", 'Преміум-продукти'],
      tradeAgreements: false,
      competitionLevel: 'low',
      averageTariff: 5,
      localPartners: ['Lulu Hypermarket', 'Carrefour UAE', 'Spinneys'],
      coordinates: [23.4241, 53.8478],
    },
    {
      countryCode: 'CN',
      countryName: 'Китай',
      marketSize: 1200,
      growthRate: 7.8,
      entryBarriers: 'high',
      certificationRequired: ['CCC', 'HACCP', 'ISO 22000', 'AQSIQ'],
      potentialProducts: ['Свинина', 'Яловичина', 'Субпродукти'],
      tradeAgreements: false,
      competitionLevel: 'medium',
      averageTariff: 12,
      localPartners: ['JD.com', 'Alibaba', 'COFCO'],
      coordinates: [35.8617, 104.1954],
    },
    {
      countryCode: 'US',
      countryName: 'США',
      marketSize: 950,
      growthRate: 1.9,
      entryBarriers: 'high',
      certificationRequired: ['USDA', 'FDA', 'HACCP', 'ISO 22000'],
      potentialProducts: ["Органічне м'ясо", 'Преміум-продукти', 'Етнічні ковбаси'],
      tradeAgreements: false,
      competitionLevel: 'high',
      averageTariff: 6.5,
      localPartners: ['Walmart', 'Kroger', 'Costco'],
      coordinates: [37.0902, -95.7129],
    },
  ];
};
const ExportOpportunitiesMap: React.FC<ExportOpportunitiesMapProps> = ({
  initialCountry,
  showFilters = true,
  height = '600px',
  width = '100%',
}) => {
  const [markets, setMarkets] = useState<ExportMarket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(initialCountry || null);
  const [filterBarrier, setFilterBarrier] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [filterGrowth, setFilterGrowth] = useState<'all' | 'high'>('all');

  // Завантаження даних про експортні ринки
  useEffect(() => {
    const loadMarkets = async () => {
      try {
        setLoading(true);
        const data = await fetchExportMarkets();
        setMarkets(data);
        setError(null);
      } catch (err) {
        setError('Помилка завантаження даних про експортні ринки');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadMarkets();
  }, []);

  // Фільтрація ринків за обраними критеріями
  const filteredMarkets = markets.filter(market => {
    if (filterBarrier !== 'all' && market.entryBarriers !== filterBarrier) return false;
    if (filterGrowth === 'high' && market.growthRate < 5) return false;
    return true;
  });

  // Отримання деталей про обраний ринок
  const selectedMarketDetails = selectedCountry
    ? markets.find(market => market.countryCode === selectedCountry)
    : null;

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md" style={{ height, width }}>
        <div className="animate-pulse flex flex-col space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-64 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="p-6 bg-red-50 rounded-lg shadow-md border border-red-200"
        style={{ height: 'auto', width }}
      >
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ width }}>
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Карта експортних можливостей</h2>
        <p className="text-gray-600 mb-6">
          Інтерактивна карта потенційних ринків збуту для української м'ясної продукції
        </p>

        {/* Фільтри */}
        {showFilters && (
          <div className="mb-6 flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Бар'єри входу</label>
              <select
                value={filterBarrier}
                onChange={e => setFilterBarrier(e.target.value as any)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
              >
                <option value="all">Всі рівні</option>
                <option value="low">Низькі</option>
                <option value="medium">Середні</option>
                <option value="high">Високі</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Темп зростання ринку
              </label>
              <select
                value={filterGrowth}
                onChange={e => setFilterGrowth(e.target.value as any)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
              >
                <option value="all">Всі ринки</option>
                <option value="high">Високий ріст (&gt;5%)</option>
              </select>
            </div>
          </div>
        )}

        {/* Карта (в реальному додатку тут буде інтеграція з картою, наприклад, Google Maps або Leaflet) */}
        <div
          className="relative bg-gray-100 rounded-lg overflow-hidden mb-6"
          style={{ height: '400px' }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gray-500">
              Тут буде інтерактивна карта з маркерами експортних ринків
            </p>
          </div>

          {/* Маркери країн (імітація) */}
          {filteredMarkets.map(market => (
            <motion.div
              key={market.countryCode}
              className="absolute cursor-pointer"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.2 }}
              style={{
                // Імітація позиціонування на карті
                left: `${((market.coordinates[1] + 180) * 100) / 360}%`,
                top: `${((90 - market.coordinates[0]) * 100) / 180}%`,
                transform: 'translate(-50%, -50%)',
              }}
              onClick={() => setSelectedCountry(market.countryCode)}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${selectedCountry === market.countryCode ? 'bg-red-600' : 'bg-red-500'}`}
                title={market.countryName}
              >
                <span>{market.countryCode}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-between items-start"></div>

        {/* Деталі обраного ринку */}
        {selectedMarketDetails && (
          <motion.div
            className="mt-8 bg-white rounded-lg shadow-lg p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  {selectedMarketDetails.countryName}
                </h3>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${selectedMarketDetails.entryBarriers === 'low' ? 'bg-green-100 text-green-800' : selectedMarketDetails.entryBarriers === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}
                >
                  {selectedMarketDetails.entryBarriers === 'low'
                    ? "Низькі бар'єри"
                    : selectedMarketDetails.entryBarriers === 'medium'
                      ? "Середні бар'єри"
                      : "Високі бар'єри"}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Розмір ринку</p>
                  <p className="text-lg font-medium">${selectedMarketDetails.marketSize} млн</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Річний ріст</p>
                  <p className="text-lg font-medium">{selectedMarketDetails.growthRate}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Середній тариф</p>
                  <p className="text-lg font-medium">{selectedMarketDetails.averageTariff}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Рівень конкуренції</p>
                  <p className="text-lg font-medium capitalize">
                    {selectedMarketDetails.competitionLevel}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm text-gray-500">Необхідні сертифікати</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedMarketDetails.certificationRequired.map(cert => (
                    <span
                      key={cert}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {cert}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm text-gray-500">Потенційні продукти</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedMarketDetails.potentialProducts.map(product => (
                    <span
                      key={product}
                      className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                    >
                      {product}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm text-gray-500">Потенційні партнери</p>
                <ul className="list-disc list-inside mt-1 text-sm">
                  {selectedMarketDetails.localPartners.map(partner => (
                    <li key={partner}>{partner}</li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 flex justify-end">
                <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
                  Отримати детальний звіт
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
export default ExportOpportunitiesMap;
