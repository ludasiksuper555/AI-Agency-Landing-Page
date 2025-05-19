// Файл з даними про команду
// Цей файл можна легко оновлювати, додаючи, видаляючи або змінюючи інформацію про співробітників

type TeamMember = {
  id: string;
  name: string;
  position: string;
  bio: string;
  imageUrl: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    email?: string;
  };
};

// Приклади зображень використовують placeholder сервіс, в реальному проекті замініть на реальні фото
const teamData: TeamMember[] = [
  {
    id: 'tm-001',
    name: 'Олександр Петренко',
    position: 'Головний AI розробник',
    bio: 'Експерт з машинного навчання та нейронних мереж з 8-річним досвідом. Спеціалізується на розробці алгоритмів для обробки природної мови.',
    imageUrl: 'https://via.placeholder.com/400x500?text=Олександр+П.',
    socialLinks: {
      linkedin: 'https://linkedin.com/in/oleksandr-petrenko',
      twitter: 'https://twitter.com/oleksandr_ai',
      email: 'oleksandr@aiagency.ua'
    }
  },
  {
    id: 'tm-002',
    name: 'Марія Коваленко',
    position: 'AI дизайнер інтерфейсів',
    bio: 'Поєднує принципи UX/UI дизайну з можливостями штучного інтелекту для створення інтуїтивних та персоналізованих інтерфейсів.',
    imageUrl: 'https://via.placeholder.com/400x500?text=Марія+К.',
    socialLinks: {
      linkedin: 'https://linkedin.com/in/maria-kovalenko',
      email: 'maria@aiagency.ua'
    }
  },
  {
    id: 'tm-003',
    name: 'Іван Мельник',
    position: 'Менеджер проектів',
    bio: 'Відповідає за успішну реалізацію AI-проектів від концепції до впровадження. Має сертифікацію PMP та досвід управління технологічними проектами.',
    imageUrl: 'https://via.placeholder.com/400x500?text=Іван+М.',
    socialLinks: {
      linkedin: 'https://linkedin.com/in/ivan-melnyk',
      email: 'ivan@aiagency.ua'
    }
  },
  {
    id: 'tm-004',
    name: 'Наталія Шевченко',
    position: 'Аналітик даних',
    bio: 'Спеціалізується на аналізі великих обсягів даних та створенні моделей для прогнозування бізнес-показників. Експерт з Python та R.',
    imageUrl: 'https://via.placeholder.com/400x500?text=Наталія+Ш.',
    socialLinks: {
      linkedin: 'https://linkedin.com/in/natalia-shevchenko',
      twitter: 'https://twitter.com/natalia_data',
      email: 'natalia@aiagency.ua'
    }
  },
  {
    id: 'tm-005',
    name: 'Сергій Ковальчук',
    position: 'Розробник AI-інтеграцій',
    bio: 'Відповідає за інтеграцію AI-рішень з існуючими бізнес-системами. Має глибокі знання API та мікросервісної архітектури.',
    imageUrl: 'https://via.placeholder.com/400x500?text=Сергій+К.',
    socialLinks: {
      linkedin: 'https://linkedin.com/in/serhii-kovalchuk',
      email: 'serhii@aiagency.ua'
    }
  },
  {
    id: 'tm-006',
    name: 'Юлія Бондаренко',
    position: 'Менеджер з розвитку бізнесу',
    bio: 'Відповідає за пошук нових клієнтів та розвиток партнерських відносин. Має досвід роботи в IT-консалтингу та продажах B2B рішень.',
    imageUrl: 'https://via.placeholder.com/400x500?text=Юлія+Б.',
    socialLinks: {
      linkedin: 'https://linkedin.com/in/yulia-bondarenko',
      email: 'yulia@aiagency.ua'
    }
  }
];

export default teamData;