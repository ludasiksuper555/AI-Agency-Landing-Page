const fs = require('fs');
const path = require('path');

class FallbackPlansGenerator {
  constructor() {
    this.planTypes = {
      optimal: {
        name: 'Оптимальный план',
        description: 'Лучший сценарий с полной функциональностью',
        riskTolerance: 'low',
        timeBuffer: 1.1,
      },
      alternative: {
        name: 'Альтернативный план',
        description: 'Компромиссный вариант с основной функциональностью',
        riskTolerance: 'medium',
        timeBuffer: 1.3,
      },
      minimal: {
        name: 'Минимальный план',
        description: 'Базовая функциональность, критически важные фичи',
        riskTolerance: 'high',
        timeBuffer: 1.5,
      },
      emergency: {
        name: 'Аварийный план',
        description: 'Минимум для запуска, только критичные компоненты',
        riskTolerance: 'critical',
        timeBuffer: 2.0,
      },
    };

    this.riskFactors = {
      technical: {
        name: 'Технические риски',
        factors: [
          'Сложность интеграции',
          'Производительность',
          'Совместимость',
          'Безопасность',
          'Масштабируемость',
        ],
      },
      resource: {
        name: 'Ресурсные риски',
        factors: [
          'Недостаток времени',
          'Недостаток экспертизы',
          'Недоступность команды',
          'Бюджетные ограничения',
          'Инфраструктурные ограничения',
        ],
      },
      external: {
        name: 'Внешние риски',
        factors: [
          'Изменения требований',
          'Недоступность внешних API',
          'Проблемы с поставщиками',
          'Регуляторные изменения',
          'Конкурентное давление',
        ],
      },
      business: {
        name: 'Бизнес-риски',
        factors: [
          'Изменение приоритетов',
          'Потеря заинтересованных сторон',
          'Изменение бюджета',
          'Рыночные изменения',
          'Стратегические изменения',
        ],
      },
    };

    this.escalationLevels = [
      {
        level: 1,
        name: 'Команда разработки',
        description: 'Решение на уровне команды',
        timeLimit: '2 часа',
        authority: 'team-lead',
      },
      {
        level: 2,
        name: 'Техническое руководство',
        description: 'Привлечение технического руководителя',
        timeLimit: '4 часа',
        authority: 'tech-lead',
      },
      {
        level: 3,
        name: 'Проектное руководство',
        description: 'Решение на уровне проект-менеджера',
        timeLimit: '8 часов',
        authority: 'project-manager',
      },
      {
        level: 4,
        name: 'Высшее руководство',
        description: 'Критическое решение на уровне руководства',
        timeLimit: '24 часа',
        authority: 'executive',
      },
    ];
  }

  generateFallbackPlans(project) {
    console.log('🔄 Генерация планов отката...');

    const { name, stages = [], constraints = {}, priorities = [], risks = [] } = project;

    if (!name || stages.length === 0) {
      throw new Error('Проект должен содержать название и этапы');
    }

    const plans = {};

    // Генерируем каждый тип плана
    Object.keys(this.planTypes).forEach(planType => {
      console.log(`   📋 Создание ${this.planTypes[planType].name.toLowerCase()}...`);
      plans[planType] = this.createPlan(project, planType);
    });

    // Создаем матрицу принятия решений
    const decisionMatrix = this.createDecisionMatrix(project, plans);

    // Создаем пути эскалации
    const escalationPaths = this.createEscalationPaths(project, risks);

    const result = {
      project: {
        name,
        originalStages: stages.length,
        constraints,
        priorities,
        risks,
      },
      plans,
      decisionMatrix,
      escalationPaths,
      metadata: {
        generatedAt: new Date().toISOString(),
        version: '1.0.0',
      },
    };

    console.log('   ✅ Планы отката созданы успешно');
    return result;
  }

  createPlan(project, planType) {
    const planConfig = this.planTypes[planType];
    const { stages, constraints = {}, priorities = [] } = project;

    // Фильтруем этапы по важности для данного типа плана
    const filteredStages = this.filterStagesByPlan(stages, planType, priorities);

    // Корректируем временные оценки
    const adjustedStages = this.adjustStageTimings(filteredStages, planConfig.timeBuffer);

    // Определяем компромиссы
    const tradeoffs = this.identifyTradeoffs(stages, filteredStages, planType);

    // Определяем критерии успеха
    const successCriteria = this.defineSuccessCriteria(planType, filteredStages);

    // Определяем условия активации
    const activationConditions = this.defineActivationConditions(planType, project.risks || []);

    return {
      type: planType,
      name: planConfig.name,
      description: planConfig.description,
      stages: adjustedStages,
      tradeoffs,
      successCriteria,
      activationConditions,
      estimatedTime: adjustedStages.reduce((sum, stage) => sum + (stage.estimatedTime || 0), 0),
      riskLevel: planConfig.riskTolerance,
      confidence: this.calculateConfidence(planType, filteredStages),
    };
  }

