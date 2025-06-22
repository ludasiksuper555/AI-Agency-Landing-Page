const fs = require('fs');
const path = require('path');

class BufferTimeCalculator {
  constructor() {
    this.bufferRules = {
      // Базовые множители по сложности
      complexity: {
        low: 1.2, // +20%
        medium: 1.5, // +50%
        high: 2.0, // +100%
        critical: 2.5, // +150%
      },

      // Множители по типу риска
      risk: {
        low: 1.1, // +10%
        medium: 1.3, // +30%
        high: 1.6, // +60%
        critical: 2.0, // +100%
      },

      // Множители по типу задачи
      taskType: {
        setup: 1.3, // Настройка и конфигурация
        development: 1.4, // Разработка
        testing: 1.6, // Тестирование
        debugging: 2.0, // Отладка
        integration: 1.8, // Интеграция
        deployment: 1.5, // Развертывание
        documentation: 1.2, // Документация
      },

      // Множители по опыту команды
      experience: {
        expert: 0.9, // -10%
        senior: 1.0, // без изменений
        middle: 1.2, // +20%
        junior: 1.5, // +50%
      },
    };

    this.maxBufferMultiplier = 3.0; // Максимальный множитель
    this.minBufferMultiplier = 1.1; // Минимальный множитель
  }

  calculateBuffer(task) {
    const {
      estimatedTime,
      complexity = 'medium',
      risk = 'medium',
      taskType = 'development',
      experience = 'senior',
      dependencies = [],
      isBlocking = false,
      hasExternalDeps = false,
    } = task;

    if (!estimatedTime || estimatedTime <= 0) {
      throw new Error('Время оценки должно быть положительным числом');
    }

    // Базовый множитель
    let multiplier = 1.0;

    // Применяем множители
    multiplier *= this.bufferRules.complexity[complexity] || 1.5;
    multiplier *= this.bufferRules.risk[risk] || 1.3;
    multiplier *= this.bufferRules.taskType[taskType] || 1.4;
    multiplier *= this.bufferRules.experience[experience] || 1.0;

    // Дополнительные факторы
    if (dependencies.length > 0) {
      multiplier *= 1 + dependencies.length * 0.1; // +10% за каждую зависимость
    }

    if (isBlocking) {
      multiplier *= 1.3; // +30% для блокирующих задач
    }

    if (hasExternalDeps) {
      multiplier *= 1.4; // +40% для задач с внешними зависимостями
    }

    // Ограничиваем множитель
    multiplier = Math.min(multiplier, this.maxBufferMultiplier);
    multiplier = Math.max(multiplier, this.minBufferMultiplier);

    const bufferTime = estimatedTime * (multiplier - 1);
    const totalTime = estimatedTime + bufferTime;

    return {
      originalEstimate: estimatedTime,
      bufferTime: Math.round(bufferTime),
      totalTime: Math.round(totalTime),
      multiplier: Math.round(multiplier * 100) / 100,
      factors: {
        complexity: this.bufferRules.complexity[complexity],
        risk: this.bufferRules.risk[risk],
        taskType: this.bufferRules.taskType[taskType],
        experience: this.bufferRules.experience[experience],
        dependencies: dependencies.length,
        isBlocking,
        hasExternalDeps,
      },
    };
  }

