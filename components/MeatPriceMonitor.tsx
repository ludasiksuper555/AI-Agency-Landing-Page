import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import React, { useState } from 'react';

interface PriceData {
  productId: string;
  productName: string;
  currentPrice: number;
  previousPrice: number;
  priceChange: number;
  priceChangePercent: number;
  lastUpdated: string;
  currency: string;
  category: string;
  trend: 'up' | 'down' | 'stable';
}

interface MeatPriceMonitorProps {
  userId?: string;
  initialCategory?: string;
  showNotifications?: boolean;
}

// Імітація API-запиту для отримання даних про ціни
const fetchPriceData = async (category: string): Promise<PriceData[]> => {
  // В реальному додатку тут буде запит до API
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Тестові дані
  return [
    {
      productId: 'p001',
      productName: 'Свинина охолоджена',
      currentPrice: 185.5,
      previousPrice: 180.0,
      priceChange: 5.5,
      priceChangePercent: 3.06,
      lastUpdated: new Date().toISOString(),
      currency: 'UAH',
      category: "Свіже м'ясо",
      trend: 'up' as const,
    },
    {
      productId: 'p002',
      productName: 'Яловичина вищого ґатунку',
      currentPrice: 240.0,
      previousPrice: 245.5,
      priceChange: -5.5,
      priceChangePercent: -2.24,
      lastUpdated: new Date().toISOString(),
      currency: 'UAH',
      category: "Свіже м'ясо",
      trend: 'down' as const,
    },
    {
      productId: 'p003',
      productName: 'Курятина філе',
      currentPrice: 120.0,
      previousPrice: 120.0,
      priceChange: 0,
      priceChangePercent: 0,
      lastUpdated: new Date().toISOString(),
      currency: 'UAH',
      category: "Свіже м'ясо",
      trend: 'stable' as const,
    },
    {
      productId: 'p004',
      productName: 'Ковбаса Салямі',
      currentPrice: 320.0,
      previousPrice: 310.0,
      priceChange: 10.0,
      priceChangePercent: 3.23,
      lastUpdated: new Date().toISOString(),
      currency: 'UAH',
      category: 'Ковбасні вироби',
      trend: 'up' as const,
    },
    {
      productId: 'p005',
      productName: 'Сосиски молочні',
      currentPrice: 160.0,
      previousPrice: 165.0,
      priceChange: -5.0,
      priceChangePercent: -3.03,
      lastUpdated: new Date().toISOString(),
      currency: 'UAH',
      category: 'Ковбасні вироби',
      trend: 'down' as const,
    },
  ].filter(item => category === 'Всі' || item.category === category);
};

// Компонент для відображення сповіщень про зміни цін
const PriceNotification: React.FC<{ data: PriceData }> = ({ data }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      className={`mb-2 p-3 rounded-lg shadow-md ${data.trend === 'up' ? 'bg-red-50 border-l-4 border-red-500' : data.trend === 'down' ? 'bg-green-50 border-l-4 border-green-500' : 'bg-gray-50 border-l-4 border-gray-500'}`}
    >
      <div className="flex justify-between items-center">
        <span className="font-medium">{data.productName}</span>
        <span
          className={`font-bold ${data.trend === 'up' ? 'text-red-600' : data.trend === 'down' ? 'text-green-600' : 'text-gray-600'}`}
        >
          {data.trend === 'up' ? '▲' : data.trend === 'down' ? '▼' : '■'}
          {data.priceChangePercent.toFixed(2)}%
        </span>
      </div>
      <div className="text-sm text-gray-600 mt-1">
        {data.currentPrice.toFixed(2)} {data.currency} ({data.trend === 'up' ? '+' : ''}
        {data.priceChange.toFixed(2)} {data.currency})
      </div>
      <div className="text-xs text-gray-500 mt-1">
        Оновлено: {new Date(data.lastUpdated).toLocaleDateString()}
      </div>
    </motion.div>
  );
};

// Головний компонент моніторингу цін
const MeatPriceMonitor: React.FC<MeatPriceMonitorProps> = ({
  userId,
  initialCategory = 'Всі',
  showNotifications = true,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [subscribedProducts, setSubscribedProducts] = useState<string[]>([]);

  // Отримання даних про ціни за допомогою React Query
  const {
    data: priceData,
    isLoading,
    error,
  } = useQuery<PriceData[]>({
    queryKey: ['meatPrices', selectedCategory],
    queryFn: () => fetchPriceData(selectedCategory),
    refetchInterval: 3600000, // Оновлення даних кожну годину
    staleTime: 1800000, // Дані вважаються актуальними протягом 30 хвилин
  });

  // Категорії м'ясних продуктів
  const categories = ['Всі', "Свіже м'ясо", 'Ковбасні вироби', 'Напівфабрикати', 'Делікатеси'];

  // Підписка/відписка на сповіщення про зміну цін
  const toggleSubscription = (productId: string) => {
    setSubscribedProducts(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  // Фільтрація продуктів зі значною зміною ціни для сповіщень
  const significantPriceChanges =
    priceData
      ?.filter(item => Math.abs(item.priceChangePercent) > 2)
      .sort((a, b) => Math.abs(b.priceChangePercent) - Math.abs(a.priceChangePercent))
      .slice(0, 3) || [];

  if (isLoading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <div className="animate-pulse flex flex-col space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-lg shadow-md border border-red-200">
        <p className="text-red-600">Помилка завантаження даних про ціни. Спробуйте пізніше.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white rounded-lg shadow-lg p-6"
    >
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Моніторинг цін на м'ясну продукцію</h2>

      {/* Фільтр за категоріями */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium ${selectedCategory === category ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Сповіщення про значні зміни цін */}
      {showNotifications && significantPriceChanges.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Важливі зміни цін</h3>
          <div className="space-y-2">
            {significantPriceChanges.map(item => (
              <PriceNotification key={item.productId} data={item} />
            ))}
          </div>
        </div>
      )}

      {/* Таблиця з цінами */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Продукт
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Поточна ціна
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Зміна
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Категорія
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Дії
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {priceData?.map(item => (
              <tr key={item.productId}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {item.currentPrice.toFixed(2)} {item.currency}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div
                    className={`text-sm font-medium ${item.trend === 'up' ? 'text-red-600' : item.trend === 'down' ? 'text-green-600' : 'text-gray-500'}`}
                  >
                    {item.trend === 'up' ? '▲' : item.trend === 'down' ? '▼' : '■'}
                    {item.priceChangePercent.toFixed(2)}%
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.category}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => toggleSubscription(item.productId)}
                    className={`px-3 py-1 rounded-md ${subscribedProducts.includes(item.productId) ? 'bg-red-100 text-red-800 hover:bg-red-200' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                  >
                    {subscribedProducts.includes(item.productId) ? 'Відписатися' : 'Підписатися'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Інформація про підписки */}
      {subscribedProducts.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            Ви підписані на сповіщення про зміну цін для {subscribedProducts.length} продуктів.
            Сповіщення надходитимуть на вашу електронну пошту та в особистий кабінет.
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default MeatPriceMonitor;