  filterStagesByPlan(stages, planType, priorities) {
    const priorityMap = {
      optimal: ['critical', 'high', 'medium', 'low'],
      alternative: ['critical', 'high', 'medium'],
      minimal: ['critical', 'high'],
      emergency: ['critical'],
    };

    const allowedPriorities = priorityMap[planType] || ['critical'];

    return stages
      .filter(stage => {
        const stagePriority = stage.priority || 'medium';
        return allowedPriorities.includes(stagePriority);
      })
      .map(stage => ({
        ...stage,
        planType,
        included: true,
        reason: `Включен в ${this.planTypes[planType].name.toLowerCase()}`,
      }));
  }

  adjustStageTimings(stages, timeBuffer) {
    return stages.map(stage => {
      const originalTime = stage.estimatedTime || 0;
      const adjustedTime = Math.round(originalTime * timeBuffer);

      return {
        ...stage,
        originalEstimatedTime: originalTime,
        estimatedTime: adjustedTime,
        timeBuffer: adjustedTime - originalTime,
        bufferPercentage:
          originalTime > 0 ? Math.round(((adjustedTime - originalTime) / originalTime) * 100) : 0,
      };
    });
  }

  identifyTradeoffs(originalStages, filteredStages, planType) {
    const removedStages = originalStages.filter(
      original =>
        !filteredStages.find(
          filtered => filtered.id === original.id || filtered.name === original.name
        )
    );

    const tradeoffs = {
      removedFeatures: removedStages.map(stage => ({
        name: stage.name,
        impact: stage.businessValue || 'medium',
        reason: `Исключен из ${this.planTypes[planType].name.toLowerCase()}`,
      })),
      reducedQuality: [],
      increasedRisk: [],
      resourceSavings: {
        time: removedStages.reduce((sum, stage) => sum + (stage.estimatedTime || 0), 0),
        effort: removedStages.length,
      },
    };

    // Анализируем влияние на качество
    if (planType === 'minimal' || planType === 'emergency') {
      tradeoffs.reducedQuality.push({
        area: 'Тестирование',
        impact: 'Сокращенное тестирование',
        mitigation: 'Фокус на критических путях',
      });
    }

    if (planType === 'emergency') {
      tradeoffs.reducedQuality.push({
        area: 'Документация',
        impact: 'Минимальная документация',
        mitigation: 'Документирование после запуска',
      });

      tradeoffs.increasedRisk.push({
        type: 'Технический долг',
        probability: 'high',
        impact: 'medium',
        mitigation: 'Планирование рефакторинга',
      });
    }

    return tradeoffs;
  }

  defineSuccessCriteria(planType, stages) {
    const baseCriteria = {
      optimal: [
        'Все функции работают корректно',
        'Производительность соответствует требованиям',
        'Полное покрытие тестами',
        'Документация завершена',
      ],
      alternative: [
        'Основные функции работают',
        'Приемлемая производительность',
        'Критические тесты пройдены',
        'Базовая документация готова',
      ],
      minimal: ['Критические функции работают', 'Система стабильна', 'Основные тесты пройдены'],
      emergency: ['Система запускается', 'Критические функции доступны', 'Нет критических ошибок'],
    };

    const stageCriteria = stages.map(stage => ({
      stage: stage.name,
      criteria: stage.successCriteria || [`${stage.name} завершен успешно`],
    }));

    return {
      general: baseCriteria[planType] || baseCriteria.emergency,
      stages: stageCriteria,
      metrics: this.defineMetrics(planType),
    };
  }

