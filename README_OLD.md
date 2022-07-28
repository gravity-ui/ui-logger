# UI logger

## Использование

```bash
npm i @yandex-cloud/ui-logger
```

```ts
import logger from '@yandex-cloud/ui-logger';

try {
  // logger.log(message: string, extraData?: Record<string, unknown>);
  logger.log('Info событие', {extraInfo: 'Extra data'});
} catch (error) {
  // logger.logError(message: string, error?: Error, extraData?: Record<string, unknown>);
  logger.logError('Error событие', error, {extraError: 'Extra data'});
}

// получить все записанные логи
const logs = logger.getLogs();
```

## Именованные логгеры

По умолчанию логи пишутся в `namespace` с именем `default`.

Возможные причины создания своего `namespace`:

- Логически разбить логи большого приложения.
- Для определенных ошибок нужен кастомный [парсер ошибок](#настройки).

```ts
import logger from '@yandex-cloud/ui-logger';

// Вернет или создаст новый инстанс логгера с именем my_namespace
const namedLogger = logger.get('my_namespace');
namedLogger.log('Запишет в скоуп my_namespace');

const anotherOneLogger = namedLogger.get('another_one');
namedLogger.log('Запишет в скоуп another_one');
```

## Настройки

Настройки могут быть как глобальными для всех логгеров, так и локальными для определенного логгера.

```ts
import logger from '@yandex-cloud/ui-logger';

type DefaultSettings = {
  // Количество записей логов для каждого namespace. По умолчанию 1000.
  bufferSize: number;
  // Функция для парсинга ошибки в logError.
  parseError: (error: Error) => Record<string, unknown>;
  // Печатать log, logError в консоль. По умолчанию true.
  printLog: boolean;
  // Функция callback, которая вызывается при каждом вызове logError с теми же аргументами, что и logError
  logErrorCallback: ((message: string, error?: Error, data?: ExtraData) => void) | null;
};

// изменит количество записей для всех логгеров
logger.setDefault({bufferSize: 200});

type LoggerSettings = {
  bufferSize: number;
  parseError: (error: Error) => Record<string, unknown>;
  logErrorCallback: ((message: string, error?: Error, data?: ExtraData) => void) | null;
};

const namedLogger = logger.get('name');
function namedParseError(error: Error) {
  return {message: error.message, meta: {}};
}

// изменит parseError только для логгера `name`
namedLogger.setSettings({parseError: namedParseError});
```