  calculateProjectBuffer(tasks) {
    console.log('📊 Расчет буферного времени для проекта...');

    if (!Array.isArray(tasks) || tasks.length === 0) {
      throw new Error('Список задач должен быть непустым массивом');
    }

    const results = tasks.map((task, index) => {
      try {
        const result = this.calculateBuffer(task);
        console.log(`   ✅ Задача ${index + 1}: ${task.name || 'Без названия'}`);
        console.log(
          `      Оценка: ${result.originalEstimate}ч → Итого: ${result.totalTime}ч (буфер: ${result.bufferTime}ч)`
        );

        return {
          ...task,
          ...result,
          index: index + 1,
        };
      } catch (error) {
        console.error(`   ❌ Ошибка в задаче ${index + 1}: ${error.message}`);
        return {
          ...task,
          index: index + 1,
          error: error.message,
        };
      }
    });

    const validResults = results.filter(r => !r.error);
    const totalOriginal = validResults.reduce((sum, r) => sum + r.originalEstimate, 0);
    const totalWithBuffer = validResults.reduce((sum, r) => sum + r.totalTime, 0);
    const totalBuffer = totalWithBuffer - totalOriginal;

    const summary = {
      totalTasks: tasks.length,
      validTasks: validResults.length,
      errorTasks: results.length - validResults.length,
      totalOriginalTime: totalOriginal,
      totalBufferTime: totalBuffer,
      totalTimeWithBuffer: totalWithBuffer,
      averageMultiplier:
        validResults.length > 0
          ? Math.round(
              (validResults.reduce((sum, r) => sum + r.multiplier, 0) / validResults.length) * 100
            ) / 100
          : 0,
      bufferPercentage: totalOriginal > 0 ? Math.round((totalBuffer / totalOriginal) * 100) : 0,
    };

    console.log('\n📈 Сводка по проекту:');
    console.log(`   Всего задач: ${summary.totalTasks}`);
    console.log(`   Валидных задач: ${summary.validTasks}`);
    console.log(`   Исходное время: ${summary.totalOriginalTime}ч`);
    console.log(`   Буферное время: ${summary.totalBufferTime}ч`);
    console.log(`   Итоговое время: ${summary.totalTimeWithBuffer}ч`);
    console.log(`   Средний множитель: ${summary.averageMultiplier}`);
    console.log(`   Буфер: ${summary.bufferPercentage}%`);

    return {
      tasks: results,
      summary,
      timestamp: new Date().toISOString(),
    };
  }

  generateRecommendations(projectResult) {
    const { summary, tasks } = projectResult;
    const recommendations = [];

    // Анализ общего буфера
    if (summary.bufferPercentage > 80) {
      recommendations.push({
        type: 'warning',
        message: `Очень высокий буфер (${summary.bufferPercentage}%). Возможно, оценки слишком пессимистичны.`,
        action: 'Пересмотрите сложность и риски задач',
      });
    } else if (summary.bufferPercentage < 20) {
      recommendations.push({
        type: 'warning',
        message: `Низкий буфер (${summary.bufferPercentage}%). Проект может не уложиться в сроки.`,
        action: 'Добавьте больше буферного времени или упростите задачи',
      });
    }

    // Анализ задач с высоким буфером
    const highBufferTasks = tasks.filter(t => !t.error && t.multiplier > 2.0);
    if (highBufferTasks.length > 0) {
      recommendations.push({
        type: 'info',
        message: `${highBufferTasks.length} задач с высоким буфером (>2x).`,
        action: 'Рассмотрите возможность разбиения на более мелкие задачи',
        tasks: highBufferTasks.map(t => t.name || `Задача ${t.index}`),
      });
    }

    // Анализ блокирующих задач
    const blockingTasks = tasks.filter(t => !t.error && t.isBlocking);
    if (blockingTasks.length > 0) {
      recommendations.push({
        type: 'critical',
        message: `${blockingTasks.length} блокирующих задач требуют особого внимания.`,
        action: 'Приоритизируйте эти задачи и добавьте дополнительные ресурсы',
        tasks: blockingTasks.map(t => t.name || `Задача ${t.index}`),
      });
    }

    // Анализ задач с внешними зависимостями
    const externalDepTasks = tasks.filter(t => !t.error && t.hasExternalDeps);
    if (externalDepTasks.length > 0) {
      recommendations.push({
        type: 'warning',
        message: `${externalDepTasks.length} задач зависят от внешних факторов.`,
        action: 'Подготовьте план B для этих задач',
        tasks: externalDepTasks.map(t => t.name || `Задача ${t.index}`),
      });
    }

    return recommendations;
  }