  defineMetrics(planType) {
    const metricsMap = {
      optimal: {
        performance: { target: '< 2s', critical: '< 5s' },
        availability: { target: '99.9%', critical: '99%' },
        errorRate: { target: '< 0.1%', critical: '< 1%' },
      },
      alternative: {
        performance: { target: '< 3s', critical: '< 7s' },
        availability: { target: '99%', critical: '95%' },
        errorRate: { target: '< 0.5%', critical: '< 2%' },
      },
      minimal: {
        performance: { target: '< 5s', critical: '< 10s' },
        availability: { target: '95%', critical: '90%' },
        errorRate: { target: '< 1%', critical: '< 5%' },
      },
      emergency: {
        performance: { target: '< 10s', critical: '< 30s' },
        availability: { target: '90%', critical: '80%' },
        errorRate: { target: '< 5%', critical: '< 10%' },
      },
    };

    return metricsMap[planType] || metricsMap.emergency;
  }

  defineActivationConditions(planType, risks) {
    const timeBasedConditions = {
      optimal: [],
      alternative: ['Отставание от графика на 20%', 'Недоступность ключевого ресурса на 1-2 дня'],
      minimal: [
        'Отставание от графика на 40%',
        'Критические технические проблемы',
        'Недоступность ключевого ресурса на 3+ дня',
      ],
      emergency: [
        'Отставание от графика на 60%+',
        'Критические системные сбои',
        'Потеря ключевых ресурсов',
        'Изменение критических требований',
      ],
    };

    const riskBasedConditions = risks.map(risk => ({
      risk: risk.name || risk.type,
      condition: `Реализация риска: ${risk.name || risk.type}`,
      probability: risk.probability || 'medium',
      impact: risk.impact || 'medium',
    }));

    return {
      timeBased: timeBasedConditions[planType] || [],
      riskBased: riskBasedConditions,
      manual: ['Решение команды', 'Решение руководства', 'Изменение внешних условий'],
    };
  }

  calculateConfidence(planType, stages) {
    const baseConfidence = {
      optimal: 0.7,
      alternative: 0.8,
      minimal: 0.9,
      emergency: 0.95,
    };

    const stageComplexity = stages.reduce((sum, stage) => {
      const complexity = stage.complexity || 'medium';
      const complexityScore = { low: 1, medium: 2, high: 3, critical: 4 };
      return sum + (complexityScore[complexity] || 2);
    }, 0);

    const avgComplexity = stages.length > 0 ? stageComplexity / stages.length : 2;
    const complexityAdjustment = (4 - avgComplexity) * 0.05; // Корректировка на основе сложности

    const confidence = Math.min(
      0.99,
      Math.max(0.5, baseConfidence[planType] + complexityAdjustment)
    );
    return Math.round(confidence * 100) / 100;
  }

  createDecisionMatrix(project, plans) {
    console.log('   🎯 Создание матрицы принятия решений...');

    const criteria = [
      { name: 'Время выполнения', weight: 0.3, type: 'time' },
      { name: 'Функциональность', weight: 0.25, type: 'features' },
      { name: 'Риск', weight: 0.2, type: 'risk' },
      { name: 'Ресурсы', weight: 0.15, type: 'resources' },
      { name: 'Качество', weight: 0.1, type: 'quality' },
    ];

    const matrix = Object.keys(plans).map(planType => {
      const plan = plans[planType];
      const scores = {};

      // Оценка по времени (меньше = лучше)
      scores.time = Math.max(0, 10 - plan.estimatedTime / 10);

      // Оценка по функциональности (больше этапов = лучше)
      scores.features = (plan.stages.length / project.originalStages) * 10;

      // Оценка по риску (выше уверенность = лучше)
      scores.risk = plan.confidence * 10;

      // Оценка по ресурсам (меньше этапов = меньше ресурсов = лучше)
      scores.resources = Math.max(0, 10 - plan.stages.length);

      // Оценка по качеству (зависит от типа плана)
      const qualityMap = { optimal: 10, alternative: 7, minimal: 5, emergency: 3 };
      scores.quality = qualityMap[planType] || 5;

      // Взвешенная оценка
      const weightedScore = criteria.reduce((sum, criterion) => {
        return sum + scores[criterion.type] * criterion.weight;
      }, 0);

      return {
        plan: planType,
        name: plan.name,
        scores,
        weightedScore: Math.round(weightedScore * 100) / 100,
        recommendation: this.getRecommendation(planType, weightedScore),
      };
    });

    // Сортируем по взвешенной оценке
    matrix.sort((a, b) => b.weightedScore - a.weightedScore);

    return {
      criteria,
      evaluations: matrix,
      recommended: matrix[0],
      timestamp: new Date().toISOString(),
    };
  }

  getRecommendation(planType, score) {
    if (score >= 8) return 'Отличный выбор';
    if (score >= 6) return 'Хороший вариант';
    if (score >= 4) return 'Приемлемый вариант';
    return 'Рискованный выбор';
  }

