# UI logger

## Usage

```bash
npm i @gravity-ui/ui-logger
```

```ts
import logger from '@gravity-ui/ui-logger';

try {
  // logger.log(message: string, extraData?: Record<string, unknown>);
  logger.log('Info event', {extraInfo: 'Extra data'});
} catch (error) {
  // logger.logError(message: string, error?: Error, extraData?: Record<string, unknown>);
  logger.logError('Error event', error, {extraError: 'Extra data'});
}

// get all recorded logs
const logs = logger.getLogs();
```

## Named loggers

By default, logs are written to `namespace` with the name `default`.

Possible reasons to create your own `namespace`:

- Logically split logs of a large application.
- For certain errors, you need a custom [error parser](#settings).

```ts
import logger from '@gravity-ui/ui-logger';

// Returns or creates a new logger instance with the name my_namespace
const namedLogger = logger.get('my_namespace');
namedLogger.log('Will record to scope my_namespace');

const anotherOneLogger = namedLogger.get('another_one');
namedLogger.log('Will record to scope another_one');
```

## Settings

The settings can be either global for all loggers or local for a specific logger.

```ts
import logger from '@gravity-ui/ui-logger';

type DefaultSettings = {
  // The number of log records for each namespace. By default, 1000.
  bufferSize: number;
  // Function for error parsing in logError.
  parseError: (error: Error) => Record<string, unknown>;
  // Print log, logError to the console. By default, true.
  printLog: boolean;
  // Callback function that is called every time logError is called with the same arguments as logError
  logErrorCallback: ((message: string, error?: Error, data?: ExtraData) => void) | null;
};

// will change the number of records for all loggers
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

// will change ParseError only for logger `name`
namedLogger.setSettings({parseError: namedParseError});
```