  saveReport(projectResult, outputPath = null) {
    const recommendations = this.generateRecommendations(projectResult);

    const report = {
      ...projectResult,
      recommendations,
      metadata: {
        generatedAt: new Date().toISOString(),
        bufferRules: this.bufferRules,
        version: '1.0.0',
      },
    };

    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const fileName = outputPath || `buffer-time-analysis-${Date.now()}.json`;
    const filePath = path.join(reportsDir, fileName);

    fs.writeFileSync(filePath, JSON.stringify(report, null, 2));

    console.log(`\n📄 Отчет сохранен: ${filePath}`);

    return { report, filePath };
  }

  loadTasksFromFile(filePath) {
    console.log(`📂 Загрузка задач из файла: ${filePath}`);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Файл не найден: ${filePath}`);
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);

      if (Array.isArray(data)) {
        return data;
      } else if (data.tasks && Array.isArray(data.tasks)) {
        return data.tasks;
      } else {
        throw new Error('Файл должен содержать массив задач или объект с полем tasks');
      }
    } catch (error) {
      throw new Error(`Ошибка чтения файла: ${error.message}`);
    }
  }

  generateSampleTasks() {
    return [
      {
        name: 'Настройка проекта',
        estimatedTime: 4,
        complexity: 'low',
        risk: 'low',
        taskType: 'setup',
        experience: 'senior',
      },
      {
        name: 'Разработка API',
        estimatedTime: 16,
        complexity: 'high',
        risk: 'medium',
        taskType: 'development',
        experience: 'middle',
        dependencies: ['database', 'auth'],
      },
      {
        name: 'Интеграция с внешним сервисом',
        estimatedTime: 8,
        complexity: 'medium',
        risk: 'high',
        taskType: 'integration',
        experience: 'senior',
        hasExternalDeps: true,
      },
      {
        name: 'Тестирование',
        estimatedTime: 12,
        complexity: 'medium',
        risk: 'medium',
        taskType: 'testing',
        experience: 'middle',
        dependencies: ['api', 'frontend'],
      },
      {
        name: 'Развертывание',
        estimatedTime: 6,
        complexity: 'medium',
        risk: 'high',
        taskType: 'deployment',
        experience: 'senior',
        isBlocking: true,
      },
    ];
  }
}

async function main() {
  const calculator = new BufferTimeCalculator();

  try {
    console.log('🚀 Запуск расчета буферного времени...\n');

    // Проверяем аргументы командной строки
    const args = process.argv.slice(2);
    let tasks;

    if (args.length > 0 && args[0] !== '--sample') {
      // Загружаем задачи из файла
      tasks = calculator.loadTasksFromFile(args[0]);
    } else {
      // Используем примеры задач
      console.log(
        '📝 Используются примеры задач (используйте --sample или укажите путь к файлу)\n'
      );
      tasks = calculator.generateSampleTasks();
    }

    // Рассчитываем буферное время
    const result = calculator.calculateProjectBuffer(tasks);

    // Сохраняем отчет
    const { report, filePath } = calculator.saveReport(result);

    // Выводим рекомендации
    if (report.recommendations.length > 0) {
      console.log('\n💡 Рекомендации:');
      report.recommendations.forEach((rec, index) => {
        const icon = rec.type === 'critical' ? '🔴' : rec.type === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`   ${icon} ${rec.message}`);
        console.log(`      Действие: ${rec.action}`);
        if (rec.tasks) {
          console.log(`      Задачи: ${rec.tasks.join(', ')}`);
        }
      });
    }

    console.log('\n🎉 Расчет завершен успешно!');

    return result;
  } catch (error) {
    console.error('💥 Ошибка при расчете буферного времени:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { BufferTimeCalculator, main };