  createEscalationPaths(project, risks) {
    console.log('   🚨 Создание путей эскалации...');

    const paths = risks.map(risk => {
      const riskLevel = this.assessRiskLevel(risk);
      const escalationLevel = this.determineEscalationLevel(riskLevel);

      return {
        risk: risk.name || risk.type,
        description: risk.description || 'Описание отсутствует',
        probability: risk.probability || 'medium',
        impact: risk.impact || 'medium',
        riskLevel,
        escalationLevel,
        escalationPath: this.escalationLevels.slice(0, escalationLevel),
        actions: this.defineEscalationActions(risk, escalationLevel),
        timeline: this.createEscalationTimeline(escalationLevel),
      };
    });

    return {
      paths,
      generalEscalation: this.escalationLevels,
      emergencyContacts: this.defineEmergencyContacts(),
      communicationProtocol: this.defineCommunicationProtocol(),
    };
  }

  assessRiskLevel(risk) {
    const probabilityScore = { low: 1, medium: 2, high: 3, critical: 4 };
    const impactScore = { low: 1, medium: 2, high: 3, critical: 4 };

    const probScore = probabilityScore[risk.probability] || 2;
    const impScore = impactScore[risk.impact] || 2;

    const totalScore = probScore * impScore;

    if (totalScore >= 12) return 'critical';
    if (totalScore >= 8) return 'high';
    if (totalScore >= 4) return 'medium';
    return 'low';
  }

  determineEscalationLevel(riskLevel) {
    const levelMap = {
      low: 1,
      medium: 2,
      high: 3,
      critical: 4,
    };

    return levelMap[riskLevel] || 2;
  }

  defineEscalationActions(risk, escalationLevel) {
    const actions = [];

    // Уровень 1: Команда
    actions.push({
      level: 1,
      action: 'Анализ проблемы командой',
      responsible: 'team-lead',
      timeframe: '2 часа',
    });

    if (escalationLevel >= 2) {
      actions.push({
        level: 2,
        action: 'Техническая консультация',
        responsible: 'tech-lead',
        timeframe: '4 часа',
      });
    }

    if (escalationLevel >= 3) {
      actions.push({
        level: 3,
        action: 'Пересмотр планов и ресурсов',
        responsible: 'project-manager',
        timeframe: '8 часов',
      });
    }

    if (escalationLevel >= 4) {
      actions.push({
        level: 4,
        action: 'Критическое решение руководства',
        responsible: 'executive',
        timeframe: '24 часа',
      });
    }

    return actions;
  }

  createEscalationTimeline(escalationLevel) {
    const timeline = [];
    let cumulativeTime = 0;

    for (let i = 1; i <= escalationLevel; i++) {
      const level = this.escalationLevels[i - 1];
      const timeInHours = parseInt(level.timeLimit);

      timeline.push({
        level: i,
        startTime: cumulativeTime,
        endTime: cumulativeTime + timeInHours,
        duration: timeInHours,
        description: level.description,
      });

      cumulativeTime += timeInHours;
    }

    return timeline;
  }

  defineEmergencyContacts() {
    return [
      {
        role: 'Технический лидер',
        availability: '24/7',
        contact: 'tech-lead@company.com',
        phone: '+7-XXX-XXX-XXXX',
      },
      {
        role: 'Проект-менеджер',
        availability: 'Рабочие часы + экстренные случаи',
        contact: 'pm@company.com',
        phone: '+7-XXX-XXX-XXXX',
      },
      {
        role: 'DevOps инженер',
        availability: '24/7 (инфраструктурные проблемы)',
        contact: 'devops@company.com',
        phone: '+7-XXX-XXX-XXXX',
      },
    ];
  }

  defineCommunicationProtocol() {
    return {
      channels: {
        normal: 'Slack #project-channel',
        urgent: 'Slack #incidents + Email',
        critical: 'Phone + Slack #critical + Email',
      },
      updateFrequency: {
        normal: 'Ежедневно',
        urgent: 'Каждые 4 часа',
        critical: 'Каждый час',
      },
      stakeholders: [
        'Команда разработки',
        'Проект-менеджер',
        'Техническое руководство',
        'Бизнес-заказчик',
      ],
    };
  }

  saveReport(fallbackResult, outputPath = null) {
    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const fileName = outputPath || `fallback-plans-${Date.now()}.json`;
    const filePath = path.join(reportsDir, fileName);

    fs.writeFileSync(filePath, JSON.stringify(fallbackResult, null, 2));

    console.log(`\n📄 Отчет по планам отката сохранен: ${filePath}`);

    return { report: fallbackResult, filePath };
  }

  generateSampleProject() {
    return {
      name: 'Веб-приложение для управления задачами',
      constraints: {
        deadline: '2024-02-01',
        budget: 100000,
        teamSize: 5,
      },
      priorities: ['critical', 'high', 'medium', 'low'],
      risks: [
        {
          name: 'Интеграция с внешним API',
          type: 'technical',
          probability: 'medium',
          impact: 'high',
          description: 'Возможные проблемы с интеграцией внешнего API',
        },
        {
          name: 'Недоступность ключевого разработчика',
          type: 'resource',
          probability: 'low',
          impact: 'high',
          description: 'Болезнь или увольнение ключевого разработчика',
        },
        {
          name: 'Изменение требований',
          type: 'business',
          probability: 'high',
          impact: 'medium',
          description: 'Изменение бизнес-требований в процессе разработки',
        },
      ],
      stages: [
        {
          id: 1,
          name: 'Настройка проекта',
          estimatedTime: 8,
          priority: 'critical',
          complexity: 'low',
          businessValue: 'high',
        },
        {
          id: 2,
          name: 'Разработка API',
          estimatedTime: 40,
          priority: 'critical',
          complexity: 'high',
          businessValue: 'critical',
        },
        {
          id: 3,
          name: 'Разработка фронтенда',
          estimatedTime: 32,
          priority: 'high',
          complexity: 'medium',
          businessValue: 'high',
        },
        {
          id: 4,
          name: 'Интеграция с внешними сервисами',
          estimatedTime: 16,
          priority: 'medium',
          complexity: 'high',
          businessValue: 'medium',
        },
        {
          id: 5,
          name: 'Тестирование',
          estimatedTime: 24,
          priority: 'high',
          complexity: 'medium',
          businessValue: 'high',
        },
        {
          id: 6,
          name: 'Документация',
          estimatedTime: 16,
          priority: 'medium',
          complexity: 'low',
          businessValue: 'low',
        },
        {
          id: 7,
          name: 'Развертывание',
          estimatedTime: 8,
          priority: 'critical',
          complexity: 'medium',
          businessValue: 'critical',
        },
        {
          id: 8,
          name: 'Мониторинг и аналитика',
          estimatedTime: 12,
          priority: 'low',
          complexity: 'medium',
          businessValue: 'low',
        },
      ],
    };
  }
}

async function main() {
  const generator = new FallbackPlansGenerator();

  try {
    console.log('🚀 Запуск генерации планов отката...\n');

    // Проверяем аргументы командной строки
    const args = process.argv.slice(2);
    let project;

    if (args.length > 0 && args[0] !== '--sample') {
      // Загружаем проект из файла
      console.log(`📂 Загрузка проекта из файла: ${args[0]}`);

      if (!fs.existsSync(args[0])) {
        throw new Error(`Файл не найден: ${args[0]}`);
      }

      const content = fs.readFileSync(args[0], 'utf8');
      project = JSON.parse(content);
    } else {
      // Используем пример проекта
      console.log(
        '📝 Используется пример проекта (используйте --sample или укажите путь к файлу)\n'
      );
      project = generator.generateSampleProject();
    }

    // Генерируем планы отката
    const result = generator.generateFallbackPlans(project);

    // Сохраняем отчет
    const { report, filePath } = generator.saveReport(result);

    // Выводим краткую сводку
    console.log('\n📊 Сводка по планам отката:');
    Object.keys(result.plans).forEach(planType => {
      const plan = result.plans[planType];
      console.log(`   ${plan.name}:`);
      console.log(`      Этапов: ${plan.stages.length}`);
      console.log(`      Время: ${plan.estimatedTime}ч`);
      console.log(`      Уверенность: ${plan.confidence * 100}%`);
    });

    console.log(`\n🎯 Рекомендуемый план: ${result.decisionMatrix.recommended.name}`);
    console.log(`   Оценка: ${result.decisionMatrix.recommended.weightedScore}/10`);
    console.log(`   Рекомендация: ${result.decisionMatrix.recommended.recommendation}`);

    console.log('\n🎉 Генерация планов отката завершена успешно!');

    return result;
  } catch (error) {
    console.error('💥 Ошибка при генерации планов отката:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { FallbackPlansGenerator, main };
